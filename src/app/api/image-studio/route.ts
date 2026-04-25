import { NextRequest, NextResponse } from "next/server";
import {
  generatePreview,
  generateProduction,
  type AspectRatio,
  type GenerationTier,
  type ImageReference,
} from "@/lib/gemini/image-generation";
import { runQC } from "@/lib/qc/qc-engine";
import { PRINT_TARGETS } from "@/lib/qc/types";
import { formatUpstreamError } from "@/lib/api-errors";
import { db } from "@/db";
import { imageGenerations } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 180; // production tier 4K can be slow

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

function isAspectRatio(v: string | null): v is AspectRatio {
  return v !== null && (ASPECT_RATIOS as string[]).includes(v);
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const tier: GenerationTier =
    (form.get("tier") as string) === "production" ? "production" : "preview";
  const prompt = ((form.get("prompt") as string) || "").trim();
  const aspectInput = form.get("aspectRatio") as string | null;
  const aspectRatio: AspectRatio = isAspectRatio(aspectInput) ? aspectInput : "1:1";
  const printTargetId = (form.get("printTarget") as string) || "adult-front";
  const printTarget =
    PRINT_TARGETS.find((p) => p.id === printTargetId) ?? PRINT_TARGETS[1];

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "Prompt is too long (4000 char max)" }, { status: 400 });
  }

  // Build reference images for edit mode.
  const refs: ImageReference[] = [];
  const images = form.getAll("image").filter((v): v is File => v instanceof File);
  for (const img of images) {
    if (img.size === 0) continue;
    if (img.size > 12 * 1024 * 1024) {
      return NextResponse.json(
        { error: `Image "${img.name}" exceeds 12MB` },
        { status: 413 }
      );
    }
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(img.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${img.type}` },
        { status: 400 }
      );
    }
    const buffer = await img.arrayBuffer();
    refs.push({
      mimeType: img.type === "image/jpg" ? "image/jpeg" : img.type,
      data: Buffer.from(buffer).toString("base64"),
    });
  }

  // Generate.
  let generation;
  try {
    generation =
      tier === "production"
        ? await generateProduction(prompt, refs.length ? refs : undefined, aspectRatio)
        : await generatePreview(prompt, refs.length ? refs : undefined, aspectRatio);
  } catch (err) {
    const formatted = formatUpstreamError(err);
    const headers: Record<string, string> = {};
    if (formatted.retryAfterSec) {
      headers["Retry-After"] = String(formatted.retryAfterSec);
    }
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind, retryAfterSec: formatted.retryAfterSec },
      { status: formatted.status, headers }
    );
  }

  // Run QC server-side (sharp + exifr) on the resulting buffer.
  let qc;
  try {
    qc = await runQC(generation.buffer, printTarget);
  } catch (err) {
    // QC failure shouldn't block returning the image — report a minimal result.
    console.error("QC engine error:", err);
    qc = null;
  }

  // Persist to DB (best-effort — failures don't break the response).
  let recordId: string | null = null;
  try {
    if (process.env.DATABASE_URL) {
      const inserted = await db
        .insert(imageGenerations)
        .values({
          prompt,
          tier,
          model: generation.model,
          resolution: generation.resolution,
          aspectRatio,
          printTarget: printTarget.id,
          imageUrl: `inline:${generation.buffer.byteLength}`, // image bytes are streamed back; no persistent URL yet
          widthPx: qc?.widthPx ?? null,
          heightPx: qc?.heightPx ?? null,
          effectiveDpi: qc?.effectiveDpi ?? null,
          qcResults: qc ? (qc as unknown as Record<string, unknown>) : null,
          costUsd: generation.costUsd.toFixed(4),
        })
        .returning({ id: imageGenerations.id });
      recordId = inserted[0]?.id ?? null;
    }
  } catch (err) {
    console.error("Failed to persist generation record:", err);
  }

  // Stream the image bytes back, with QC results in headers (compact JSON).
  const headers: Record<string, string> = {
    "Content-Type": generation.mimeType,
    "Cache-Control": "no-store",
    "X-Tier": tier,
    "X-Model": generation.model,
    "X-Resolution": generation.resolution,
    "X-Cost-Usd": generation.costUsd.toFixed(4),
    "X-Aspect-Ratio": aspectRatio,
    "X-Print-Target": printTarget.id,
  };
  if (recordId) headers["X-Generation-Id"] = recordId;
  if (qc) {
    headers["X-QC-Result"] = encodeURIComponent(JSON.stringify(qc));
  }
  if (generation.text) {
    headers["X-Model-Text"] = encodeURIComponent(generation.text);
  }

  return new NextResponse(new Uint8Array(generation.buffer), {
    status: 200,
    headers,
  });
}
