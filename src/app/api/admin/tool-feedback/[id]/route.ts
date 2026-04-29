import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { toolFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_BODY = 4000;
const MAX_AUTHOR = 80;

// PATCH /api/admin/tool-feedback/[id]
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  let body: { author?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.author !== undefined) {
    update.author = body.author.trim().slice(0, MAX_AUTHOR) || null;
  }
  if (body.body !== undefined) {
    const note = body.body.trim().slice(0, MAX_BODY);
    if (!note) return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
    update.body = note;
  }

  try {
    await db.update(toolFeedback).set(update).where(eq(toolFeedback.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tool-feedback/[id]
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  try {
    await db.delete(toolFeedback).where(eq(toolFeedback.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
