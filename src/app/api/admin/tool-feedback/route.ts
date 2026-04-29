import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { toolFeedback } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_BODY = 4000;
const MAX_AUTHOR = 80;

export interface FeedbackEntry {
  id: string;
  toolId: string;
  author: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/tool-feedback?tool=image-studio
export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ entries: [] });
  }
  const tool = request.nextUrl.searchParams.get("tool");
  if (!tool) {
    return NextResponse.json({ error: "tool query param is required" }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(toolFeedback)
      .where(eq(toolFeedback.toolId, tool))
      .orderBy(desc(toolFeedback.createdAt));
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

// POST /api/admin/tool-feedback
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  let body: { toolId?: string; author?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toolId = (body.toolId ?? "").trim();
  const author = (body.author ?? "").trim().slice(0, MAX_AUTHOR);
  const note = (body.body ?? "").trim().slice(0, MAX_BODY);

  if (!toolId) return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  if (!note) return NextResponse.json({ error: "Note body is required" }, { status: 400 });

  try {
    const [row] = await db
      .insert(toolFeedback)
      .values({
        toolId,
        author: author || null,
        body: note,
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
