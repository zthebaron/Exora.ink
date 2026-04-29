import { NextRequest, NextResponse } from "next/server";
import { getOrder, getWooConfig } from "@/lib/wordpress/woocommerce";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const cfg = getWooConfig();
  if (!cfg.ready) {
    return NextResponse.json(
      { error: `WooCommerce not configured. Missing: ${cfg.missing.join(", ")}` },
      { status: 503 }
    );
  }

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  try {
    const order = await getOrder(id);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
