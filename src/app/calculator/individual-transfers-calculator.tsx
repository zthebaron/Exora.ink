"use client";

import { useState, useMemo } from "react";
import { INDIVIDUAL_TRANSFER_SIZES, INDIVIDUAL_TRANSFER_VOLUME_TIERS, INDIVIDUAL_TRANSFER_BASE_RATE } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

function getVolumeTier(qty: number) {
  return INDIVIDUAL_TRANSFER_VOLUME_TIERS.find((t) => qty >= t.min && qty <= t.max) ?? INDIVIDUAL_TRANSFER_VOLUME_TIERS[0];
}

export function IndividualTransfersCalculator() {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [customWidth, setCustomWidth] = useState(5);
  const [customHeight, setCustomHeight] = useState(5);
  const [useCustom, setUseCustom] = useState(false);
  const [quantity, setQuantity] = useState(50);

  const size = useCustom
    ? { width: customWidth, height: customHeight, label: `${customWidth}" × ${customHeight}"` }
    : INDIVIDUAL_TRANSFER_SIZES[sizeIndex];

  const sqIn = size.width * size.height;
  const basePrice = sqIn * INDIVIDUAL_TRANSFER_BASE_RATE;
  const tier = getVolumeTier(quantity);
  const discountedPrice = basePrice * (1 - tier.discount);
  const total = discountedPrice * quantity;

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      {/* LEFT: Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Per-transfer pricing based on logo area. Our base rate is{" "}
              <span className="font-medium text-foreground">${INDIVIDUAL_TRANSFER_BASE_RATE}/sq in</span> with
              volume breaks up to 25% off. Printed on our 30&quot; wide Mimaki TxF300-75 for
              maximum efficiency.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {INDIVIDUAL_TRANSFER_SIZES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => { setSizeIndex(i); setUseCustom(false); }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                    !useCustom && sizeIndex === i
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {(s.width * s.height).toFixed(1)} sq in · {formatCurrency(s.width * s.height * INDIVIDUAL_TRANSFER_BASE_RATE)}/ea
                    </span>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                  useCustom
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
              >
                <span className="font-medium">Custom Size</span>
              </button>
            </div>

            {useCustom && (
              <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
                <Slider
                  label="Width (inches)"
                  value={customWidth}
                  onChange={setCustomWidth}
                  min={1}
                  max={30}
                  step={0.5}
                  formatValue={(v) => `${v}"`}
                />
                <Slider
                  label="Height (inches)"
                  value={customHeight}
                  onChange={setCustomHeight}
                  min={1}
                  max={36}
                  step={0.5}
                  formatValue={(v) => `${v}"`}
                />
                <p className="text-xs text-muted-foreground">
                  Area: {sqIn.toFixed(1)} sq in · Max width: 30&quot; (our print width)
                </p>
              </div>
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
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) setQuantity(v);
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium">{size.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Area</span>
                <span className="font-medium tabular-nums">{sqIn.toFixed(1)} sq in</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base rate</span>
                <span className="font-medium tabular-nums">${INDIVIDUAL_TRANSFER_BASE_RATE}/sq in</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-medium text-foreground">Base price per transfer</span>
                <span className="font-bold tabular-nums">{formatCurrency(basePrice)}</span>
              </div>
              {tier.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Volume discount</span>
                  <span className="font-medium">-{(tier.discount * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discounted price</span>
                <span className="font-bold tabular-nums">{formatCurrency(discountedPrice)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Effective rate: ${(discountedPrice / sqIn).toFixed(4)}/sq in
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
                  <th className="pb-2 text-right font-medium text-muted-foreground">Per Transfer</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">$/sq in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INDIVIDUAL_TRANSFER_VOLUME_TIERS.map((t) => {
                  const active = quantity >= t.min && quantity <= t.max;
                  const tierPrice = basePrice * (1 - t.discount);
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
                      <td className="py-2 text-right tabular-nums">{formatCurrency(tierPrice)}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">
                        ${(tierPrice / sqIn).toFixed(4)}
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
                  {quantity} transfers × {size.label}
                </p>
                <p className="text-2xl font-bold text-foreground">Order Total</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(discountedPrice)} per transfer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
