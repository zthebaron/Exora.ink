import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batchEnhancePrompts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_LABEL = 80;
const MAX_PROMPT = 4000;

export interface SavedPrompt {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  accent: string;
  useCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/batch-enhance-prompts
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ entries: [] });
  }
  try {
    const rows = await db
      .select()
      .from(batchEnhancePrompts)
      .orderBy(desc(batchEnhancePrompts.useCount), desc(batchEnhancePrompts.updatedAt));
    return NextResponse.json({
      entries: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}

// POST /api/admin/batch-enhance-prompts
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  let body: { label?: string; prompt?: string; icon?: string; accent?: string; createdBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = (body.label ?? "").trim().slice(0, MAX_LABEL);
  const prompt = (body.prompt ?? "").trim().slice(0, MAX_PROMPT);
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  try {
    const [row] = await db
      .insert(batchEnhancePrompts)
      .values({
        label,
        prompt,
        icon: body.icon || "Sparkles",
        accent: body.accent || "amber",
        createdBy: body.createdBy?.trim() || null,
      })
      .returning();
    return NextResponse.json({
      ok: true,
      entry: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 500 }
    );
  }
}
