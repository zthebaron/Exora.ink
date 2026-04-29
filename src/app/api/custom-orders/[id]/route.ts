import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customOrders, customOrderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CustomOrderInput, CustomOrderStatus } from "@/lib/custom-orders/types";
import { CUSTOM_ORDER_STATUSES } from "@/lib/custom-orders/types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET — fetch a single order with line items
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  try {
    const [order] = await db
      .select()
      .from(customOrders)
      .where(eq(customOrders.id, id))
      .limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const items = await db
      .select()
      .from(customOrderItems)
      .where(eq(customOrderItems.orderId, id));
    return NextResponse.json({
      order: {
        ...order,
        total: Number(order.total),
        items: items
          .sort((a, b) => a.position - b.position)
          .map((i) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
          })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — update order + replace line items if provided
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  let body: Partial<CustomOrderInput>;
  try {
    body = (await request.json()) as Partial<CustomOrderInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Whitelist update fields.
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined && CUSTOM_ORDER_STATUSES.includes(body.status as CustomOrderStatus)) {
    update.status = body.status;
    if (body.status === "completed") {
      update.completedAt = new Date();
    } else {
      update.completedAt = null;
    }
  }
  if (body.customerName !== undefined) update.customerName = body.customerName.trim();
  if (body.customerEmail !== undefined) update.customerEmail = body.customerEmail || null;
  if (body.customerPhone !== undefined) update.customerPhone = body.customerPhone || null;
  if (body.customerCompany !== undefined) update.customerCompany = body.customerCompany || null;
  if (body.shippingAddress !== undefined) update.shippingAddress = body.shippingAddress || null;
  if (body.paymentMethod !== undefined) update.paymentMethod = body.paymentMethod || null;
  if (body.paymentReceived !== undefined) update.paymentReceived = !!body.paymentReceived;
  if (body.customerNote !== undefined) update.customerNote = body.customerNote || null;
  if (body.internalNotes !== undefined) update.internalNotes = body.internalNotes || null;
  if (body.source !== undefined) update.source = body.source;
  if (body.currency !== undefined) update.currency = body.currency;
  if (body.dueDate !== undefined) {
    update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  // If items provided, replace them and recompute total.
  // If items NOT provided but body.total is, accept the manual total.
  let totalToSet: number | null = null;
  if (body.items !== undefined) {
    const items = (body.items ?? []).filter((i) => i.name?.trim());
    const itemsTotal = items.reduce(
      (sum, i) => sum + Number(i.unitPrice ?? 0) * Number(i.quantity ?? 1),
      0
    );
    totalToSet = items.length > 0 ? itemsTotal : Number(body.total ?? 0);
    update.total = totalToSet.toFixed(2);
  } else if (body.total !== undefined) {
    update.total = Number(body.total).toFixed(2);
  }

  try {
    await db.update(customOrders).set(update).where(eq(customOrders.id, id));

    if (body.items !== undefined) {
      // Replace strategy — delete existing, insert new. Simpler than diffing.
      await db.delete(customOrderItems).where(eq(customOrderItems.orderId, id));
      const items = (body.items ?? []).filter((i) => i.name?.trim());
      if (items.length > 0) {
        await db.insert(customOrderItems).values(
          items.map((it, idx) => {
            const unitPrice = Number(it.unitPrice ?? 0);
            const qty = Number(it.quantity ?? 1);
            return {
              orderId: id,
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
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — hard-delete an order (cascades to line items via FK)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  try {
    await db.delete(customOrders).where(eq(customOrders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
