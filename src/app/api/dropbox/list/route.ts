import { NextRequest, NextResponse } from "next/server";
import { Dropbox, type files } from "dropbox";
import { getDropboxAuthState } from "@/lib/dropbox/hot-folder";
import { formatUpstreamError } from "@/lib/api-errors";

export const runtime = "nodejs";

const IMAGE_EXTS = /\.(png|jpe?g|webp|heic|heif|tiff?)$/i;
const MAX_BYTES = 12 * 1024 * 1024; // skip files >12MB to keep batch tractable

function getClient(): Dropbox {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (refreshToken && appKey && appSecret) {
    return new Dropbox({ refreshToken, clientId: appKey, clientSecret: appSecret });
  }
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  if (accessToken) {
    return new Dropbox({ accessToken });
  }
  throw new Error("Dropbox is not configured.");
}

export interface DropboxImageEntry {
  name: string;
  path: string;
  bytes: number;
  modified: string | null;
  oversize: boolean;
}

// GET /api/dropbox/list?path=/Apps/Exora-RIP/inbox
export async function GET(request: NextRequest) {
  const state = getDropboxAuthState();
  if (!state.ready) {
    return NextResponse.json(
      { error: `Dropbox not configured. Missing: ${"missing" in state ? state.missing.join(", ") : "credentials"}` },
      { status: 503 }
    );
  }

  const path = (request.nextUrl.searchParams.get("path") ?? "").trim();
  if (!path) {
    return NextResponse.json({ error: "path query param is required" }, { status: 400 });
  }

  try {
    const client = getClient();
    // Normalize: Dropbox API accepts the "" empty string for the root, but
    // explicit paths must start with "/".
    const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

    const entries: DropboxImageEntry[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const res: { result: files.ListFolderResult } = cursor
        ? await client.filesListFolderContinue({ cursor })
        : await client.filesListFolder({ path: normalized, recursive: false, limit: 1000 });

      for (const entry of res.result.entries) {
        if (entry[".tag"] !== "file") continue;
        const file = entry as files.FileMetadataReference;
        if (!IMAGE_EXTS.test(file.name)) continue;
        const bytes = file.size ?? 0;
        entries.push({
          name: file.name,
          path: file.path_lower ?? file.path_display ?? "",
          bytes,
          modified: file.client_modified ?? file.server_modified ?? null,
          oversize: bytes > MAX_BYTES,
        });
      }
      hasMore = res.result.has_more;
      cursor = res.result.cursor;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ entries, total: entries.length });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind },
      { status: formatted.status }
    );
  }
}
