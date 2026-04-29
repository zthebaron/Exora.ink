import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customOrders, customOrderItems } from "@/db/schema";
import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import type { CustomOrderInput, CustomOrderStatus } from "@/lib/custom-orders/types";
import { CUSTOM_ORDER_STATUSES } from "@/lib/custom-orders/types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET — list custom orders with filters + dashboard stats
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DB not configured", missing: ["DATABASE_URL"] },
      { status: 503 }
    );
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(sp.get("perPage") ?? "25", 10)));
  const statusRaw = sp.get("status"); // "any" | csv | single
  const search = (sp.get("search") ?? "").trim();
  const wantStats = sp.get("stats") === "1";

  // Build status filter
  const statuses: CustomOrderStatus[] | null =
    !statusRaw || statusRaw === "any"
      ? null
      : (statusRaw.split(",").map((s) => s.trim()).filter((s) =>
          CUSTOM_ORDER_STATUSES.includes(s as CustomOrderStatus)
        ) as CustomOrderStatus[]);

  const whereClauses = [];
  if (statuses && statuses.length > 0) {
    whereClauses.push(inArray(customOrders.status, statuses));
  }
  if (search) {
    const like = `%${search}%`;
    whereClauses.push(
      or(
        ilike(customOrders.customerName, like),
        ilike(customOrders.customerEmail, like),
        ilike(customOrders.customerCompany, like),
        ilike(customOrders.orderNumber, like),
        ilike(customOrders.internalNotes, like)
      )
    );
  }
  const where = whereClauses.length ? and(...whereClauses) : undefined;

  try {
    // Total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(customOrders);
    const [{ count: total }] = where
      ? await countQuery.where(where)
      : await countQuery;

    // Page of orders
    const ordersQuery = db
      .select()
      .from(customOrders)
      .orderBy(desc(customOrders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage);
    const orderRows = where ? await ordersQuery.where(where) : await ordersQuery;

    // Pull line items for the visible orders in one query
    const orderIds = orderRows.map((o) => o.id);
    const itemRows = orderIds.length
      ? await db
          .select()
          .from(customOrderItems)
          .where(inArray(customOrderItems.orderId, orderIds))
      : [];
    const itemsByOrder = new Map<string, typeof itemRows>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const orders = orderRows.map((o) => ({
      ...o,
      total: Number(o.total),
      items: (itemsByOrder.get(o.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
    }));

    // Stats — independent of pagination filters
    let stats = null;
    if (wantStats) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [statRow] = await db
        .select({
          todayCount: sql<number>`count(*) filter (where ${customOrders.createdAt} >= ${todayStart})::int`,
          todayRevenue: sql<number>`coalesce(sum(${customOrders.total}) filter (where ${customOrders.createdAt} >= ${todayStart} and ${customOrders.status} in ('processing','completed')), 0)::float`,
          processingCount: sql<number>`count(*) filter (where ${customOrders.status} = 'processing')::int`,
          onHoldCount: sql<number>`count(*) filter (where ${customOrders.status} = 'on-hold')::int`,
          pendingCount: sql<number>`count(*) filter (where ${customOrders.status} = 'pending')::int`,
        })
        .from(customOrders);
      stats = {
        todayCount: statRow.todayCount ?? 0,
        todayRevenue: Math.round((statRow.todayRevenue ?? 0) * 100) / 100,
        processingCount: statRow.processingCount ?? 0,
        onHoldCount: statRow.onHoldCount ?? 0,
        pendingCount: statRow.pendingCount ?? 0,
        currency: "USD",
      };
    }

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return NextResponse.json({ orders, total, totalPages, stats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — create a new custom order with line items
// ---------------------------------------------------------------------------

async function nextOrderNumber(): Promise<string> {
  // Sequential "C-NNNN" using the largest existing number + 1.
  const [row] = await db
    .select({
      maxNum: sql<number | null>`max(cast(substring(${customOrders.orderNumber} from '[0-9]+$') as integer))`,
    })
    .from(customOrders);
  const next = (row?.maxNum ?? 1000) + 1;
  return `C-${next}`;
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  let body: CustomOrderInput;
  try {
    body = (await request.json()) as CustomOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const customerName = (body.customerName ?? "").trim();
  if (!customerName) {
    return NextResponse.json(
      { error: "customerName is required" },
      { status: 400 }
    );
  }

  // Compute total: prefer the sum of line items if present, else the
  // body.total field. This matches the operator's typical workflow.
  const items = (body.items ?? []).filter((i) => i.name?.trim());
  const itemsTotal = items.reduce(
    (sum, i) => sum + (i.unitPrice ?? 0) * (i.quantity ?? 1),
    0
  );
  const total = items.length > 0 ? itemsTotal : body.total ?? 0;

  try {
    const orderNumber = await nextOrderNumber();
    const status = (body.status ?? "processing") as CustomOrderStatus;

    const [order] = await db
      .insert(customOrders)
      .values({
        orderNumber,
        status,
        source: body.source ?? "manual",
        customerName,
        customerEmail: body.customerEmail ?? null,
        customerPhone: body.customerPhone ?? null,
        customerCompany: body.customerCompany ?? null,
        shippingAddress: body.shippingAddress ?? null,
        total: total.toFixed(2),
        currency: body.currency ?? "USD",
        paymentMethod: body.paymentMethod ?? null,
        paymentReceived: !!body.paymentReceived,
        customerNote: body.customerNote ?? null,
        internalNotes: body.internalNotes ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedAt: status === "completed" ? new Date() : null,
        createdBy: body.createdBy ?? null,
      })
      .returning();

    if (items.length > 0) {
      await db.insert(customOrderItems).values(
        items.map((it, idx) => {
          const unitPrice = Number(it.unitPrice ?? 0);
          const qty = Number(it.quantity ?? 1);
          return {
            orderId: order.id,
            name: it.name.trim(),
            sku: it.sku ?? null,
            quantity: qty,
            unitPrice: unitPrice.toFixed(2),
            total: (unitPrice * qty).toFixed(2),
            notes: it.notes ?? null,
            position: it.position ?? idx,
          };
        })
      );
    }

    return NextResponse.json({ ok: true, id: order.id, orderNumber });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 500 }
    );
  }
}
