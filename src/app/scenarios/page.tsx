"use client";

import { useState, useMemo } from "react";
import {
  getDefaultAssumptions,
  getScenarioPresets,
  calculateScenario,
  calculateSensitivity,
} from "@/lib/pricing-engine";
import type { Assumptions, ScenarioResult, SensitivityPoint } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import { ROLL_WIDTH_OPTIONS, getGangSheetSizes } from "@/lib/constants";
import type { RollWidthMode } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "green" | "red" | "default";
}) {
  const colorClass =
    color === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : color === "red"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
    </div>
  );
}

function profitColor(value: number): "green" | "red" | "default" {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "default";
}

// ---------------------------------------------------------------------------
// Preset Scenario Card
// ---------------------------------------------------------------------------

function ScenarioCard({ scenario }: { scenario: ScenarioResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{scenario.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatNumber(scenario.monthlyOrders)} orders/mo &middot; Avg{" "}
          {formatCurrency(scenario.avgOrderValue)}
        </p>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <MetricRow label="Revenue" value={formatCurrency(scenario.revenue)} />
        <MetricRow label="COGS" value={formatCurrency(scenario.cogs)} color="red" />
        <MetricRow
          label="Gross Profit"
          value={formatCurrency(scenario.grossProfit)}
          color={profitColor(scenario.grossProfit)}
        />
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Gross Margin</span>
          <Badge
            variant={scenario.grossMargin >= 40 ? "default" : "destructive"}
            className="text-xs"
          >
            {formatPercent(scenario.grossMargin)}
          </Badge>
        </div>
        <MetricRow
          label="Operating Expenses"
          value={formatCurrency(scenario.operatingExpenses)}
          color="red"
        />
        <div className="my-1 border-t border-border" />
        <MetricRow
          label="Net Profit"
          value={formatCurrency(scenario.netProfit)}
          color={profitColor(scenario.netProfit)}
        />
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Net Margin</span>
          <Badge
            variant={scenario.netMargin >= 10 ? "default" : "destructive"}
            className="text-xs"
          >
            {formatPercent(scenario.netMargin)}
          </Badge>
        </div>
        <div className="my-1 border-t border-border" />
        <MetricRow
          label="Break-even Orders"
          value={formatNumber(scenario.breakEvenOrders)}
        />
        <MetricRow
          label="Profit per Order"
          value={formatCurrency(scenario.profitPerOrder)}
          color={profitColor(scenario.profitPerOrder)}
        />
        <MetricRow
          label="Monthly Forecast"
          value={formatCurrency(scenario.monthlyProfitForecast)}
          color={profitColor(scenario.monthlyProfitForecast)}
        />
        <MetricRow
          label="Annual Forecast"
          value={formatCurrency(scenario.annualProfitForecast)}
          color={profitColor(scenario.annualProfitForecast)}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tornado Chart
// ---------------------------------------------------------------------------

function TornadoChart({ points }: { points: SensitivityPoint[] }) {
  // Find the max absolute deviation from base to scale bars
  const maxDeviation = Math.max(
    ...points.map((p) =>
      Math.max(
        Math.abs(p.lowProfit - p.baseProfit),
        Math.abs(p.highProfit - p.baseProfit),
      ),
    ),
  );

  // Sort by impact range (largest first)
  const sorted = [...points].sort(
    (a, b) =>
      Math.abs(b.highProfit - b.lowProfit) - Math.abs(a.highProfit - a.lowProfit),
  );

  return (
    <div className="space-y-3">
      {sorted.map((point) => {
        const lowDev = point.lowProfit - point.baseProfit;
        const highDev = point.highProfit - point.baseProfit;

        const leftWidth =
          maxDeviation > 0
            ? Math.abs(Math.min(lowDev, highDev, 0)) / maxDeviation
            : 0;
        const rightWidth =
          maxDeviation > 0
            ? Math.abs(Math.max(lowDev, highDev, 0)) / maxDeviation
            : 0;

        return (
          <div key={point.variable} className="grid grid-cols-[140px_1fr] items-center gap-3">
            <span className="text-sm font-medium text-foreground text-right">
              {point.variable}
            </span>
            <div className="flex items-center gap-0">
              {/* Left (negative) bar */}
              <div className="flex w-1/2 justify-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatCurrency(Math.min(point.lowProfit, point.highProfit))}
                  </span>
                  <div
                    className="h-6 rounded-l bg-red-500/70"
                    style={{
                      width: `${Math.max(leftWidth * 100, 2)}%`,
                      minWidth: "4px",
                    }}
                  />
                </div>
              </div>
              {/* Center line */}
              <div className="w-px bg-foreground/30 h-8 shrink-0" />
              {/* Right (positive) bar */}
              <div className="flex w-1/2 justify-start">
                <div className="flex items-center gap-1">
                  <div
                    className="h-6 rounded-r bg-emerald-500/70"
                    style={{
                      width: `${Math.max(rightWidth * 100, 2)}%`,
                      minWidth: "4px",
                    }}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatCurrency(Math.max(point.lowProfit, point.highProfit))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[140px_1fr] items-center gap-3">
        <span />
        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            Base: {formatCurrency(sorted[0]?.baseProfit ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ScenariosPage() {
  const [rollMode, setRollMode] = useState<RollWidthMode>("wide");
  const [assumptions, setAssumptions] = useState<Assumptions>(() => getDefaultAssumptions("wide"));

  const gangSheetSizes = useMemo(() => getGangSheetSizes(rollMode), [rollMode]);

  const switchRollMode = (mode: RollWidthMode) => {
    setRollMode(mode);
    const newDefaults = getDefaultAssumptions(mode);
    setAssumptions((prev) => ({
      ...prev,
      rollWidth: newDefaults.rollWidth,
      filmCostPerRoll: newDefaults.filmCostPerRoll,
    }));
    setCustomSheetIndex((idx) => Math.min(idx, getGangSheetSizes(mode).length - 1));
  };

  // Custom scenario state
  const [customName, setCustomName] = useState("My Custom Scenario");
  const [customOrders, setCustomOrders] = useState(200);
  const [customRetailMix, setCustomRetailMix] = useState(75);
  const [customSheetIndex, setCustomSheetIndex] = useState(1); // Medium
  const [customWaste, setCustomWaste] = useState(assumptions.wastePercentage);
  const [customMargin, setCustomMargin] = useState(assumptions.desiredGrossMargin);

  // Presets
  const presets = useMemo(() => getScenarioPresets(assumptions, rollMode), [assumptions, rollMode]);

  // Custom scenario result
  const customResult = useMemo(() => {
    const size = gangSheetSizes[customSheetIndex];
    const overriddenAssumptions: Assumptions = {
      ...assumptions,
      wastePercentage: customWaste,
      desiredGrossMargin: customMargin,
    };
    return calculateScenario(
      customName,
      overriddenAssumptions,
      customOrders,
      { width: size.width, height: size.height },
      customRetailMix / 100,
    );
  }, [assumptions, customName, customOrders, customRetailMix, customSheetIndex, customWaste, customMargin, gangSheetSizes]);

  // Sensitivity data
  const sensitivityData = useMemo(
    () => calculateSensitivity(assumptions, rollMode),
    [assumptions, rollMode],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Scenario Analysis
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Compare business scenarios side-by-side. Test volume, pricing, and
            customer mix strategies.
          </p>
        </div>

        {/* Roll Width Toggle */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-foreground">Roll Width</label>
          <div className="flex gap-2">
            {(Object.keys(ROLL_WIDTH_OPTIONS) as RollWidthMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => switchRollMode(mode)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  rollMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {ROLL_WIDTH_OPTIONS[mode].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="presets">
          <TabsList className="mb-8 flex-wrap">
            <TabsTrigger value="presets">Preset Scenarios</TabsTrigger>
            <TabsTrigger value="custom">Custom Scenario</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 1: Preset Scenarios */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="presets">
            <div className="grid gap-6 md:grid-cols-2">
              {presets.map((preset) => (
                <ScenarioCard key={preset.name} scenario={preset} />
              ))}
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 2: Custom Scenario */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="custom">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Build Your Scenario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Scenario Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Scenario Name
                    </label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter scenario name"
                    />
                  </div>

                  {/* Monthly Orders */}
                  <Slider
                    label="Monthly Orders"
                    value={customOrders}
                    onChange={setCustomOrders}
                    min={50}
                    max={1000}
                    step={10}
                    formatValue={(v) => formatNumber(v)}
                  />

                  {/* Retail Mix */}
                  <Slider
                    label="Retail Mix %"
                    value={customRetailMix}
                    onChange={setCustomRetailMix}
                    min={0}
                    max={100}
                    step={5}
                    formatValue={(v) => `${v}%`}
                  />
                  <p className="-mt-4 text-xs text-muted-foreground">
                    Percentage of retail vs wholesale orders
                  </p>

                  {/* Sheet Size */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Sheet Size
                    </label>
                    <Select
                      value={String(customSheetIndex)}
                      onChange={(e) => setCustomSheetIndex(Number(e.target.value))}
                    >
                      {gangSheetSizes.map((size, idx) => (
                        <option key={size.name} value={String(idx)}>
                          {size.name} &mdash; {size.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Waste Override */}
                  <Slider
                    label="Waste %"
                    value={customWaste}
                    onChange={setCustomWaste}
                    min={1}
                    max={20}
                    step={0.5}
                    formatValue={(v) => `${v}%`}
                  />

                  {/* Margin Override */}
                  <Slider
                    label="Target Gross Margin"
                    value={customMargin}
                    onChange={setCustomMargin}
                    min={20}
                    max={80}
                    step={1}
                    formatValue={(v) => `${v}%`}
                  />
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle>{customResult.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(customResult.monthlyOrders)} orders/mo &middot;{" "}
                    {gangSheetSizes[customSheetIndex].label} sheets &middot;{" "}
                    {customRetailMix}% retail
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">
                  <MetricRow
                    label="Revenue"
                    value={formatCurrency(customResult.revenue)}
                  />
                  <MetricRow
                    label="COGS"
                    value={formatCurrency(customResult.cogs)}
                    color="red"
                  />
                  <MetricRow
                    label="Gross Profit"
                    value={formatCurrency(customResult.grossProfit)}
                    color={profitColor(customResult.grossProfit)}
                  />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Gross Margin</span>
                    <Badge
                      variant={customResult.grossMargin >= 40 ? "default" : "destructive"}
                    >
                      {formatPercent(customResult.grossMargin)}
                    </Badge>
                  </div>
                  <MetricRow
                    label="Operating Expenses"
                    value={formatCurrency(customResult.operatingExpenses)}
                    color="red"
                  />
                  <div className="my-2 border-t border-border" />
                  <MetricRow
                    label="Net Profit"
                    value={formatCurrency(customResult.netProfit)}
                    color={profitColor(customResult.netProfit)}
                  />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Net Margin</span>
                    <Badge
                      variant={customResult.netMargin >= 10 ? "default" : "destructive"}
                    >
                      {formatPercent(customResult.netMargin)}
                    </Badge>
                  </div>
                  <div className="my-2 border-t border-border" />
                  <MetricRow
                    label="Break-even Orders"
                    value={formatNumber(customResult.breakEvenOrders)}
                  />
                  <MetricRow
                    label="Profit per Order"
                    value={formatCurrency(customResult.profitPerOrder)}
                    color={profitColor(customResult.profitPerOrder)}
                  />
                  <MetricRow
                    label="Profit per Sq Ft"
                    value={formatCurrency(customResult.profitPerSqFt)}
                    color={profitColor(customResult.profitPerSqFt)}
                  />
                  <div className="my-2 border-t border-border" />
                  <div className="rounded-lg bg-muted p-4 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Monthly Forecast
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          customResult.monthlyProfitForecast >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(customResult.monthlyProfitForecast)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Annual Forecast
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          customResult.annualProfitForecast >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(customResult.annualProfitForecast)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 3: Sensitivity Analysis */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="sensitivity">
            <div className="space-y-8">
              {/* Tornado Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit Sensitivity (Tornado Chart)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How each variable impacts monthly net profit. Bars show deviation
                    from the base case.
                  </p>
                </CardHeader>
                <CardContent>
                  <TornadoChart points={sensitivityData} />
                </CardContent>
              </Card>

              {/* Sensitivity Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 pr-4 font-medium text-muted-foreground">
                            Variable
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            Low Value
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            Base Value
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            High Value
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            Low Profit
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            Base Profit
                          </th>
                          <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                            High Profit
                          </th>
                          <th className="pb-3 font-medium text-muted-foreground text-right">
                            Impact Range
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivityData.map((point) => {
                          const impactRange = Math.abs(
                            point.highProfit - point.lowProfit,
                          );
                          return (
                            <tr
                              key={point.variable}
                              className="border-b border-border/50"
                            >
                              <td className="py-3 pr-4 font-medium text-foreground">
                                {point.variable}
                              </td>
                              <td className="py-3 pr-4 text-right text-muted-foreground">
                                {formatNumber(point.lowValue, 2)}
                              </td>
                              <td className="py-3 pr-4 text-right text-foreground">
                                {formatNumber(point.baseValue, 2)}
                              </td>
                              <td className="py-3 pr-4 text-right text-muted-foreground">
                                {formatNumber(point.highValue, 2)}
                              </td>
                              <td
                                className={`py-3 pr-4 text-right font-medium ${
                                  point.lowProfit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(point.lowProfit)}
                              </td>
                              <td className="py-3 pr-4 text-right font-medium text-foreground">
                                {formatCurrency(point.baseProfit)}
                              </td>
                              <td
                                className={`py-3 pr-4 text-right font-medium ${
                                  point.highProfit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(point.highProfit)}
                              </td>
                              <td className="py-3 text-right font-medium text-foreground">
                                {formatCurrency(impactRange)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
