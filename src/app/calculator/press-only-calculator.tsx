"use client";

import { usePressService } from "@/hooks/use-press-service";
import { PRESS_LOCATIONS, PLACEMENT_TYPES, GROSS_MARGIN_FLOOR } from "@/lib/constants";
import type { PressServiceTier, PlacementComplexity } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";

const TIER_INFO: Record<PressServiceTier, { label: string; description: string; color: string }> = {
  A: { label: "Premium", description: "5–32% below screen print. Complex designs, premium garments, precision placements.", color: "bg-amber-500" },
  B: { label: "Competitive", description: "10–48% below screen print. Balanced — strong savings, strong margins. Default.", color: "bg-teal-500" },
  C: { label: "Volume", description: "15–58% below screen print. Win competitive bids, high-volume, price-sensitive.", color: "bg-sky-500" },
};

export function PressOnlyCalculator() {
  const {
    tier, setTier,
    placements, addPlacement, removePlacement, updatePlacement, updatePlacementComplexity,
    quantity, setQuantity,
    colorCount, setColorCount,
    showInternalMetrics, setShowInternalMetrics,
    quote,
    colorEscalation,
  } = usePressService();

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      {/* LEFT: Configuration */}
      <div className="space-y-6">
        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>Print-and-Press Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You provide the garments — we print DTF transfers and press them onto your shirts.
              Pricing is anchored to screen print market rates, with DTF savings that increase
              with color count. Select a tier based on job characteristics.
            </p>
          </CardContent>
        </Card>

        {/* Tier Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(["A", "B", "C"] as PressServiceTier[]).map((t) => {
                const info = TIER_INFO[t];
                const active = tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${info.color}`} />
                      <span className="font-medium text-foreground">
                        Tier {t}: {info.label}
                      </span>
                      {t === "B" && (
                        <Badge className="bg-teal-600 text-white text-[10px]">Default</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Placements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Placements</CardTitle>
              {placements.length < PRESS_LOCATIONS.length && (
                <button
                  type="button"
                  onClick={addPlacement}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {placements.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={p.locationId}
                      onChange={(e) => updatePlacement(i, e.target.value)}
                    >
                      {PRESS_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={p.complexity}
                      onChange={(e) =>
                        updatePlacementComplexity(i, e.target.value as PlacementComplexity)
                      }
                    >
                      {Object.entries(PLACEMENT_TYPES).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label} — {val.description}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {placements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlacement(i)}
                      className="mt-1 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Count */}
        <Card>
          <CardHeader>
            <CardTitle>Design Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorCount(c)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    colorCount === c
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                  }`}
                >
                  {c} {c === 1 ? "Color" : "Colors"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              DTF prints unlimited colors at flat cost — your discount vs screen print increases with color count.
            </p>
          </CardContent>
        </Card>

        {/* Quantity */}
        <Card>
          <CardHeader>
            <CardTitle>Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min={1}
              max={9999}
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) setQuantity(v);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Results */}
      <div className="space-y-6">
        {/* Internal metrics toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowInternalMetrics(!showInternalMetrics)}
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showInternalMetrics ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showInternalMetrics ? "Hide" : "Show"} Internal Metrics
          </button>
        </div>

        {quote && (
          <>
            {/* Quote Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {quantity} shirts × {placements.length} placement{placements.length !== 1 ? "s" : ""} × {colorCount} color{colorCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tier {tier}: {TIER_INFO[tier].label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">DTF Quote</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary tabular-nums">
                      {formatCurrency(quote.dtfOrderTotal)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(quote.dtfPerShirt)} per shirt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Screen Print Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>vs. Screen Printing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Screen Print */}
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Screen Print</p>
                    <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                      {formatCurrency(quote.screenPrintOrderTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(quote.screenPrintTotalPerShirt)}/shirt
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Incl. {formatCurrency(quote.screenPrintScreenCharges)} screen charges
                    </p>
                  </div>
                  {/* DTF */}
                  <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400">DTF Print-and-Press</p>
                    <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                      {formatCurrency(quote.dtfOrderTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(quote.dtfPerShirt)}/shirt
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      No screen charges, no setup fees
                    </p>
                  </div>
                </div>

                {/* Savings Banner */}
                <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Customer Saves</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(quote.customerSavingsPerShirt * quantity)}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {quote.discountPercent}% below screen print · {formatCurrency(quote.customerSavingsPerShirt)}/shirt
                  </p>
                </div>

                {/* Visual comparison bar */}
                <div className="mt-4">
                  <div className="flex h-10 overflow-hidden rounded-lg">
                    <div
                      className="flex items-center justify-center bg-teal-500 text-xs font-medium text-white transition-all"
                      style={{ width: `${(quote.dtfOrderTotal / quote.screenPrintOrderTotal) * 100}%` }}
                    >
                      DTF {formatCurrency(quote.dtfOrderTotal)}
                    </div>
                    <div className="flex flex-1 items-center justify-center bg-orange-400/30 text-xs font-medium text-orange-600 dark:text-orange-400">
                      +{formatCurrency(quote.screenPrintOrderTotal - quote.dtfOrderTotal)}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>DTF Price</span>
                    <span>Screen Print: {formatCurrency(quote.screenPrintOrderTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Margin Analysis */}
            {showInternalMetrics && (
              <Card className={`border ${!quote.meetsMarginFloor ? "border-red-500/30 bg-red-500/5" : "border-border"}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <CardTitle>Margin Analysis (Internal)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cost/Shirt</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(quote.costPerShirt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit/Shirt</p>
                      <p className="text-lg font-bold tabular-nums text-emerald-600">
                        {formatCurrency(quote.grossProfitPerShirt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gross Margin</p>
                      <p className={`text-lg font-bold tabular-nums ${
                        quote.grossMarginPercent >= 50
                          ? "text-emerald-600"
                          : quote.grossMarginPercent >= 30
                          ? "text-amber-500"
                          : "text-red-500"
                      }`}>
                        {formatPercent(quote.grossMarginPercent)}
                      </p>
                    </div>
                  </div>
                  {!quote.meetsMarginFloor && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Below {GROSS_MARGIN_FLOOR}% GM floor. Consider Tier A or fewer placements.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Color Escalation Table */}
            <Card>
              <CardHeader>
                <CardTitle>Price by Color Count (Tier {tier})</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Colors</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Discount</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">DTF/Shirt</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">DTF Order</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">SP Order</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Savings</th>
                      {showInternalMetrics && (
                        <th className="pb-2 text-right font-medium text-muted-foreground">GM%</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {colorEscalation.map((row) => {
                      const active = row.colorCount === colorCount;
                      return (
                        <tr
                          key={row.colorCount}
                          className={`cursor-pointer transition-colors ${
                            active ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setColorCount(row.colorCount)}
                        >
                          <td className="py-2 font-medium">
                            {row.colorCount} {row.colorCount === 1 ? "color" : "colors"}
                            {active && (
                              <Badge className="ml-2 bg-primary text-primary-foreground text-[10px]">
                                Selected
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 text-right tabular-nums">{row.discountPercent}%</td>
                          <td className="py-2 text-right font-medium tabular-nums">
                            {formatCurrency(row.dtfPerShirt)}
                          </td>
                          <td className="py-2 text-right tabular-nums">{formatCurrency(row.dtfOrderTotal)}</td>
                          <td className="py-2 text-right tabular-nums text-muted-foreground">
                            {formatCurrency(row.screenPrintOrderTotal)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-emerald-600">
                            {row.customerSavingsPercent}%
                          </td>
                          {showInternalMetrics && (
                            <td className={`py-2 text-right tabular-nums font-medium ${
                              row.grossMarginPercent >= 50
                                ? "text-emerald-600"
                                : row.grossMarginPercent >= 30
                                ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                              {formatPercent(row.grossMarginPercent)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* DTF Advantages */}
            <Card>
              <CardHeader>
                <CardTitle>Why DTF over Screen Print?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: "Unlimited Colors", desc: "No per-color charges. Full photo prints at flat cost." },
                    { title: "50+ Wash Durability", desc: "Stretch without cracking. Outlasts screen print on performance garments." },
                    { title: "No Screen Charges", desc: "Zero setup fees. No screens to burn, no color registration." },
                    { title: "Per-Size Logo Scaling", desc: "Different logo sizes per garment size at zero additional cost." },
                    { title: "Super Fine Detail", desc: "Thin lines, gradients, photographic quality — impossible in screen print." },
                    { title: "No Minimum Waste", desc: "First print is production-quality. No test garments wasted on premium blanks." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!quote && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Add at least one placement and set quantity to see pricing.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
