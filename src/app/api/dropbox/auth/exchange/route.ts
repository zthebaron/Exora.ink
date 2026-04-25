import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/dropbox/oauth";
import { formatUpstreamError } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { code?: string; redirectUri?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.code || "").trim();
  const redirectUri = (body.redirectUri || "").trim();

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  if (!redirectUri) {
    return NextResponse.json({ error: "redirectUri is required" }, { status: 400 });
  }

  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (!appKey || !appSecret) {
    return NextResponse.json(
      { error: "DROPBOX_APP_KEY and DROPBOX_APP_SECRET must be set in the environment first." },
      { status: 500 }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, appKey, appSecret, redirectUri);
    return NextResponse.json({
      ok: true,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      scope: tokens.scope,
      accountId: tokens.accountId,
    });
  } catch (err) {
    const formatted = formatUpstreamError(err);
    return NextResponse.json(
      { error: formatted.message, kind: formatted.kind },
      { status: formatted.status }
    );
  }
}
