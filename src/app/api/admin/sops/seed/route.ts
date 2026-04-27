import { NextResponse } from "next/server";
import { db } from "@/db";
import { sops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SOP_SEEDS } from "@/lib/sops/seed-content";

export const runtime = "nodejs";

export async function POST() {
  try {
    const inserted: string[] = [];
    const skipped: string[] = [];

    for (const seed of SOP_SEEDS) {
      const [existing] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(eq(sops.slug, seed.slug))
        .limit(1);
      if (existing) {
        skipped.push(seed.slug);
        continue;
      }
      await db.insert(sops).values(seed);
      inserted.push(seed.slug);
    }

    return NextResponse.json({ inserted, skipped });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to seed SOPs" },
      { status: 500 }
    );
  }
}
