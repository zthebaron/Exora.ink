import { NextRequest, NextResponse } from "next/server";
import { uploadToHotFolder } from "@/lib/dropbox/hot-folder";
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

  const filename = (form.get("filename") as string) || `dtf-${Date.now()}.png`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadToHotFolder(buffer, filename);
    return NextResponse.json({
      ok: true,
      path: result.path,
      shareLink: result.shareLink,
      bytes: result.bytes,
    });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind },
      { status: formatted.status }
    );
  }
}
