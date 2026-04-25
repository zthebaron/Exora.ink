import { NextResponse } from "next/server";
import { getDropboxAuthState } from "@/lib/dropbox/hot-folder";

export const runtime = "nodejs";

export async function GET() {
  const state = getDropboxAuthState();
  return NextResponse.json({
    mode: state.mode,
    ready: state.ready,
    hotFolder: process.env.DROPBOX_HOT_FOLDER || "/Apps/Exora-RIP/hot",
    hasAppKey: !!process.env.DROPBOX_APP_KEY,
    hasAppSecret: !!process.env.DROPBOX_APP_SECRET,
    appKey: process.env.DROPBOX_APP_KEY ?? null, // public — fine to expose
    missing: state.mode === "none" ? state.missing : [],
  });
}
