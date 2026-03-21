"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PRESS_LOCATIONS = [
  { id: "front", label: "Front", price: 3.0 },
  { id: "back", label: "Back", price: 3.5 },
  { id: "left-chest", label: "Left Chest", price: 2.0 },
  { id: "right-chest", label: "Right Chest", price: 2.0 },
  { id: "sleeve-l", label: "Left Sleeve", price: 2.5 },
  { id: "sleeve-r", label: "Right Sleeve", price: 2.5 },
  { id: "neck-back", label: "Nape / Back Neck", price: 2.0 },
];

const VOLUME_TIERS = [
  { min: 1, max: 11, discount: 0, label: "1–11 pieces" },
  { min: 12, max: 23, discount: 0.1, label: "12–23 pieces (10% off)" },
  { min: 24, max: 47, discount: 0.15, label: "24–47 pieces (15% off)" },
  { min: 48, max: 99, discount: 0.2, label: "48–99 pieces (20% off)" },
  { min: 100, max: Infinity, discount: 0.25, label: "100+ pieces (25% off)" },
];

function getDiscount(qty: number) {
  const tier = VOLUME_TIERS.find((t) => qty >= t.min && qty <= t.max);
  return tier ?? VOLUME_TIERS[0];
}

export function PressOnlyCalculator() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["front"]);
  const [qty, setQty] = useState(12);

  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const pressPerPiece = PRESS_LOCATIONS.filter((l) =>
    selectedLocations.includes(l.id)
  ).reduce((sum, l) => sum + l.price, 0);

  const tier = getDiscount(qty);
  const discountedPerPiece = pressPerPiece * (1 - tier.discount);
  const total = discountedPerPiece * qty;

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      {/* LEFT: Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You provide the garments — we press your DTF transfers onto them.
              Drop off or ship your shirts to us and we handle the rest.
              Transfer printing is not included; bring your own pre-printed transfers
              or order gang sheets from our Gang Sheet Pricing tab.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Print Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {PRESS_LOCATIONS.map((loc) => {
                const active = selectedLocations.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="block font-medium">{loc.label}</span>
                    <span className="text-xs text-muted-foreground">
                      +{formatCurrency(loc.price)}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedLocations.length === 0 && (
              <p className="mt-2 text-xs text-red-500">Select at least one print location</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min={1}
              max={9999}
              value={qty}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) setQty(v);
              }}
            />
            {tier.discount > 0 && (
              <p className="mt-2 text-xs font-medium text-emerald-600">
                Volume discount: {tier.label}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Results */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PRESS_LOCATIONS.filter((l) => selectedLocations.includes(l.id)).map((loc) => (
                <div key={loc.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{loc.label}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(loc.price)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-medium text-foreground">Press per piece</span>
                <span className="font-bold tabular-nums">{formatCurrency(pressPerPiece)}</span>
              </div>
              {tier.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Volume discount</span>
                  <span className="font-medium">-{(tier.discount * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">After discount per piece</span>
                <span className="font-bold tabular-nums">{formatCurrency(discountedPerPiece)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume Discount Table */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Quantity</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Discount</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Per Piece</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {VOLUME_TIERS.map((t) => {
                  const active = qty >= t.min && qty <= t.max;
                  return (
                    <tr key={t.label} className={active ? "bg-primary/5" : ""}>
                      <td className="py-2 font-medium">
                        {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                        {active && (
                          <Badge className="ml-2 bg-primary text-primary-foreground text-[10px]">
                            Current
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {t.discount === 0 ? "—" : `${(t.discount * 100).toFixed(0)}%`}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {selectedLocations.length > 0
                          ? formatCurrency(pressPerPiece * (1 - t.discount))
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Order Total */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {qty} pieces × {selectedLocations.length} location{selectedLocations.length !== 1 ? "s" : ""}
                </p>
                <p className="text-2xl font-bold text-foreground">Order Total</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {selectedLocations.length > 0 ? formatCurrency(total) : "$0.00"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocations.length > 0
                    ? `${formatCurrency(discountedPerPiece)} per piece`
                    : "Select locations"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
