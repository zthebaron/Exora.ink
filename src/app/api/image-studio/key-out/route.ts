import { NextRequest, NextResponse } from "next/server";
import { keyOutMagenta } from "@/lib/chroma-key/key-out-magenta";
import { runQC } from "@/lib/qc/qc-engine";
import { PRINT_TARGETS } from "@/lib/qc/types";
import { formatUpstreamError } from "@/lib/api-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const toleranceParam = parseInt((form.get("tolerance") as string) || "", 10);
  const tolerance = Number.isFinite(toleranceParam) ? toleranceParam : undefined;

  const sourceBuf = Buffer.from(await file.arrayBuffer());

  let result;
  try {
    result = await keyOutMagenta(sourceBuf, { tolerance });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind },
      { status: formatted.status }
    );
  }

  // Re-run QC on the keyed output. Transparency check should now pass and
  // edge bleed should be tighter (nothing magenta left to confuse it).
  let qc = null;
  try {
    qc = await runQC(result.buffer, printTarget);
  } catch (err) {
    console.error("QC failed after key-out:", err);
  }

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "X-Width": String(result.width),
    "X-Height": String(result.height),
    "X-Pixels-Keyed": String(result.pixelsKeyed),
    "X-Total-Pixels": String(result.totalPixels),
    "X-Bg-Ratio": result.bgRatio.toFixed(4),
  };
  if (qc) headers["X-QC-Result"] = encodeURIComponent(JSON.stringify(qc));

  return new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });
}
