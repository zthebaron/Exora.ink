"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import { formatCurrency } from "@/lib/formatters";
import type { WooOrder, OrderStats } from "@/lib/wordpress/woocommerce";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "All statuses" },
  { value: "processing,on-hold,pending", label: "In flight" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending payment" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  processing: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "on-hold": "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-red-500/15 text-red-700 dark:text-red-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function customerName(order: WooOrder): string {
  const b = order.billing;
  const parts = [b.first_name, b.last_name].filter(Boolean).join(" ").trim();
  return parts || b.company || b.email || "Guest";
}

export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState<WooOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("processing,on-hold,pending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<WooOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "25",
        status: statusFilter,
        stats: "1",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.kind === "config" && data.missing) {
          setMissing(data.missing);
        }
        throw new Error(data.error || `Failed (${res.status})`);
      }
      setMissing(null);
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const wpAdminUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return "/api/orders"; // proxy is here, real WP admin is at exora.ink/wp-admin
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="orders" />

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ClipboardList className="h-3 w-3" />
              Production · Orders from exora.ink
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Orders Dashboard
            </h1>
          </div>
          <a
            href="https://exora.ink/wp-admin/edit.php?post_type=shop_order"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Open in WP Admin
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {missing && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Orders not configured yet
                </p>
                <p className="mt-1 text-muted-foreground">
                  Set the following env vars in <code className="rounded bg-muted px-1 py-0.5">.env.local</code>{" "}
                  (and Vercel Settings → Environment Variables) to connect to exora.ink:
                </p>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {missing.map((m) => (
                    <li key={m}>
                      <code className="rounded bg-muted px-1 py-0.5">{m}</code>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Generate the application password from{" "}
                  <a
                    href="https://exora.ink/wp-admin/profile.php#application-passwords-section"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    exora.ink WP admin → Profile → Application Passwords
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats row */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label="Today"
            value={stats ? `${stats.todayCount} orders` : "—"}
            sub={stats ? formatCurrency(stats.todayRevenue) : "—"}
            accent="emerald"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Processing"
            value={stats ? String(stats.processingCount) : "—"}
            sub="ready to ship"
            accent="sky"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="On hold"
            value={stats ? String(stats.onHoldCount) : "—"}
            sub="needs review"
            accent="rose"
          />
          <StatCard
            icon={<PackageCheck className="h-4 w-4" />}
            label="Pending payment"
            value={stats ? String(stats.pendingCount) : "—"}
            sub="awaiting customer"
            accent="amber"
          />
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto min-w-[180px]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by order #, customer, email…"
                  className="pl-8"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Search
              </button>
            </form>
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="ml-auto rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </CardContent>
        </Card>

        {error && !missing && (
          <Card className="mb-4 border-destructive/40 bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Orders table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {missing ? "Configure credentials above to load orders." : "No orders found."}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemCount = o.line_items.reduce((s, li) => s + li.quantity, 0);
                  const badgeClass = STATUS_BADGE[o.status] ?? "bg-muted text-muted-foreground";
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium tabular-nums">
                        #{o.number || o.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{customerName(o)}</div>
                        {o.billing.email && (
                          <div className="text-xs text-muted-foreground">{o.billing.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.date_created)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] uppercase tracking-wide", badgeClass)}>
                          {o.status.replace("-", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{itemCount}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(parseFloat(o.total))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} order{total === 1 ? "" : "s"} · page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <ToolFeedback toolId="orders" toolLabel="Orders Dashboard" />

        {/* Detail drawer */}
        {selected && (
          <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: "emerald" | "sky" | "rose" | "amber";
}) {
  const accents: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <div className={cn("rounded-lg p-2", accents[accent])}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailDrawer({ order, onClose }: { order: WooOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-sm"
        aria-hidden
      />
      <div className="flex w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">Order</p>
            <h2 className="text-xl font-bold tabular-nums">#{order.number || order.id}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5 text-sm">
          {/* Status + total */}
          <div className="flex items-center justify-between">
            <Badge className={cn("uppercase tracking-wide", STATUS_BADGE[order.status])}>
              {order.status.replace("-", " ")}
            </Badge>
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(parseFloat(order.total))}
            </span>
          </div>

          {/* Customer */}
          <section>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h3>
            <p className="font-medium">{customerName(order)}</p>
            {order.billing.email && (
              <p className="text-xs text-muted-foreground">{order.billing.email}</p>
            )}
            {order.billing.phone && (
              <p className="text-xs text-muted-foreground">{order.billing.phone}</p>
            )}
            {order.billing.company && (
              <p className="text-xs text-muted-foreground">{order.billing.company}</p>
            )}
          </section>

          {/* Shipping address */}
          {order.shipping.address_1 && (
            <section>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ship to
              </h3>
              <p className="text-xs leading-relaxed text-foreground">
                {order.shipping.address_1}
                {order.shipping.address_2 && (
                  <>
                    <br />
                    {order.shipping.address_2}
                  </>
                )}
                <br />
                {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                {order.shipping.country && (
                  <>
                    <br />
                    {order.shipping.country}
                  </>
                )}
              </p>
            </section>
          )}

          {/* Line items */}
          <section>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Line items ({order.line_items.length})
            </h3>
            <div className="space-y-2">
              {order.line_items.map((li) => (
                <div
                  key={li.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-2.5"
                >
                  {li.image?.src && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={li.image.src}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight text-foreground">
                      {li.name}
                    </p>
                    {li.sku && (
                      <p className="text-[10px] text-muted-foreground">SKU: {li.sku}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Qty {li.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(parseFloat(li.total))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="text-xs">
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Payment
            </h3>
            <p>{order.payment_method_title || "—"}</p>
            {order.date_paid && (
              <p className="text-muted-foreground">Paid {fmtDate(order.date_paid)}</p>
            )}
          </section>

          {/* Customer note */}
          {order.customer_note && (
            <section>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Customer note
              </h3>
              <p className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                {order.customer_note}
              </p>
            </section>
          )}

          <a
            href={`https://exora.ink/wp-admin/post.php?post=${order.id}&action=edit`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Edit on exora.ink
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
