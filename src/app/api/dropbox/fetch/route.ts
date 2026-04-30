import { NextRequest, NextResponse } from "next/server";
import { Dropbox, type files } from "dropbox";
import { getDropboxAuthState } from "@/lib/dropbox/hot-folder";
import { formatUpstreamError } from "@/lib/api-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

function getClient(): Dropbox {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (refreshToken && appKey && appSecret) {
    return new Dropbox({ refreshToken, clientId: appKey, clientSecret: appSecret });
  }
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  if (accessToken) return new Dropbox({ accessToken });
  throw new Error("Dropbox is not configured.");
}

// POST /api/dropbox/fetch  body: { path }
// Returns the file as a binary stream so the client can submit it back
// through the existing /api/image-studio edit pipeline as a Blob.
export async function POST(request: NextRequest) {
  const state = getDropboxAuthState();
  if (!state.ready) {
    return NextResponse.json({ error: "Dropbox not configured" }, { status: 503 });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const path = (body.path ?? "").trim();
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    const client = getClient();
    const res = await client.filesDownload({ path });
    const meta = res.result as files.FileMetadata & { fileBinary?: Buffer; fileBlob?: Blob };
    const buf: Buffer = Buffer.isBuffer(meta.fileBinary)
      ? meta.fileBinary
      : meta.fileBlob
      ? Buffer.from(await meta.fileBlob.arrayBuffer())
      : Buffer.alloc(0);

    if (buf.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 502 });
    }

    // Best-effort content type from filename
    const lower = (meta.name ?? "").toLowerCase();
    const contentType = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".webp")
      ? "image/webp"
      : lower.endsWith(".heic") || lower.endsWith(".heif")
      ? "image/heic"
      : "image/jpeg";

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${(meta.name ?? "image").replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
        "X-Source": "dropbox",
      },
    });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind },
      { status: formatted.status }
    );
  }
}
