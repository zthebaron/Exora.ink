import { NextRequest, NextResponse } from "next/server";
import { listOrders, getStats, getWooConfig, type WooOrderStatus } from "@/lib/wordpress/woocommerce";

export const runtime = "nodejs";

/**
 * GET /api/orders
 *
 * Query params:
 *   page=1
 *   perPage=25
 *   status=processing | "any" | comma-separated (e.g. processing,on-hold)
 *   search=string
 *   after=ISO date
 *   before=ISO date
 *   orderBy=date|id|modified|total
 *   order=asc|desc
 *   stats=1   — also return dashboard stats in the response
 */
export async function GET(request: NextRequest) {
  const cfg = getWooConfig();
  if (!cfg.ready) {
    return NextResponse.json(
      {
        error: `WooCommerce not configured. Missing: ${cfg.missing.join(", ")}`,
        kind: "config",
        missing: cfg.missing,
      },
      { status: 503 }
    );
  }

  const sp = request.nextUrl.searchParams;
  const statusRaw = sp.get("status");
  const status: WooOrderStatus | WooOrderStatus[] | "any" | undefined =
    statusRaw === null
      ? undefined
      : statusRaw === "any"
      ? "any"
      : statusRaw.includes(",")
      ? (statusRaw.split(",").map((s) => s.trim()) as WooOrderStatus[])
      : (statusRaw as WooOrderStatus);

  const params = {
    page: parseInt(sp.get("page") ?? "1", 10),
    perPage: parseInt(sp.get("perPage") ?? "25", 10),
    status,
    search: sp.get("search") ?? undefined,
    after: sp.get("after") ?? undefined,
    before: sp.get("before") ?? undefined,
    orderBy: (sp.get("orderBy") as "date" | "id" | "modified" | "total") ?? "date",
    order: (sp.get("order") as "asc" | "desc") ?? "desc",
  };

  try {
    const includeStats = sp.get("stats") === "1";
    const [list, stats] = await Promise.all([
      listOrders(params),
      includeStats ? getStats() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      orders: list.orders,
      total: list.total,
      totalPages: list.totalPages,
      stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, kind: "upstream" },
      { status: 502 }
    );
  }
}
