import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batchEnhancePrompts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_LABEL = 80;
const MAX_PROMPT = 4000;

// PATCH /api/admin/batch-enhance-prompts/[id]
//   body: { label?, prompt?, icon?, accent? }
//   special: { useCount: "increment" } bumps the use_count by 1
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

  // "Increment use count" path — fired client-side every time the preset is applied.
  if (body.useCount === "increment") {
    try {
      await db
        .update(batchEnhancePrompts)
        .set({
          useCount: sql`${batchEnhancePrompts.useCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(batchEnhancePrompts.id, id));
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Update failed" },
        { status: 500 }
      );
    }
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.label === "string") {
    const v = body.label.trim().slice(0, MAX_LABEL);
    if (!v) return NextResponse.json({ error: "label cannot be empty" }, { status: 400 });
    update.label = v;
  }
  if (typeof body.prompt === "string") {
    const v = body.prompt.trim().slice(0, MAX_PROMPT);
    if (!v) return NextResponse.json({ error: "prompt cannot be empty" }, { status: 400 });
    update.prompt = v;
  }
  if (typeof body.icon === "string") update.icon = body.icon;
  if (typeof body.accent === "string") update.accent = body.accent;

  try {
    await db.update(batchEnhancePrompts).set(update).where(eq(batchEnhancePrompts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  try {
    await db.delete(batchEnhancePrompts).where(eq(batchEnhancePrompts.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
