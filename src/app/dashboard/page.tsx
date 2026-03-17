"use client";

import { useState, useMemo } from "react";
import {
  getDefaultAssumptions,
  getScenarioPresets,
  calculatePricing,
  calculateSensitivity,
  calculateCostBreakdown,
} from "@/lib/pricing-engine";
import { GANG_SHEET_SIZES } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from "recharts";

const CHART_COLORS = {
  chart1: "#6D28D9",
  chart2: "#0EA5E9",
  chart3: "#10B981",
  chart4: "#F59E0B",
  chart5: "#EF4444",
};

const PIE_COLORS = [
  CHART_COLORS.chart1,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
];

export default function DashboardPage() {
  const [monthlyVolume, setMonthlyVolume] = useState(250);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [wasteRate, setWasteRate] = useState(5);
  const [retailMix, setRetailMix] = useState(70);

  const assumptions = useMemo(() => {
    const base = getDefaultAssumptions();
    return {
      ...base,
      wastePercentage: wasteRate,
    };
  }, [wasteRate]);

  const scenarioPresets = useMemo(
    () => getScenarioPresets(assumptions).slice(0, 6),
    [assumptions]
  );

  const sensitivity = useMemo(
    () => calculateSensitivity(assumptions),
    [assumptions]
  );

  // Medium sheet size for base calculations
  const mediumSheet = GANG_SHEET_SIZES[1]; // 22x24
  const basePricing = useMemo(
    () => calculatePricing(assumptions, mediumSheet.width, mediumSheet.height),
    [assumptions, mediumSheet.width, mediumSheet.height]
  );

  // Adjusted pricing with multiplier
  const adjustedRetailPrice = basePricing.retailPrice * priceMultiplier;
  const adjustedWholesalePrice = basePricing.wholesalePrice * priceMultiplier;
  const retailFraction = retailMix / 100;
  const avgOrderValue =
    adjustedRetailPrice * retailFraction +
    adjustedWholesalePrice * (1 - retailFraction);

  // KPI calculations
  const totalMonthlyRevenue = monthlyVolume * avgOrderValue;
  const totalMonthlyCOGS =
    monthlyVolume * basePricing.costBreakdown.totalCostPerSheet;
  const grossProfit = totalMonthlyRevenue - totalMonthlyCOGS;
  const grossMarginPct =
    totalMonthlyRevenue > 0 ? (grossProfit / totalMonthlyRevenue) * 100 : 0;
  const operatingExpenses =
    assumptions.electricityCostPerMonth +
    assumptions.machineLeasePerMonth +
    assumptions.maintenanceReservePerMonth +
    assumptions.softwareCostPerMonth +
    assumptions.rentOverheadPerMonth;
  const netProfit = grossProfit - operatingExpenses;
  const contributionPerOrder =
    avgOrderValue - basePricing.costBreakdown.totalCostPerSheet;
  const breakEvenOrders =
    contributionPerOrder > 0
      ? Math.ceil(operatingExpenses / contributionPerOrder)
      : 0;

  // Chart 1: Revenue vs Cost vs Profit
  const scenarioChartData = useMemo(
    () =>
      scenarioPresets.map((s) => ({
        name: s.name,
        Revenue: s.revenue,
        COGS: s.cogs,
        "Net Profit": s.netProfit,
      })),
    [scenarioPresets]
  );

  // Chart 2: Gross Margin by Product Size
  const marginBySize = useMemo(
    () =>
      GANG_SHEET_SIZES.map((size) => {
        const pricing = calculatePricing(assumptions, size.width, size.height);
        const adjustedRetail = pricing.retailPrice * priceMultiplier;
        const cost = pricing.costBreakdown.totalCostPerSheet;
        const margin =
          adjustedRetail > 0
            ? ((adjustedRetail - cost) / adjustedRetail) * 100
            : 0;
        return {
          name: size.name,
          "Gross Margin": Math.round(margin * 10) / 10,
        };
      }),
    [assumptions, priceMultiplier]
  );

  // Chart 3: Cost Breakdown (Pie)
  const costBreakdownData = useMemo(() => {
    const cb = calculateCostBreakdown(
      assumptions,
      mediumSheet.width,
      mediumSheet.height
    );
    return [
      { name: "Material", value: cb.materialCost },
      { name: "Ink", value: cb.inkCost },
      { name: "Powder", value: cb.powderCost },
      { name: "Labor", value: cb.laborCost },
      {
        name: "Overhead",
        value: cb.equipmentBurden + cb.overheadAllocation,
      },
    ].filter((d) => d.value > 0);
  }, [assumptions, mediumSheet.width, mediumSheet.height]);

  // Chart 4: Monthly Profit Forecast (12 months, 5% MoM growth)
  const profitForecast = useMemo(() => {
    const data = [];
    let currentVolume = monthlyVolume;
    for (let month = 1; month <= 12; month++) {
      const rev = currentVolume * avgOrderValue;
      const costs =
        currentVolume * basePricing.costBreakdown.totalCostPerSheet +
        operatingExpenses;
      const profit = rev - costs;
      data.push({
        month: `M${month}`,
        Profit: Math.round(profit),
        Revenue: Math.round(rev),
      });
      currentVolume = Math.round(currentVolume * 1.05);
    }
    return data;
  }, [monthlyVolume, avgOrderValue, basePricing, operatingExpenses]);

  // Chart 5: Break-even Analysis
  const breakEvenData = useMemo(() => {
    const data = [];
    let cumRevenue = 0;
    let cumCosts = 0;
    for (let month = 1; month <= 12; month++) {
      const currentVolume = Math.round(monthlyVolume * Math.pow(1.05, month - 1));
      cumRevenue += currentVolume * avgOrderValue;
      cumCosts +=
        currentVolume * basePricing.costBreakdown.totalCostPerSheet +
        operatingExpenses;
      data.push({
        month: `M${month}`,
        "Cumulative Revenue": Math.round(cumRevenue),
        "Cumulative Costs": Math.round(cumCosts),
      });
    }
    return data;
  }, [monthlyVolume, avgOrderValue, basePricing, operatingExpenses]);

  // Chart 6: Price vs Margin Curve
  const priceMarginCurve = useMemo(() => {
    const cost = basePricing.costBreakdown.totalCostPerSheet;
    const basePrice = basePricing.retailPrice;
    const points = [];
    for (let i = 0; i < 10; i++) {
      const multiplier = 0.6 + i * 0.1;
      const price = basePrice * multiplier;
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      points.push({
        Price: Math.round(price * 100) / 100,
        "Gross Margin": Math.round(margin * 10) / 10,
      });
    }
    return points;
  }, [basePricing]);

  // Chart 7: Volume Discount Impact
  const volumeDiscountData = useMemo(() => {
    const tiers = [
      { label: "1-9", qty: 5, discount: 0 },
      { label: "10-24", qty: 17, discount: 5 },
      { label: "25-49", qty: 37, discount: 10 },
      { label: "50-99", qty: 75, discount: 15 },
      { label: "100-249", qty: 175, discount: 20 },
      { label: "250+", qty: 300, discount: 25 },
    ];
    return tiers.map((tier) => {
      const discountedPrice = adjustedRetailPrice * (1 - tier.discount / 100);
      const revenue = tier.qty * discountedPrice;
      const cost = tier.qty * basePricing.costBreakdown.totalCostPerSheet;
      return {
        name: tier.label,
        Revenue: Math.round(revenue),
        Profit: Math.round(revenue - cost),
      };
    });
  }, [adjustedRetailPrice, basePricing]);

  // Chart 8: Sensitivity Tornado
  const tornadoData = useMemo(
    () =>
      sensitivity.map((pt) => ({
        variable: pt.variable,
        Low: Math.round(pt.lowProfit - pt.baseProfit),
        High: Math.round(pt.highProfit - pt.baseProfit),
      })),
    [sensitivity]
  );

  const dollarFormatter = (v: number) => `$${v.toLocaleString()}`;
  const percentFormatter = (v: number) => `${v}%`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Executive Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Real-time financial intelligence for your DTF printing operation.
          </p>
        </div>

        {/* KPI Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalMonthlyRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gross Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPercent(grossMarginPct)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {formatCurrency(netProfit)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Break-even Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(breakEvenOrders)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scenario Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Slider
                label="Monthly Volume"
                value={monthlyVolume}
                onChange={setMonthlyVolume}
                min={50}
                max={1000}
                step={10}
                formatValue={(v) => `${v} sheets`}
              />
              <Slider
                label="Selling Price Multiplier"
                value={priceMultiplier}
                onChange={setPriceMultiplier}
                min={0.8}
                max={1.5}
                step={0.05}
                formatValue={(v) => `${v.toFixed(2)}x`}
              />
              <Slider
                label="Waste Rate"
                value={wasteRate}
                onChange={setWasteRate}
                min={1}
                max={15}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
              <Slider
                label="Retail / Wholesale Mix"
                value={retailMix}
                onChange={setRetailMix}
                min={0}
                max={100}
                step={5}
                formatValue={(v) => `${v}% retail`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Revenue vs Cost vs Profit */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost vs Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={dollarFormatter} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill={CHART_COLORS.chart1} />
                  <Bar dataKey="COGS" fill={CHART_COLORS.chart5} />
                  <Bar dataKey="Net Profit" fill={CHART_COLORS.chart3} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Gross Margin by Product Size */}
          <Card>
            <CardHeader>
              <CardTitle>Gross Margin by Product Size</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marginBySize}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={percentFormatter} />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />
                  <Bar dataKey="Gross Margin" fill={CHART_COLORS.chart1} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. Cost Breakdown (Pie) */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown (Medium Sheet)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name ?? ""} ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {costBreakdownData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 4. Monthly Profit Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Forecast (12-Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={profitForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={dollarFormatter} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Profit"
                    stroke={CHART_COLORS.chart3}
                    fill={CHART_COLORS.chart3}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 5. Break-even Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Break-even Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={breakEvenData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={dollarFormatter} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Cumulative Revenue"
                    stroke={CHART_COLORS.chart2}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cumulative Costs"
                    stroke={CHART_COLORS.chart5}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 6. Price vs Margin Curve */}
          <Card>
            <CardHeader>
              <CardTitle>Price vs Margin Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceMarginCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="Price"
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis tickFormatter={percentFormatter} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "Price" ? formatCurrency(Number(value)) : `${value}%`
                    }
                    labelFormatter={(label) => `Price: $${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="Gross Margin"
                    stroke={CHART_COLORS.chart1}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 7. Volume Discount Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Discount Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeDiscountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={dollarFormatter} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill={CHART_COLORS.chart2} />
                  <Bar dataKey="Profit" fill={CHART_COLORS.chart3} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 8. Sensitivity Tornado Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis (Tornado)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tornadoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={dollarFormatter} />
                  <YAxis
                    dataKey="variable"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Low" fill={CHART_COLORS.chart5} />
                  <Bar dataKey="High" fill={CHART_COLORS.chart3} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
