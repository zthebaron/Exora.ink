import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { imageGenerations, promptFavorites } from "@/db/schema";
import { desc, eq, ne } from "drizzle-orm";

export const runtime = "nodejs";

export interface HistoryEntry {
  prompt: string;
  /** Last time this prompt was used (ISO string). */
  lastUsed: string;
  /** Number of times this prompt has been generated. */
  count: number;
  /** Highest-tier this prompt was used at (production beats preview). */
  bestTier: "preview" | "production";
  /** Total cost across all uses of this prompt. */
  totalCostUsd: number;
  /** Whether the operator has pinned this prompt. */
  pinned: boolean;
}

const EMPTY: { entries: HistoryEntry[] } = { entries: [] };

// ---------------------------------------------------------------------------
// GET — list history with favorite flag, pinned-first sort
// ---------------------------------------------------------------------------

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(EMPTY);
  }

  try {
    const [rows, favRows] = await Promise.all([
      db
        .select({
          prompt: imageGenerations.prompt,
          tier: imageGenerations.tier,
          createdAt: imageGenerations.createdAt,
          costUsd: imageGenerations.costUsd,
        })
        .from(imageGenerations)
        .where(ne(imageGenerations.tier, "upscale"))
        .orderBy(desc(imageGenerations.createdAt))
        .limit(200),
      db.select({ prompt: promptFavorites.prompt }).from(promptFavorites),
    ]);

    const favoriteSet = new Set(favRows.map((f) => f.prompt));

    // Deduplicate by exact prompt text, keep most recent.
    const dedup = new Map<string, HistoryEntry>();
    for (const row of rows) {
      const prompt = row.prompt.trim();
      if (!prompt) continue;
      const cost = Number(row.costUsd ?? 0);
      const tier = (row.tier ?? "preview") as "preview" | "production";
      const existing = dedup.get(prompt);
      if (existing) {
        existing.count += 1;
        existing.totalCostUsd =
          Math.round((existing.totalCostUsd + cost) * 10000) / 10000;
        if (tier === "production") existing.bestTier = "production";
      } else {
        dedup.set(prompt, {
          prompt,
          lastUsed: row.createdAt.toISOString(),
          count: 1,
          bestTier: tier,
          totalCostUsd: Math.round(cost * 10000) / 10000,
          pinned: favoriteSet.has(prompt),
        });
      }
    }

    // Also surface favorites that have no generation history yet.
    for (const fav of favoriteSet) {
      if (!dedup.has(fav)) {
        dedup.set(fav, {
          prompt: fav,
          lastUsed: new Date(0).toISOString(),
          count: 0,
          bestTier: "preview",
          totalCostUsd: 0,
          pinned: true,
        });
      }
    }

    // Sort: pinned first, then by lastUsed desc.
    const entries = Array.from(dedup.values())
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.lastUsed.localeCompare(a.lastUsed);
      })
      .slice(0, 50);

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("History query failed:", err);
    return NextResponse.json(EMPTY);
  }
}

// ---------------------------------------------------------------------------
// DELETE — hard-delete every generation for a given prompt
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 500 });
  }
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
  }

  try {
    // Hard delete: removes from history AND from cost tracker totals.
    await db.delete(imageGenerations).where(eq(imageGenerations.prompt, prompt));
    // Also unfavorite if present, so it doesn't reappear as a "favorite-only" entry.
    await db.delete(promptFavorites).where(eq(promptFavorites.prompt, prompt));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("History delete failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
