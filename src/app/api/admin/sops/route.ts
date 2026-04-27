import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sops } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const CreateSchema = z.object({
  slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  version: z.string().optional(),
  owner: z.string().optional(),
  effective: z.string().optional(),
  contentMd: z.string().min(1),
});

export async function GET() {
  try {
    const rows = await db
      .select({
        id: sops.id,
        slug: sops.slug,
        title: sops.title,
        subtitle: sops.subtitle,
        version: sops.version,
        owner: sops.owner,
        effective: sops.effective,
        updatedAt: sops.updatedAt,
      })
      .from(sops)
      .orderBy(desc(sops.updatedAt));
    return NextResponse.json({ sops: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list SOPs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const [row] = await db.insert(sops).values(parsed.data).returning();
    return NextResponse.json({ sop: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create SOP" },
      { status: 500 }
    );
  }
}
