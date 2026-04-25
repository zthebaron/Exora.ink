import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promptFavorites } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Toggle pinned/favorite state for a prompt. Idempotent: POST with the same
 * body always lands at the desired state given by `pinned`.
 *
 * Body: { prompt: string, pinned: boolean }
 */
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 500 });
  }
  let body: { prompt?: string; pinned?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = (body.prompt || "").trim();
  const pinned = !!body.pinned;
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
  }

  try {
    if (pinned) {
      // Insert; ignore the conflict on the unique prompt index.
      await db
        .insert(promptFavorites)
        .values({ prompt })
        .onConflictDoNothing({ target: promptFavorites.prompt });
    } else {
      await db.delete(promptFavorites).where(eq(promptFavorites.prompt, prompt));
    }
    return NextResponse.json({ ok: true, pinned });
  } catch (err) {
    console.error("Favorite toggle failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Toggle failed" },
      { status: 500 }
    );
  }
}
