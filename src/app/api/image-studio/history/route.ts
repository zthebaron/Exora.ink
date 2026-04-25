import { NextResponse } from "next/server";
import { db } from "@/db";
import { imageGenerations } from "@/db/schema";
import { desc, ne } from "drizzle-orm";

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
}

const EMPTY: { entries: HistoryEntry[] } = { entries: [] };

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(EMPTY);
  }

  try {
    // Pull recent generations, exclude the upscale derivatives (they have a
    // synthetic "[upscale Nx]" prompt). Limit broad — we'll dedupe in JS.
    const rows = await db
      .select({
        prompt: imageGenerations.prompt,
        tier: imageGenerations.tier,
        createdAt: imageGenerations.createdAt,
        costUsd: imageGenerations.costUsd,
      })
      .from(imageGenerations)
      .where(ne(imageGenerations.tier, "upscale"))
      .orderBy(desc(imageGenerations.createdAt))
      .limit(200);

    // Deduplicate by exact prompt text, keep the most recent occurrence.
    const dedup = new Map<string, HistoryEntry>();
    for (const row of rows) {
      const prompt = row.prompt.trim();
      if (!prompt) continue;
      const cost = Number(row.costUsd ?? 0);
      const tier = (row.tier ?? "preview") as "preview" | "production";
      const existing = dedup.get(prompt);
      if (existing) {
        existing.count += 1;
        existing.totalCostUsd = Math.round((existing.totalCostUsd + cost) * 10000) / 10000;
        if (tier === "production") existing.bestTier = "production";
        // Keep the most recent timestamp (rows are already sorted desc, so first wins).
      } else {
        dedup.set(prompt, {
          prompt,
          lastUsed: row.createdAt.toISOString(),
          count: 1,
          bestTier: tier,
          totalCostUsd: Math.round(cost * 10000) / 10000,
        });
      }
    }

    const entries = Array.from(dedup.values()).slice(0, 25);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("History query failed:", err);
    return NextResponse.json(EMPTY);
  }
}
