import { NextResponse } from "next/server";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { SocialAccountDTO, SocialPlatform } from "@/lib/social/types";

export const runtime = "nodejs";

// GET /api/social/accounts — list connected accounts (no tokens leaked)
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ accounts: [] });
  }
  try {
    const rows = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        externalId: socialAccounts.externalId,
        displayName: socialAccounts.displayName,
        avatarUrl: socialAccounts.avatarUrl,
        expiresAt: socialAccounts.expiresAt,
        scope: socialAccounts.scope,
        metadata: socialAccounts.metadata,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt,
      })
      .from(socialAccounts)
      .orderBy(desc(socialAccounts.createdAt));

    const accounts: SocialAccountDTO[] = rows.map((r) => ({
      id: r.id,
      platform: r.platform as SocialPlatform,
      externalId: r.externalId,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      scope: r.scope,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ accounts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}
