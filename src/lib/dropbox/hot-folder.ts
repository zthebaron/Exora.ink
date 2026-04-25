/**
 * Dropbox hot-folder upload — final step of the Image Studio pipeline.
 *
 * The RIP machine watches a specific Dropbox folder (the "hot folder").
 * When we drop a print-ready PNG into that folder, the RIP picks it up
 * and processes it for printing.
 *
 * Auth — preferred path:
 *   DROPBOX_APP_KEY      — public app identifier
 *   DROPBOX_APP_SECRET   — app secret (private)
 *   DROPBOX_REFRESH_TOKEN — long-lived refresh token (one-time OAuth via
 *                           /admin/dropbox-auth)
 * The SDK auto-mints fresh access tokens from the refresh token. No manual
 * rotation needed.
 *
 * Fallback path (testing only):
 *   DROPBOX_ACCESS_TOKEN — short-lived token (4 hours), expires.
 */

import { Dropbox, type files } from "dropbox";

export interface HotFolderUploadResult {
  /** Dropbox path of the uploaded file. */
  path: string;
  /** A shareable link the operator can paste anywhere. */
  shareLink: string | null;
  /** File size in bytes. */
  bytes: number;
}

const DEFAULT_FOLDER = "/Apps/Exora-RIP/hot";

export function getDropboxAuthState():
  | { mode: "refresh"; ready: true }
  | { mode: "access-token"; ready: true }
  | { mode: "none"; ready: false; missing: string[] } {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;

  if (refreshToken && appKey && appSecret) {
    return { mode: "refresh", ready: true };
  }
  if (accessToken) {
    return { mode: "access-token", ready: true };
  }

  const missing: string[] = [];
  if (!appKey) missing.push("DROPBOX_APP_KEY");
  if (!appSecret) missing.push("DROPBOX_APP_SECRET");
  if (!refreshToken) missing.push("DROPBOX_REFRESH_TOKEN");
  return { mode: "none", ready: false, missing };
}

function getClient(): Dropbox {
  const state = getDropboxAuthState();
  if (state.mode === "refresh") {
    return new Dropbox({
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
      clientId: process.env.DROPBOX_APP_KEY,
      clientSecret: process.env.DROPBOX_APP_SECRET,
    });
  }
  if (state.mode === "access-token") {
    return new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
  }
  throw new Error(
    `Hot folder is not configured. Set up Dropbox via /admin/dropbox-auth or define ${state.missing.join(", ")}.`
  );
}

function getFolder(): string {
  // Strip a trailing slash for normalization.
  return (process.env.DROPBOX_HOT_FOLDER || DEFAULT_FOLDER).replace(/\/+$/, "");
}

/**
 * Upload a PNG to the configured hot folder. Returns the Dropbox path and a
 * shareable link if Dropbox lets us create one.
 */
export async function uploadToHotFolder(
  buffer: Buffer,
  filename: string
): Promise<HotFolderUploadResult> {
  const client = getClient();
  const folder = getFolder();
  const safeName = filename.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  // Upload — files/upload supports up to 150 MB in a single call.
  const upload = await client.filesUpload({
    path,
    contents: buffer,
    mode: { ".tag": "add" } as files.WriteMode,
    autorename: true,
    mute: true,
  });

  // Create or fetch a shareable link. If a link already exists for this
  // path, the createSharedLinkWithSettings call throws with shared_link_already_exists.
  let shareLink: string | null = null;
  try {
    const link = await client.sharingCreateSharedLinkWithSettings({
      path: upload.result.path_lower ?? path,
      settings: {
        requested_visibility: { ".tag": "team_only" },
      },
    });
    shareLink = link.result.url;
  } catch (err) {
    // Try fetching an existing link instead.
    try {
      const list = await client.sharingListSharedLinks({
        path: upload.result.path_lower ?? path,
        direct_only: true,
      });
      shareLink = list.result.links?.[0]?.url ?? null;
    } catch {
      // give up on the share link — upload still succeeded
      void err;
    }
  }

  return {
    path: upload.result.path_display ?? path,
    shareLink,
    bytes: buffer.byteLength,
  };
}
