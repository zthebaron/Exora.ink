"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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

const GARMENT_PRESETS = [
  { label: "Basic Tee", price: 4 },
  { label: "Premium Tee", price: 8 },
  { label: "Tank Top", price: 6 },
  { label: "Polo", price: 14 },
  { label: "Performance Shirt", price: 12 },
  { label: "Crewneck Sweatshirt", price: 16 },
  { label: "Hoodie", price: 18 },
  { label: "Custom / Other", price: 0 },
];

const VOLUME_TIERS = [
  { min: 1, max: 11, discount: 0, label: "1–11 pieces" },
  { min: 12, max: 23, discount: 0.1, label: "12–23 pieces (10% off)" },
  { min: 24, max: 47, discount: 0.15, label: "24–47 pieces (15% off)" },
  { min: 48, max: 99, discount: 0.2, label: "48–99 pieces (20% off)" },
  { min: 100, max: Infinity, discount: 0.25, label: "100+ pieces (25% off)" },
];

function getDiscount(qty: number) {
  return VOLUME_TIERS.find((t) => qty >= t.min && qty <= t.max) ?? VOLUME_TIERS[0];
}

export function FullServiceCalculator() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["front"]);
  const [qty, setQty] = useState(24);
  const [garmentPresetIndex, setGarmentPresetIndex] = useState(0);
  const [customGarmentPrice, setCustomGarmentPrice] = useState(10);

  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const garmentPreset = GARMENT_PRESETS[garmentPresetIndex];
  const isCustom = garmentPreset.label === "Custom / Other";
  const garmentPrice = isCustom ? customGarmentPrice : garmentPreset.price;

  const pressPerPiece = PRESS_LOCATIONS.filter((l) =>
    selectedLocations.includes(l.id)
  ).reduce((sum, l) => sum + l.price, 0);

  const tier = getDiscount(qty);
  const pressDiscounted = pressPerPiece * (1 - tier.discount);
  const unitPrice = garmentPrice + pressDiscounted;
  const total = unitPrice * qty;
  const garmentTotal = garmentPrice * qty;
  const pressTotal = pressDiscounted * qty;

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
              Full service — we source the garment, print the DTF transfers, and
              press them. You receive finished, ready-to-wear custom apparel.
              Choose a garment type below or set a custom price with the slider.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Garment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {GARMENT_PRESETS.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setGarmentPresetIndex(i)}
                  className={`rounded-lg border px-3 py-2.5 text-center text-sm transition-all ${
                    i === garmentPresetIndex
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="block font-medium">{g.label}</span>
                  {g.price > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(g.price)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isCustom && (
              <div className="mt-4 rounded-lg border border-border p-4">
                <Slider
                  label="Garment Cost"
                  value={customGarmentPrice}
                  onChange={setCustomGarmentPrice}
                  min={2}
                  max={100}
                  step={1}
                  formatValue={(v) => formatCurrency(v)}
                />
              </div>
            )}
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
                Press discount: {tier.label}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Results */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Per-Piece Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Garment: {isCustom ? "Custom" : garmentPreset.label}
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(garmentPrice)}</span>
              </div>
              {PRESS_LOCATIONS.filter((l) => selectedLocations.includes(l.id)).map((loc) => (
                <div key={loc.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Press: {loc.label}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(loc.price)}</span>
                </div>
              ))}
              {tier.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Press volume discount</span>
                  <span className="font-medium">-{(tier.discount * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-semibold text-foreground">Total per piece</span>
                <span className="text-lg font-bold tabular-nums">
                  {selectedLocations.length > 0 ? formatCurrency(unitPrice) : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Split Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Split per Piece</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLocations.length > 0 ? (
              <>
                <div className="mb-4 flex h-8 overflow-hidden rounded-lg">
                  <div
                    className="flex items-center justify-center bg-teal-500 text-xs font-medium text-white"
                    style={{ width: `${(garmentPrice / unitPrice) * 100}%` }}
                  >
                    {((garmentPrice / unitPrice) * 100).toFixed(0)}%
                  </div>
                  <div
                    className="flex items-center justify-center bg-sky-500 text-xs font-medium text-white"
                    style={{ width: `${(pressDiscounted / unitPrice) * 100}%` }}
                  >
                    {((pressDiscounted / unitPrice) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-teal-500" />
                    <span className="text-muted-foreground">Garment ({formatCurrency(garmentPrice)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-sky-500" />
                    <span className="text-muted-foreground">Pressing ({formatCurrency(pressDiscounted)})</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select print locations to see cost split</p>
            )}
          </CardContent>
        </Card>

        {/* Volume Discount Table */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Discounts (Press Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Quantity</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Press Discount</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Per Piece</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {VOLUME_TIERS.map((t) => {
                  const active = qty >= t.min && qty <= t.max;
                  const tierPressPrice = pressPerPiece * (1 - t.discount);
                  const tierUnitPrice = garmentPrice + tierPressPrice;
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
                        {selectedLocations.length > 0 ? formatCurrency(tierUnitPrice) : "—"}
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
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Garments ({qty} × {formatCurrency(garmentPrice)})</span>
                <span className="font-medium tabular-nums">{formatCurrency(garmentTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pressing ({qty} × {formatCurrency(pressDiscounted)})</span>
                <span className="font-medium tabular-nums">{formatCurrency(pressTotal)}</span>
              </div>
            </div>
            <div className="flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {qty} pieces · {isCustom ? "Custom" : garmentPreset.label} · {selectedLocations.length} location{selectedLocations.length !== 1 ? "s" : ""}
                </p>
                <p className="text-2xl font-bold text-foreground">Order Total</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {selectedLocations.length > 0 ? formatCurrency(total) : "$0.00"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocations.length > 0
                    ? `${formatCurrency(unitPrice)} per piece`
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
