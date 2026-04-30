import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PostStatus } from "@/lib/social/types";

export const runtime = "nodejs";

const MAX_BODY = 63_000;

// PATCH /api/social/posts/[id] — update fields on a draft / scheduled post.
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.label === "string") update.label = body.label.trim() || null;
  if (typeof body.body === "string") update.body = body.body.slice(0, MAX_BODY);
  if (Array.isArray(body.imageUrls)) update.imageUrls = body.imageUrls;
  if (Array.isArray(body.targetAccountIds)) update.targetAccountIds = body.targetAccountIds;
  if (body.scheduledFor !== undefined) {
    update.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor as string) : null;
    update.status = (body.scheduledFor ? "scheduled" : "draft") as PostStatus;
  }
  if (typeof body.notes === "string") update.notes = body.notes.trim() || null;
  if (body.status === "cancelled") update.status = "cancelled";

  try {
    await db.update(socialPosts).set(update).where(eq(socialPosts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/posts/[id]
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  try {
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
