/**
 * WooCommerce orders client for exora.ink.
 *
 * Auth — two supported modes (Consumer Key/Secret preferred):
 *
 *   Mode A (preferred — native WooCommerce auth):
 *     EXORA_WP_URL    — base, e.g. https://exora.ink
 *     EXORA_WC_KEY    — Consumer Key (ck_...) from WooCommerce → Settings →
 *                       Advanced → REST API
 *     EXORA_WC_SECRET — Consumer Secret (cs_...)
 *
 *   Mode B (fallback — WP Application Password):
 *     EXORA_WP_URL          — base
 *     EXORA_WP_USERNAME     — WP admin username
 *     EXORA_WP_APP_PASSWORD — application password (with or without spaces)
 *
 * Why prefer A: the WooCommerce permission layer recognizes Consumer Key
 * sessions as "first-class" and grants manage_woocommerce automatically.
 * Application-Password sessions sometimes get treated as guests by the
 * woocommerce_rest_check_permissions filter even when the user is an admin,
 * yielding 401 woocommerce_rest_cannot_view errors.
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

export type WooAuthMode = "consumer-key" | "app-password" | "none";

export interface WooConfigState {
  ready: boolean;
  mode: WooAuthMode;
  baseUrl: string | null;
  username: string | null;
  missing: string[];
}

export function getWooConfig(): WooConfigState {
  const baseUrl = process.env.EXORA_WP_URL?.replace(/\/+$/, "") ?? null;
  const wcKey = process.env.EXORA_WC_KEY;
  const wcSecret = process.env.EXORA_WC_SECRET;
  const username = process.env.EXORA_WP_USERNAME ?? null;
  const appPassword = process.env.EXORA_WP_APP_PASSWORD;

  // Prefer Consumer Key/Secret (native WooCommerce auth) when present.
  if (baseUrl && wcKey && wcSecret) {
    return { ready: true, mode: "consumer-key", baseUrl, username, missing: [] };
  }
  // Fallback to Application Password.
  if (baseUrl && username && appPassword) {
    return { ready: true, mode: "app-password", baseUrl, username, missing: [] };
  }

  const missing: string[] = [];
  if (!baseUrl) missing.push("EXORA_WP_URL");
  // Suggest the preferred path first.
  missing.push("EXORA_WC_KEY", "EXORA_WC_SECRET");
  return { ready: false, mode: "none", baseUrl, username, missing };
}

/**
 * Build the request headers (and any URL params) for the active auth mode.
 * Returns the final URL + headers so callers don't need to know the mode.
 */
function authedRequest(url: string): { url: string; headers: HeadersInit } {
  const cfg = getWooConfig();

  if (cfg.mode === "consumer-key") {
    // Consumer Key/Secret over HTTPS — use HTTP Basic Auth (the WC-recommended
    // pattern for HTTPS endpoints, much simpler than OAuth1.0a).
    const key = process.env.EXORA_WC_KEY ?? "";
    const secret = process.env.EXORA_WC_SECRET ?? "";
    const token = Buffer.from(`${key}:${secret}`).toString("base64");
    return {
      url,
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
      },
    };
  }

  if (cfg.mode === "app-password") {
    const username = process.env.EXORA_WP_USERNAME ?? "";
    const password = (process.env.EXORA_WP_APP_PASSWORD ?? "").replace(/\s+/g, "");
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return {
      url,
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
      },
    };
  }

  // No auth configured — caller will hit a "not configured" branch first.
  return { url, headers: { Accept: "application/json" } };
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

  const requestUrl = `${cfg.baseUrl}/wp-json/wc/v3/orders?${search.toString()}`;
  const { url, headers } = authedRequest(requestUrl);
  const res = await fetch(url, { headers, cache: "no-store" });

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

  const requestUrl = `${cfg.baseUrl}/wp-json/wc/v3/orders/${id}`;
  const { url, headers } = authedRequest(requestUrl);
  const res = await fetch(url, { headers, cache: "no-store" });

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
