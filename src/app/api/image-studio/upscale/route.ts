import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { upscaleImage } from "@/lib/upscale/real-esrgan";
import { runQC } from "@/lib/qc/qc-engine";
import { PRINT_TARGETS } from "@/lib/qc/types";
import { formatUpstreamError } from "@/lib/api-errors";
import { db } from "@/db";
import { imageGenerations } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const printTargetId = (form.get("printTarget") as string) || "adult-front";
  const printTarget =
    PRINT_TARGETS.find((p) => p.id === printTargetId) ?? PRINT_TARGETS[1];
  const parentId = (form.get("parentId") as string) || null;

  // Determine the target pixel size we need.
  // smallest dimension at the destination ≥ minPrintInches × 300
  const minPrintIn = Math.min(printTarget.widthIn, printTarget.heightIn);
  const targetMin = Math.ceil(minPrintIn * 300);

  // Read source dims via sharp.
  const sourceBuf = Buffer.from(await file.arrayBuffer());
  const sourceMeta = await sharp(sourceBuf).metadata();
  const sourceWidth = sourceMeta.width ?? 0;
  const sourceHeight = sourceMeta.height ?? 0;

  if (!sourceWidth || !sourceHeight) {
    return NextResponse.json({ error: "Could not read source image dimensions" }, { status: 400 });
  }

  // Real-ESRGAN needs a fetchable URL. We pass a data URI.
  const dataUri = `data:${file.type || "image/png"};base64,${sourceBuf.toString("base64")}`;

  let upscaleResult;
  try {
    upscaleResult = await upscaleImage(dataUri, sourceWidth, sourceHeight, targetMin);
  } catch (err) {
    const formatted = formatUpstreamError(err);
    const headers: Record<string, string> = {};
    if (formatted.retryAfterSec) headers["Retry-After"] = String(formatted.retryAfterSec);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind, retryAfterSec: formatted.retryAfterSec },
      { status: formatted.status, headers }
    );
  }

  // Fetch the result, run QC, and stream back.
  const upscaledRes = await fetch(upscaleResult.imageUrl);
  if (!upscaledRes.ok) {
    return NextResponse.json(
      { error: `Failed to fetch upscaled image (${upscaledRes.status})` },
      { status: 502 }
    );
  }
  const upscaledBuf = Buffer.from(await upscaledRes.arrayBuffer());

  let qc;
  try {
    qc = await runQC(upscaledBuf, printTarget);
  } catch (err) {
    console.error("QC engine error during upscale:", err);
    qc = null;
  }

  // Persist as a derivative record.
  let recordId: string | null = null;
  try {
    if (process.env.DATABASE_URL) {
      const inserted = await db
        .insert(imageGenerations)
        .values({
          prompt: `[upscale ${upscaleResult.scale}x]`,
          tier: "upscale",
          model: "nightmareai/real-esrgan",
          resolution: "4K",
          printTarget: printTarget.id,
          imageUrl: upscaleResult.imageUrl,
          widthPx: qc?.widthPx ?? null,
          heightPx: qc?.heightPx ?? null,
          effectiveDpi: qc?.effectiveDpi ?? null,
          qcResults: qc ? (qc as unknown as Record<string, unknown>) : null,
          upscaled: true,
          upscaleParentId: parentId,
          costUsd: upscaleResult.costUsd.toFixed(4),
        })
        .returning({ id: imageGenerations.id });
      recordId = inserted[0]?.id ?? null;
    }
  } catch (err) {
    console.error("Failed to persist upscale record:", err);
  }

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "X-Tier": "upscale",
    "X-Scale": String(upscaleResult.scale),
    "X-Cost-Usd": upscaleResult.costUsd.toFixed(4),
    "X-Print-Target": printTarget.id,
  };
  if (recordId) headers["X-Generation-Id"] = recordId;
  if (qc) headers["X-QC-Result"] = encodeURIComponent(JSON.stringify(qc));

  return new NextResponse(new Uint8Array(upscaledBuf), {
    status: 200,
    headers,
  });
}
