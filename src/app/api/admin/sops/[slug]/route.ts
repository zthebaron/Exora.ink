import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sops, sopRevisions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  effective: z.string().optional().nullable(),
  contentMd: z.string().min(1).optional(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const [row] = await db.select().from(sops).where(eq(sops.slug, slug)).limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sop: row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load SOP" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [existing] = await db.select().from(sops).where(eq(sops.slug, slug)).limit(1);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (parsed.data.contentMd && parsed.data.contentMd !== existing.contentMd) {
      await db.insert(sopRevisions).values({
        sopId: existing.id,
        contentMd: existing.contentMd,
        note: parsed.data.note ?? null,
      });
    }

    const { note, ...rest } = parsed.data;
    void note;
    const [updated] = await db
      .update(sops)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(sops.slug, slug))
      .returning();

    return NextResponse.json({ sop: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update SOP" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const result = await db.delete(sops).where(eq(sops.slug, slug)).returning({ id: sops.id });
    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete SOP" },
      { status: 500 }
    );
  }
}
