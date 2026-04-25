/**
 * Dropbox hot-folder upload — final step of the Image Studio pipeline.
 *
 * The RIP machine watches a specific Dropbox folder (the "hot folder").
 * When we drop a print-ready PNG into that folder, the RIP picks it up
 * and processes it for printing.
 *
 * Auth: this uses a long-lived Dropbox access token in DROPBOX_ACCESS_TOKEN.
 * For production, switch to a refresh-token flow with DROPBOX_APP_KEY +
 * DROPBOX_APP_SECRET + DROPBOX_REFRESH_TOKEN — Dropbox short-lived tokens
 * expire after 4 hours.
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

function getClient(): Dropbox {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Hot folder is not configured. Set DROPBOX_ACCESS_TOKEN in the environment."
    );
  }
  return new Dropbox({ accessToken: token });
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
