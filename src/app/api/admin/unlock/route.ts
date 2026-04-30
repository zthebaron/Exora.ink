import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Verifies the operator-supplied password against the env-configured one.
 * Returns { ok: true, configured: true } when the password matches.
 *
 * If BATCH_ENHANCE_UNLOCK_PASSWORD is unset, the unlock feature is
 * disabled — returns { ok: true, configured: false } meaning watermarks
 * are off by default (no protection desired). The client uses the
 * `configured` flag to decide whether to show the padlock UI at all.
 */
export async function POST(request: NextRequest) {
  const configured = !!process.env.BATCH_ENHANCE_UNLOCK_PASSWORD;
  if (!configured) {
    return NextResponse.json({ ok: true, configured: false });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supplied = (body.password ?? "").trim();
  if (!supplied) {
    return NextResponse.json({ ok: false, error: "Password is required" }, { status: 400 });
  }

  // Constant-time-ish compare. Plain string equality is fine for our
  // single-tenant operator scenario but we'll spend a few cycles to
  // discourage trivial timing attacks anyway.
  const expected = process.env.BATCH_ENHANCE_UNLOCK_PASSWORD!;
  let match = supplied.length === expected.length;
  for (let i = 0; i < Math.max(supplied.length, expected.length); i++) {
    if (supplied.charCodeAt(i) !== expected.charCodeAt(i)) match = false;
  }

  if (!match) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, configured: true });
}

// GET — lightweight "is the unlock feature configured?" check so the
// client can decide whether to render the padlock at all.
export async function GET() {
  return NextResponse.json({
    configured: !!process.env.BATCH_ENHANCE_UNLOCK_PASSWORD,
  });
}
