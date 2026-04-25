import { NextResponse } from "next/server";
import { db } from "@/db";
import { imageGenerations } from "@/db/schema";
import { gte, sql } from "drizzle-orm";

export const runtime = "nodejs";

export interface CostSummary {
  todayUsd: number;
  monthUsd: number;
  todayBreakdown: { preview: number; production: number; upscale: number };
  monthBreakdown: { preview: number; production: number; upscale: number };
  todayCount: number;
  monthCount: number;
}

const EMPTY: CostSummary = {
  todayUsd: 0,
  monthUsd: 0,
  todayBreakdown: { preview: 0, production: 0, upscale: 0 },
  monthBreakdown: { preview: 0, production: 0, upscale: 0 },
  todayCount: 0,
  monthCount: 0,
};

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(EMPTY);
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Pull only the rows we need with their cost + tier; aggregate in JS.
    const monthRows = await db
      .select({
        tier: imageGenerations.tier,
        costUsd: imageGenerations.costUsd,
        createdAt: imageGenerations.createdAt,
      })
      .from(imageGenerations)
      .where(gte(imageGenerations.createdAt, startOfMonth));

    const summary: CostSummary = JSON.parse(JSON.stringify(EMPTY));
    for (const row of monthRows) {
      const cost = Number(row.costUsd ?? 0);
      const tier = (row.tier ?? "preview") as "preview" | "production" | "upscale";
      const isToday = row.createdAt >= startOfDay;

      summary.monthUsd += cost;
      summary.monthCount += 1;
      if (tier === "preview" || tier === "production" || tier === "upscale") {
        summary.monthBreakdown[tier] += cost;
      }

      if (isToday) {
        summary.todayUsd += cost;
        summary.todayCount += 1;
        if (tier === "preview" || tier === "production" || tier === "upscale") {
          summary.todayBreakdown[tier] += cost;
        }
      }
    }

    // Round to 4 decimals to keep JSON tidy.
    const round = (n: number) => Math.round(n * 10000) / 10000;
    summary.todayUsd = round(summary.todayUsd);
    summary.monthUsd = round(summary.monthUsd);
    for (const k of ["preview", "production", "upscale"] as const) {
      summary.todayBreakdown[k] = round(summary.todayBreakdown[k]);
      summary.monthBreakdown[k] = round(summary.monthBreakdown[k]);
    }

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Cost summary failed:", err);
    return NextResponse.json(EMPTY);
  }
}

// Keep linter happy on unused import.
void sql;
