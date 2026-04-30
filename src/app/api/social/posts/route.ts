import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { socialPosts, socialPostResults } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import type { SocialPostDTO, PostStatus, PostResultDTO, PostResultStatus } from "@/lib/social/types";

export const runtime = "nodejs";

const MAX_BODY = 63_000; // generous; per-platform limit enforced at publish

// GET /api/social/posts — list all posts, newest first.
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ posts: [] });
  }
  try {
    const rows = await db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.createdAt))
      .limit(200);

    const ids = rows.map((r) => r.id);
    const resultsByPost = new Map<string, PostResultDTO[]>();
    if (ids.length) {
      const allResults = await db
        .select()
        .from(socialPostResults)
        .where(inArray(socialPostResults.postId, ids));
      for (const r of allResults) {
        const list = resultsByPost.get(r.postId) ?? [];
        list.push({
          id: r.id,
          accountId: r.accountId,
          status: r.status as PostResultStatus,
          platformPostId: r.platformPostId,
          permalink: r.permalink,
          error: r.error,
          metrics: r.metrics as Record<string, unknown> | null,
          attemptedAt: r.attemptedAt.toISOString(),
        });
        resultsByPost.set(r.postId, list);
      }
    }

    const posts: SocialPostDTO[] = rows.map((p) => ({
      id: p.id,
      label: p.label,
      body: p.body,
      imageUrls: (p.imageUrls as string[]) ?? [],
      targetAccountIds: (p.targetAccountIds as string[]) ?? [],
      status: p.status as PostStatus,
      scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
      postedAt: p.postedAt ? p.postedAt.toISOString() : null,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      results: resultsByPost.get(p.id) ?? [],
    }));

    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}

// POST /api/social/posts — create draft (or scheduled) post.
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  let body: {
    label?: string;
    body?: string;
    imageUrls?: string[];
    targetAccountIds?: string[];
    scheduledFor?: string | null;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.body ?? "").slice(0, MAX_BODY);
  const targetAccountIds = Array.isArray(body.targetAccountIds) ? body.targetAccountIds : [];
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
  const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
  const status: PostStatus = scheduledFor ? "scheduled" : "draft";

  try {
    const [row] = await db
      .insert(socialPosts)
      .values({
        label: body.label?.trim() || null,
        body: text,
        imageUrls,
        targetAccountIds,
        status,
        scheduledFor,
        notes: body.notes?.trim() || null,
      })
      .returning();

    return NextResponse.json({ ok: true, id: row.id, status: row.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 500 }
    );
  }
}
