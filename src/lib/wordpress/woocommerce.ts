/**
 * WooCommerce orders client for exora.ink.
 *
 * Auth model: WordPress Application Passwords (HTTP Basic with the user's
 * login + an app password generated under Users → Profile → Application
 * Passwords on the WP admin). This works for the WooCommerce REST API
 * because Application Passwords authenticate AS the user, who has WC perms.
 *
 * Env vars:
 *   EXORA_WP_URL          — base, e.g. https://exora.ink (no trailing slash)
 *   EXORA_WP_USERNAME     — WP admin username
 *   EXORA_WP_APP_PASSWORD — application password (with or without spaces)
 */

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  total: string;
  subtotal: string;
  sku?: string;
  image?: { id?: number; src?: string };
  meta_data?: Array<{ key: string; value: string | number }>;
}

export interface WooAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export type WooOrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed"
  | "trash"
  | string;

export interface WooOrder {
  id: number;
  number: string;
  status: WooOrderStatus;
  currency: string;
  date_created: string;
  date_modified: string;
  date_paid?: string | null;
  total: string;
  total_tax: string;
  shipping_total: string;
  customer_id: number;
  customer_note?: string;
  payment_method_title?: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooLineItem[];
}

export interface ListOrdersParams {
  page?: number;
  perPage?: number;
  status?: WooOrderStatus | WooOrderStatus[] | "any";
  search?: string;
  after?: string; // ISO date — created after
  before?: string; // ISO date — created before
  orderBy?: "date" | "id" | "modified" | "total";
  order?: "asc" | "desc";
}

export interface ListOrdersResult {
  orders: WooOrder[];
  total: number;
  totalPages: number;
}

export interface WooConfigState {
  ready: boolean;
  baseUrl: string | null;
  username: string | null;
  missing: string[];
}

export function getWooConfig(): WooConfigState {
  const baseUrl = process.env.EXORA_WP_URL?.replace(/\/+$/, "") ?? null;
  const username = process.env.EXORA_WP_USERNAME ?? null;
  const password = process.env.EXORA_WP_APP_PASSWORD ?? null;

  const missing: string[] = [];
  if (!baseUrl) missing.push("EXORA_WP_URL");
  if (!username) missing.push("EXORA_WP_USERNAME");
  if (!password) missing.push("EXORA_WP_APP_PASSWORD");

  return {
    ready: missing.length === 0,
    baseUrl,
    username,
    missing,
  };
}

function authHeader(): string {
  const username = process.env.EXORA_WP_USERNAME ?? "";
  // App passwords often display with spaces ("xxxx xxxx xxxx") — normalize.
  const password = (process.env.EXORA_WP_APP_PASSWORD ?? "").replace(/\s+/g, "");
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * List orders. Returns the orders plus total/totalPages parsed from the
 * X-WP-Total / X-WP-TotalPages response headers.
 */
export async function listOrders(params: ListOrdersParams = {}): Promise<ListOrdersResult> {
  const cfg = getWooConfig();
  if (!cfg.ready || !cfg.baseUrl) {
    throw new Error(
      `WooCommerce not configured. Missing: ${cfg.missing.join(", ")}`
    );
  }

  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("per_page", String(params.perPage ?? 25));
  if (params.status) {
    if (Array.isArray(params.status)) {
      // WooCommerce supports repeated status[] params.
      params.status.forEach((s) => search.append("status", s));
    } else {
      search.set("status", params.status);
    }
  }
  if (params.search) search.set("search", params.search);
  if (params.after) search.set("after", params.after);
  if (params.before) search.set("before", params.before);
  if (params.orderBy) search.set("orderby", params.orderBy);
  if (params.order) search.set("order", params.order);

  const url = `${cfg.baseUrl}/wp-json/wc/v3/orders?${search.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `WooCommerce list failed (${res.status}): ${text.slice(0, 400)}`
    );
  }

  const orders = (await res.json()) as WooOrder[];
  const total = parseInt(res.headers.get("X-WP-Total") ?? "0", 10) || orders.length;
  const totalPages =
    parseInt(res.headers.get("X-WP-TotalPages") ?? "0", 10) || 1;

  return { orders, total, totalPages };
}

export async function getOrder(id: number): Promise<WooOrder> {
  const cfg = getWooConfig();
  if (!cfg.ready || !cfg.baseUrl) {
    throw new Error(`WooCommerce not configured. Missing: ${cfg.missing.join(", ")}`);
  }

  const url = `${cfg.baseUrl}/wp-json/wc/v3/orders/${id}`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WooCommerce get failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return (await res.json()) as WooOrder;
}

/**
 * Quick stats for the dashboard header. Pulls counts/sums for "today" and
 * the in-flight queue (processing / on-hold).
 */
export interface OrderStats {
  todayCount: number;
  todayRevenue: number;
  processingCount: number;
  onHoldCount: number;
  pendingCount: number;
  currency: string;
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getStats(): Promise<OrderStats> {
  const after = startOfTodayISO();
  const [today, processing, onHold, pending] = await Promise.all([
    listOrders({ after, perPage: 100, status: "any" }),
    listOrders({ status: "processing", perPage: 1 }),
    listOrders({ status: "on-hold", perPage: 1 }),
    listOrders({ status: "pending", perPage: 1 }),
  ]);

  const todayRevenue = today.orders
    .filter((o) => o.status === "completed" || o.status === "processing")
    .reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

  return {
    todayCount: today.total,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    processingCount: processing.total,
    onHoldCount: onHold.total,
    pendingCount: pending.total,
    currency: today.orders[0]?.currency ?? "USD",
  };
}
