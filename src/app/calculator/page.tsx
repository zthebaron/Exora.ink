"use client";

import { useCalculator } from "@/hooks/use-calculator";
import { GANG_SHEET_SIZES } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function MarginBadge({ margin }: { margin: number }) {
  if (margin >= 50) {
    return (
      <Badge className="bg-emerald-600 text-white">
        {formatPercent(margin)}
      </Badge>
    );
  }
  if (margin >= 30) {
    return (
      <Badge className="bg-amber-500 text-white">
        {formatPercent(margin)}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500 text-white">
      {formatPercent(margin)}
    </Badge>
  );
}

const COST_COLORS: Record<string, string> = {
  materialCost: "bg-teal-500",
  inkCost: "bg-sky-500",
  powderCost: "bg-amber-500",
  laborCost: "bg-emerald-500",
  equipmentBurden: "bg-rose-500",
  overheadAllocation: "bg-indigo-400",
  wasteAllowance: "bg-orange-400",
  packagingCost: "bg-teal-400",
  reprintReserve: "bg-pink-400",
};

const COST_LABELS: Record<string, string> = {
  materialCost: "Film / Material",
  inkCost: "Ink",
  powderCost: "Adhesive Powder",
  laborCost: "Labor",
  equipmentBurden: "Equipment",
  overheadAllocation: "Overhead",
  wasteAllowance: "Waste Allowance",
  packagingCost: "Packaging",
  reprintReserve: "Reprint Reserve",
};

export default function CalculatorPage() {
  const {
    assumptions,
    updateAssumption,
    resetAssumptions,
    selectedSizeIndex,
    setSelectedSizeIndex,
    selectedSize,
    costBreakdown,
    pricing,
    allSizePricing,
    clv,
  } = useCalculator();

  const costItems = [
    { key: "materialCost", value: costBreakdown.materialCost },
    { key: "inkCost", value: costBreakdown.inkCost },
    { key: "powderCost", value: costBreakdown.powderCost },
    { key: "laborCost", value: costBreakdown.laborCost },
    { key: "equipmentBurden", value: costBreakdown.equipmentBurden },
    { key: "overheadAllocation", value: costBreakdown.overheadAllocation },
    { key: "wasteAllowance", value: costBreakdown.wasteAllowance },
    { key: "packagingCost", value: costBreakdown.packagingCost },
    { key: "reprintReserve", value: costBreakdown.reprintReserve },
  ];

  const maxCostValue = Math.max(...costItems.map((c) => c.value), 0.01);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Profitability Calculator
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Adjust your assumptions and see real-time cost breakdowns, pricing, and margin analysis.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* ---- LEFT SIDEBAR ---- */}
          <aside className="space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">
            {/* Sheet Size Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Sheet Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={String(selectedSizeIndex)}
                  onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
                >
                  {GANG_SHEET_SIZES.map((size, i) => (
                    <option key={size.name} value={i}>
                      {size.name} &mdash; {size.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected: {selectedSize.name} ({selectedSize.label})
                </p>
              </CardContent>
            </Card>

            {/* Material Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Material Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Slider
                  label="Film Cost per Roll"
                  value={assumptions.filmCostPerRoll}
                  onChange={(v) => updateAssumption("filmCostPerRoll", v)}
                  min={50}
                  max={150}
                  step={1}
                  formatValue={(v) => formatCurrency(v)}
                />
                <Slider
                  label="Ink Cost per mL"
                  value={assumptions.inkCostPerMl}
                  onChange={(v) => updateAssumption("inkCostPerMl", v)}
                  min={0.03}
                  max={0.15}
                  step={0.01}
                  formatValue={(v) => `$${v.toFixed(2)}`}
                />
                <Slider
                  label="Powder Cost per lb"
                  value={assumptions.powderCostPerLb}
                  onChange={(v) => updateAssumption("powderCostPerLb", v)}
                  min={5}
                  max={25}
                  step={1}
                  formatValue={(v) => formatCurrency(v)}
                />
              </CardContent>
            </Card>

            {/* Labor & Production */}
            <Card>
              <CardHeader>
                <CardTitle>Labor &amp; Production</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Slider
                  label="Labor Cost per Hour"
                  value={assumptions.laborCostPerHour}
                  onChange={(v) => updateAssumption("laborCostPerHour", v)}
                  min={12}
                  max={45}
                  step={1}
                  formatValue={(v) => formatCurrency(v)}
                />
                <Slider
                  label="Avg Sheets per Hour"
                  value={assumptions.avgProductionSpeedPerHour}
                  onChange={(v) => updateAssumption("avgProductionSpeedPerHour", v)}
                  min={5}
                  max={30}
                  step={1}
                  formatValue={(v) => `${v} sheets`}
                />
              </CardContent>
            </Card>

            {/* Overhead */}
            <Card>
              <CardHeader>
                <CardTitle>Overhead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Electricity ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={assumptions.electricityCostPerMonth}
                    onChange={(e) =>
                      updateAssumption("electricityCostPerMonth", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Machine Lease ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={assumptions.machineLeasePerMonth}
                    onChange={(e) =>
                      updateAssumption("machineLeasePerMonth", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Maintenance Reserve ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={assumptions.maintenanceReservePerMonth}
                    onChange={(e) =>
                      updateAssumption("maintenanceReservePerMonth", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Software ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={assumptions.softwareCostPerMonth}
                    onChange={(e) =>
                      updateAssumption("softwareCostPerMonth", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Rent / Overhead ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={assumptions.rentOverheadPerMonth}
                    onChange={(e) =>
                      updateAssumption("rentOverheadPerMonth", Number(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quality & Waste */}
            <Card>
              <CardHeader>
                <CardTitle>Quality &amp; Waste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Slider
                  label="Waste Percentage"
                  value={assumptions.wastePercentage}
                  onChange={(v) => updateAssumption("wastePercentage", v)}
                  min={0}
                  max={20}
                  step={0.5}
                  formatValue={(v) => `${v}%`}
                />
                <Slider
                  label="Failed Print Percentage"
                  value={assumptions.failedPrintPercentage}
                  onChange={(v) => updateAssumption("failedPrintPercentage", v)}
                  min={0}
                  max={15}
                  step={0.5}
                  formatValue={(v) => `${v}%`}
                />
              </CardContent>
            </Card>

            {/* Margins & Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Margins &amp; Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Slider
                  label="Desired Gross Margin"
                  value={assumptions.desiredGrossMargin}
                  onChange={(v) => updateAssumption("desiredGrossMargin", v)}
                  min={20}
                  max={80}
                  step={1}
                  formatValue={(v) => `${v}%`}
                />
                <Slider
                  label="Desired Net Margin"
                  value={assumptions.desiredNetMargin}
                  onChange={(v) => updateAssumption("desiredNetMargin", v)}
                  min={5}
                  max={50}
                  step={1}
                  formatValue={(v) => `${v}%`}
                />
                <Slider
                  label="Rush Fee Percentage"
                  value={assumptions.rushFeePercentage}
                  onChange={(v) => updateAssumption("rushFeePercentage", v)}
                  min={0}
                  max={100}
                  step={1}
                  formatValue={(v) => `${v}%`}
                />
              </CardContent>
            </Card>

            {/* Reset Button */}
            <button
              onClick={resetAssumptions}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
            >
              Reset to Defaults
            </button>
          </aside>

          {/* ---- MAIN CONTENT ---- */}
          <main className="space-y-6">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Cost Breakdown &mdash; {selectedSize.name} ({selectedSize.label})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costItems.map(({ key, value }) => {
                    const pct = maxCostValue > 0 ? (value / maxCostValue) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 text-sm text-muted-foreground">
                          {COST_LABELS[key]}
                        </span>
                        <div className="relative h-6 flex-1 rounded bg-muted/40">
                          <div
                            className={`h-full rounded ${COST_COLORS[key]}`}
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-sm font-medium tabular-nums">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-base font-semibold text-foreground">
                    Total Cost per Sheet
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(costBreakdown.totalCostPerSheet)}
                  </span>
                </div>
                <p className="mt-1 text-right text-sm text-muted-foreground">
                  {formatCurrency(costBreakdown.costPerSqFt)} per sq ft
                </p>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  {/* Retail */}
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Retail Price</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatCurrency(pricing.retailPrice)}
                    </p>
                  </div>
                  {/* Wholesale */}
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Wholesale Price</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatCurrency(pricing.wholesalePrice)}
                    </p>
                  </div>
                  {/* Rush */}
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Rush Price</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatCurrency(pricing.rushPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {/* Gross */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Profit</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(pricing.grossProfit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-xs text-muted-foreground">Gross Margin</p>
                      <MarginBadge margin={pricing.grossMargin} />
                    </div>
                  </div>
                  {/* Net */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(pricing.netProfit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-xs text-muted-foreground">Net Margin</p>
                      <MarginBadge margin={pricing.netMargin} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Sizes Pricing Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Sizes Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Size</th>
                        <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                          Retail
                        </th>
                        <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                          Wholesale
                        </th>
                        <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                          Cost
                        </th>
                        <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                          Gross Profit
                        </th>
                        <th className="pb-3 text-right font-medium text-muted-foreground">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allSizePricing.map((row) => (
                        <tr
                          key={row.name}
                          className={
                            row.name === selectedSize.name
                              ? "bg-primary/5"
                              : "hover:bg-muted/20"
                          }
                        >
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {row.name}
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {row.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(row.pricing.retailPrice)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(row.pricing.wholesalePrice)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(row.pricing.costBreakdown.totalCostPerSheet)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(row.pricing.grossProfit)}
                          </td>
                          <td className="py-3 text-right">
                            <MarginBadge margin={row.pricing.grossMargin} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Customer Lifetime Value */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Avg Order Value</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatCurrency(clv.avgOrderValue)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Repeat Frequency</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {clv.repeatFrequency}x / year
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Gross Profit / Customer / yr</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatCurrency(clv.grossProfitPerCustomer)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Acquisition Cost</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatCurrency(clv.acquisitionCost)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Payback Period</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {clv.paybackPeriodMonths} months
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Lifetime Value (3 yr)</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
                      {formatCurrency(clv.lifetimeValue)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Lifetime Profit (3 yr)</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
                      {formatCurrency(clv.lifetimeProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
