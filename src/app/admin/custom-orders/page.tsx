"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Edit3,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import { formatCurrency } from "@/lib/formatters";
import {
  CUSTOM_ORDER_STATUSES,
  type CustomOrderInput,
  type CustomOrderStatus,
  type CustomOrderWithItems,
} from "@/lib/custom-orders/types";

const STATUS_FILTER_OPTIONS = [
  { value: "any", label: "All statuses" },
  { value: "processing,on-hold,pending", label: "In flight" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  processing: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "on-hold": "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface Stats {
  todayCount: number;
  todayRevenue: number;
  processingCount: number;
  onHoldCount: number;
  pendingCount: number;
}

interface ItemDraft {
  id?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

function emptyItem(): ItemDraft {
  return { name: "", sku: "", quantity: 1, unitPrice: 0, notes: "" };
}

interface OrderDraft {
  status: CustomOrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentReceived: boolean;
  customerNote: string;
  internalNotes: string;
  dueDate: string; // YYYY-MM-DD
  source: string;
  items: ItemDraft[];
}

function emptyDraft(): OrderDraft {
  return {
    status: "processing",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    shippingAddress: "",
    paymentMethod: "",
    paymentReceived: false,
    customerNote: "",
    internalNotes: "",
    dueDate: "",
    source: "manual",
    items: [emptyItem()],
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrderWithItems[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("any");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [drawer, setDrawer] = useState<
    | { mode: "closed" }
    | { mode: "create" }
    | { mode: "edit"; order: CustomOrderWithItems }
  >({ mode: "closed" });

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
      const res = await fetch(`/api/custom-orders?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.missing) setMissing(data.missing);
        throw new Error(data.error || `Failed (${res.status})`);
      }
      setMissing(null);
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="custom-orders" />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
              <ClipboardList className="h-3 w-3" />
              Manual orders · phone / email / walk-in
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Custom Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Orders that don&apos;t come through exora.ink. Tracked separately so the website
              dashboard stays a clean source of truth.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawer({ mode: "create" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>

        {missing && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-400">DB not configured</p>
                <p className="mt-1 text-muted-foreground">
                  Set <code className="rounded bg-muted px-1 py-0.5">DATABASE_URL</code> in{" "}
                  <code className="rounded bg-muted px-1 py-0.5">.env.local</code> and restart the dev server.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label="Today"
            value={stats ? `${stats.todayCount} orders` : "—"}
            sub={stats ? formatCurrency(stats.todayRevenue) : "—"}
            accent="sky"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Processing"
            value={stats ? String(stats.processingCount) : "—"}
            sub="ready to ship"
            accent="emerald"
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
            label="Pending"
            value={stats ? String(stats.pendingCount) : "—"}
            sub="awaiting input"
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
              {STATUS_FILTER_OPTIONS.map((s) => (
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
                  placeholder="Search by order #, name, email, company, notes…"
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

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No custom orders yet. Click <strong>New Order</strong> to create your first one.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
                  const badgeClass = STATUS_BADGE[o.status] ?? "bg-muted text-muted-foreground";
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setDrawer({ mode: "edit", order: o })}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium tabular-nums">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{o.customerName}</div>
                        {o.customerCompany && (
                          <div className="text-xs text-muted-foreground">{o.customerCompany}</div>
                        )}
                        {o.customerEmail && !o.customerCompany && (
                          <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] uppercase tracking-wide", badgeClass)}>
                          {o.status.replace("-", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{itemCount}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Edit3 className="ml-auto h-3.5 w-3.5 text-muted-foreground/60" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>

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

        <ToolFeedback toolId="custom-orders" toolLabel="Custom Orders" />

        {/* Create / edit drawer */}
        {drawer.mode !== "closed" && (
          <OrderEditorDrawer
            initial={drawer.mode === "edit" ? drawer.order : undefined}
            onClose={() => setDrawer({ mode: "closed" })}
            onSaved={() => {
              setDrawer({ mode: "closed" });
              fetchOrders();
            }}
          />
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
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderEditorDrawer({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CustomOrderWithItems;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [draft, setDraft] = useState<OrderDraft>(() => {
    if (!initial) return emptyDraft();
    return {
      status: initial.status,
      customerName: initial.customerName,
      customerEmail: initial.customerEmail ?? "",
      customerPhone: initial.customerPhone ?? "",
      customerCompany: initial.customerCompany ?? "",
      shippingAddress: initial.shippingAddress ?? "",
      paymentMethod: initial.paymentMethod ?? "",
      paymentReceived: initial.paymentReceived,
      customerNote: initial.customerNote ?? "",
      internalNotes: initial.internalNotes ?? "",
      dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : "",
      source: initial.source ?? "manual",
      items:
        initial.items.length > 0
          ? initial.items.map((i) => ({
              id: i.id,
              name: i.name,
              sku: i.sku ?? "",
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              notes: i.notes ?? "",
            }))
          : [emptyItem()],
    };
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsTotal = draft.items.reduce(
    (sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1),
    0
  );

  const setItem = (index: number, patch: Partial<ItemDraft>) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    setDraft((d) => ({ ...d, items: [...d.items, emptyItem()] }));
  };
  const removeItem = (index: number) => {
    setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }));
  };

  const save = async () => {
    if (!draft.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CustomOrderInput = {
        status: draft.status,
        source: draft.source || "manual",
        customerName: draft.customerName.trim(),
        customerEmail: draft.customerEmail.trim() || null,
        customerPhone: draft.customerPhone.trim() || null,
        customerCompany: draft.customerCompany.trim() || null,
        shippingAddress: draft.shippingAddress.trim() || null,
        paymentMethod: draft.paymentMethod.trim() || null,
        paymentReceived: draft.paymentReceived,
        customerNote: draft.customerNote.trim() || null,
        internalNotes: draft.internalNotes.trim() || null,
        dueDate: draft.dueDate || null,
        items: draft.items
          .filter((i) => i.name.trim())
          .map((i, idx) => ({
            name: i.name.trim(),
            sku: i.sku.trim() || null,
            quantity: Math.max(1, Number(i.quantity) || 1),
            unitPrice: Number(i.unitPrice) || 0,
            notes: i.notes.trim() || null,
            position: idx,
          })),
      };

      const url = isEdit ? `/api/custom-orders/${initial!.id}` : "/api/custom-orders";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !initial) return;
    if (
      !window.confirm(
        `Delete ${initial.orderNumber} for ${initial.customerName}?\n\nThis cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/custom-orders/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div onClick={onClose} className="flex-1 bg-black/40 backdrop-blur-sm" aria-hidden />
      <div className="flex w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs text-muted-foreground">
              {isEdit ? `Edit · ${initial!.orderNumber}` : "New custom order"}
            </p>
            <h2 className="text-xl font-bold">
              {isEdit ? initial!.customerName : "New order"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5 text-sm">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
              {error}
            </div>
          )}

          {/* Status + due date */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as CustomOrderStatus })
                }
              >
                {CUSTOM_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date (optional)">
              <Input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </Field>
          </div>

          {/* Customer */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h3>
            <Field label="Name *">
              <Input
                value={draft.customerName}
                onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                placeholder="Jane Doe"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input
                  type="email"
                  value={draft.customerEmail}
                  onChange={(e) => setDraft({ ...draft, customerEmail: e.target.value })}
                  placeholder="jane@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={draft.customerPhone}
                  onChange={(e) => setDraft({ ...draft, customerPhone: e.target.value })}
                  placeholder="+1 555 123 4567"
                />
              </Field>
            </div>
            <Field label="Company">
              <Input
                value={draft.customerCompany}
                onChange={(e) => setDraft({ ...draft, customerCompany: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            <Field label="Shipping address">
              <textarea
                value={draft.shippingAddress}
                onChange={(e) => setDraft({ ...draft, shippingAddress: e.target.value })}
                rows={3}
                placeholder="Street, City, State ZIP"
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
          </section>

          {/* Line items */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Line items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/80"
              >
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>
            {draft.items.map((it, i) => {
              const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
              return (
                <div key={i} className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={it.name}
                      onChange={(e) => setItem(i, { name: e.target.value })}
                      placeholder='e.g. 10×12" DTF transfer, 2 colors'
                      className="flex-1"
                    />
                    {draft.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Qty</p>
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) =>
                          setItem(i, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })
                        }
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Unit price</p>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={it.unitPrice}
                        onChange={(e) =>
                          setItem(i, { unitPrice: parseFloat(e.target.value || "0") })
                        }
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Line total</p>
                      <p className="px-3 py-2 font-medium tabular-nums">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={it.sku}
                      onChange={(e) => setItem(i, { sku: e.target.value })}
                      placeholder="SKU (optional)"
                    />
                    <Input
                      value={it.notes}
                      onChange={(e) => setItem(i, { notes: e.target.value })}
                      placeholder="Item notes (optional)"
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Order total</span>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(itemsTotal)}</span>
            </div>
          </section>

          {/* Payment */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Payment
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Method">
                <Input
                  value={draft.paymentMethod}
                  onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}
                  placeholder="Cash · Venmo · Invoice · Check"
                />
              </Field>
              <Field label="Status">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3">
                  <input
                    type="checkbox"
                    checked={draft.paymentReceived}
                    onChange={(e) =>
                      setDraft({ ...draft, paymentReceived: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="text-sm">Payment received</span>
                </label>
              </Field>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <Field label="Customer note (visible on receipts)">
              <textarea
                value={draft.customerNote}
                onChange={(e) => setDraft({ ...draft, customerNote: e.target.value })}
                rows={2}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Internal notes (operator-only)">
              <textarea
                value={draft.internalNotes}
                onChange={(e) => setDraft({ ...draft, internalNotes: e.target.value })}
                rows={2}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-background px-5 py-3">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={remove}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
