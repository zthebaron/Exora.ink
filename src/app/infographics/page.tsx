"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/constants";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Shield,
  Zap,
  Package,
  Truck,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Printer,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Internal Guide — Tab 1                                            */
/* ------------------------------------------------------------------ */

function ProfitabilityFlow() {
  const steps = [
    {
      icon: Package,
      title: "Materials",
      subtitle: "Input Costs",
      details: ["Film & substrate", "Ink & powder", "Packaging supplies"],
      color: "bg-teal-500",
    },
    {
      icon: Zap,
      title: "Production",
      subtitle: "Conversion Costs",
      details: ["Labor & time", "Equipment usage", "Waste & rework"],
      color: "bg-sky-500",
    },
    {
      icon: DollarSign,
      title: "Pricing",
      subtitle: "Revenue Strategy",
      details: ["Retail vs wholesale", "Volume tiers", "Rush premiums"],
      color: "bg-amber-500",
    },
    {
      icon: TrendingUp,
      title: "Profit",
      subtitle: "Margin Outcome",
      details: ["Target: 40-60%", "Break-even analysis", "Reinvestment"],
      color: "bg-emerald-500",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="h-5 w-5 text-teal-500" />
          How DTF Profitability Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`${step.color} mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg`}
                >
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-foreground text-base font-bold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-2 text-xs">
                  {step.subtitle}
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  {step.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
              {i < steps.length - 1 && (
                <div className="text-muted-foreground hidden items-center self-center md:flex">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CostDrivers() {
  const drivers = [
    {
      icon: Layers,
      label: "Film & Substrate",
      range: "15-20% of COGS",
      desc: "Base transfer film, specialty substrates, and release liners.",
      color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    },
    {
      icon: Target,
      label: "Ink",
      range: "20-30% of COGS",
      desc: "CMYK + white ink consumption per square inch of coverage.",
      color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    },
    {
      icon: Package,
      label: "Powder / Adhesive",
      range: "5-10% of COGS",
      desc: "Hot-melt powder application and adhesive materials.",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      icon: BarChart3,
      label: "Labor",
      range: "25-35% of COGS",
      desc: "Design prep, printing, curing, weeding, and QC time.",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    {
      icon: Zap,
      label: "Equipment",
      range: "10-15% of COGS",
      desc: "Printer depreciation, maintenance, and consumable parts.",
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    },
    {
      icon: DollarSign,
      label: "Overhead",
      range: "10-15% of COGS",
      desc: "Rent, utilities, software, insurance, and admin costs.",
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="h-5 w-5 text-amber-500" />
          Main Cost Drivers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d) => (
            <div
              key={d.label}
              className={`${d.color} flex items-start gap-3 rounded-xl p-4`}
            >
              <d.icon className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-bold">{d.label}</p>
                <Badge variant="outline" className="my-1 text-[10px]">
                  {d.range}
                </Badge>
                <p className="text-xs opacity-80">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarginImpact() {
  const hurts = [
    "High waste rates (>8%)",
    "Excessive discounting (>20%)",
    "Low machine utilization (<60%)",
    "Underpricing wholesale",
    "High remake / refund rates",
    "Inconsistent print quality",
  ];

  const helps = [
    "Volume pricing leverage",
    "Waste reduction below 5%",
    "Rush order premiums",
    "Repeat customer programs",
    "Efficient gang sheet nesting",
    "Optimized production scheduling",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Hurts */}
      <Card className="border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
            <TrendingDown className="h-5 w-5" />
            What Hurts Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {hurts.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Helps */}
      <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
            What Improves Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {helps.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-300"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductMixes() {
  const strategies = [
    {
      title: "High-Volume Wholesale",
      mix: "80% wholesale / 20% retail",
      margin: "25-35%",
      badge: "Steady Revenue",
      badgeColor: "bg-sky-500 text-white",
      traits: [
        "Lower margin per order",
        "Predictable recurring revenue",
        "Higher machine utilization",
        "Larger order sizes",
      ],
    },
    {
      title: "Balanced Mix",
      mix: "60% retail / 40% wholesale",
      margin: "40-50%",
      badge: "Best Overall",
      badgeColor: "bg-emerald-500 text-white",
      traits: [
        "Optimal margin blend",
        "Revenue diversification",
        "Flexible capacity planning",
        "Strongest cash flow",
      ],
    },
    {
      title: "Premium Retail",
      mix: "90% retail / 10% wholesale",
      margin: "50-65%",
      badge: "Highest Margin",
      badgeColor: "bg-teal-500 text-white",
      traits: [
        "Highest per-order profit",
        "More marketing spend needed",
        "Variable demand patterns",
        "Premium brand positioning",
      ],
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Layers className="h-5 w-5 text-sky-500" />
          Best Product Mixes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {strategies.map((s) => (
            <div
              key={s.title}
              className="bg-muted/50 rounded-xl border border-border p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-foreground text-sm font-bold">{s.title}</h4>
                <Badge className={s.badgeColor}>{s.badge}</Badge>
              </div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                {s.mix}
              </p>
              <p className="mb-3 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {s.margin} margin
              </p>
              <ul className="space-y-1">
                {s.traits.map((t) => (
                  <li
                    key={t}
                    className="text-muted-foreground flex items-center gap-1.5 text-xs"
                  >
                    <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakEven() {
  const tiers = [
    {
      level: "Low Volume",
      sheets: "50-100 / mo",
      breakeven: "~$2,500 / mo revenue",
      note: "Side business or startup phase",
    },
    {
      level: "Medium Volume",
      sheets: "250-500 / mo",
      breakeven: "~$8,000 / mo revenue",
      note: "Full-time single-operator shop",
    },
    {
      level: "High Volume",
      sheets: "1,000+ / mo",
      breakeven: "~$20,000 / mo revenue",
      note: "Multi-printer production facility",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-5 w-5 text-rose-500" />
          Break-even Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.level}
              className="bg-muted/50 rounded-xl border border-border p-5 text-center"
            >
              <p className="text-foreground text-sm font-bold">{t.level}</p>
              <p className="mt-1 text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                {t.sheets}
              </p>
              <p className="text-muted-foreground mt-1 text-xs font-medium">
                {t.breakeven}
              </p>
              <p className="text-muted-foreground mt-2 text-[11px] italic">
                {t.note}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CapacityEfficiency() {
  const metrics = [
    { label: "Target Utilization", value: "75-85%", desc: "Optimal machine uptime for sustained quality and throughput." },
    { label: "Peak Capacity", value: "90%+", desc: "Short bursts only; increases wear and defect rates." },
    { label: "Minimum Viable", value: "60%", desc: "Below this, fixed costs erode margins significantly." },
    { label: "Ideal Batch Size", value: "10-25 sheets", desc: "Balances setup time, ink waste, and throughput." },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="h-5 w-5 text-amber-500" />
          Capacity & Efficiency Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-muted/50 flex items-start gap-4 rounded-xl border border-border p-4"
            >
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 min-w-[80px]">
                {m.value}
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">{m.label}</p>
                <p className="text-muted-foreground text-xs">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Customer Guide — Tab 2                                            */
/* ------------------------------------------------------------------ */

function GangSheetSavings() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Layers className="h-5 w-5 text-teal-500" />
          Why Gang Sheets Save Money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Explanation */}
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              A gang sheet combines multiple designs onto a single sheet of DTF
              film. This means you pay for one sheet instead of several,
              dramatically lowering the cost per print.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    Maximize film usage
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Fill every inch of the sheet with designs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    One setup, many prints
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Setup cost is incurred once regardless of design count.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    Minimal waste
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Efficient nesting reduces unused film and ink.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual comparison */}
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/30">
              <p className="mb-2 text-xs font-bold text-red-700 dark:text-red-400">
                Individual Prints
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-100 text-xs font-bold text-red-500 dark:border-red-700 dark:bg-red-900/30"
                  >
                    #{n}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                4 sheets = 4x the cost
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Gang Sheet
              </p>
              <div className="grid grid-cols-4 gap-1 rounded-lg border-2 border-emerald-300 bg-emerald-100 p-2 dark:border-emerald-700 dark:bg-emerald-900/30">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="flex h-12 items-center justify-center rounded bg-emerald-200 text-xs font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300"
                  >
                    #{n}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                1 sheet = up to 70% savings
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VolumePricingVisual() {
  const tiers = [
    { qty: "1-9", discount: "0%", savings: "$0", fill: "w-[10%]" },
    { qty: "10-24", discount: "5%", savings: "~$1/sheet", fill: "w-[25%]" },
    { qty: "25-49", discount: "10%", savings: "~$2/sheet", fill: "w-[40%]" },
    { qty: "50-99", discount: "15%", savings: "~$3/sheet", fill: "w-[60%]" },
    { qty: "100-249", discount: "20%", savings: "~$4/sheet", fill: "w-[80%]" },
    { qty: "250+", discount: "25%", savings: "~$5/sheet", fill: "w-full" },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          How Volume Pricing Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-5 text-sm">
          The more you order, the more you save. Volume discounts are applied
          automatically at checkout.
        </p>
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.qty} className="flex items-center gap-3">
              <span className="text-foreground w-20 text-right text-xs font-bold">
                {t.qty}
              </span>
              <div className="bg-muted relative h-7 flex-1 overflow-hidden rounded-full">
                <div
                  className={`${t.fill} h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500`}
                />
              </div>
              <span className="w-10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {t.discount}
              </span>
              <span className="text-muted-foreground w-20 text-xs">
                {t.savings}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LargerOrderEconomics() {
  const points = [
    {
      icon: DollarSign,
      title: "Fixed Costs Spread Out",
      desc: "Setup, file prep, and machine calibration cost the same whether you order 5 or 500 sheets. More prints = lower cost each.",
    },
    {
      icon: Layers,
      title: "Materials Used Efficiently",
      desc: "Larger runs let us optimize ink coverage and film utilization, reducing per-unit material costs.",
    },
    {
      icon: Target,
      title: "Less Waste Per Print",
      desc: "Startup waste (test prints, calibration sheets) is a fixed amount. With larger orders, it becomes a tiny fraction of total output.",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="h-5 w-5 text-sky-500" />
          Why Larger Orders Reduce Cost
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="bg-muted/50 rounded-xl border border-border p-5 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                <p.icon className="h-6 w-6" />
              </div>
              <p className="text-foreground mb-1 text-sm font-bold">
                {p.title}
              </p>
              <p className="text-muted-foreground text-xs">{p.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TurnaroundOptions() {
  const tiers = [
    {
      icon: Truck,
      title: "Standard",
      time: "3-5 Business Days",
      premium: "Base Price",
      color: "bg-sky-500",
      desc: "Our default turnaround for most orders.",
    },
    {
      icon: Zap,
      title: "Rush",
      time: "1-2 Business Days",
      premium: "+50%",
      color: "bg-amber-500",
      desc: "Need it fast? Rush production gets you priority.",
    },
    {
      icon: AlertTriangle,
      title: "Same Day",
      time: "Order by 10:00 AM",
      premium: "+100%",
      color: "bg-rose-500",
      desc: "Emergency orders shipped or ready same day.",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Truck className="h-5 w-5 text-amber-500" />
          Turnaround Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.title}
              className="bg-muted/50 relative overflow-hidden rounded-xl border border-border p-5 text-center"
            >
              <div className={`${t.color} absolute left-0 top-0 h-1 w-full`} />
              <div
                className={`${t.color} mx-auto mb-3 mt-2 flex h-12 w-12 items-center justify-center rounded-xl text-white`}
              >
                <t.icon className="h-6 w-6" />
              </div>
              <p className="text-foreground text-base font-bold">{t.title}</p>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                {t.time}
              </p>
              <Badge className={`${t.color} mt-2 text-white`}>
                {t.premium}
              </Badge>
              <p className="text-muted-foreground mt-2 text-xs">{t.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WholesaleBenefits() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Up to 30% Off Retail",
      desc: "Wholesale accounts enjoy significant per-sheet savings.",
    },
    {
      icon: TrendingUp,
      title: "Volume Discounts Stack",
      desc: "Wholesale pricing plus volume tiers for maximum savings.",
    },
    {
      icon: Shield,
      title: "Dedicated Account Support",
      desc: "A personal account rep for orders, questions, and reorders.",
    },
    {
      icon: Zap,
      title: "Priority Production",
      desc: "Wholesale orders get priority queue positioning.",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-5 w-5 text-teal-500" />
          Wholesale Benefits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          For resellers, brands, and businesses ordering regularly.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-xl bg-teal-50/60 p-4 dark:bg-teal-950/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">{b.title}</p>
                <p className="text-muted-foreground text-xs">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WhyExora() {
  const points = [
    { icon: Shield, label: "Premium DTF films and inks" },
    { icon: Target, label: "Color-matched accuracy" },
    { icon: Zap, label: "Fast turnaround guaranteed" },
    { icon: DollarSign, label: "Competitive pricing" },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-emerald-500" />
          Why {BRAND.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-4 dark:bg-emerald-950/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                <p.icon className="h-5 w-5" />
              </div>
              <p className="text-foreground text-sm font-semibold">{p.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QualityCommitment() {
  const specs = [
    { label: "300+ DPI Output", desc: "Sharp, detailed prints every time." },
    { label: "Wash-Tested Durability", desc: "Prints that last through 50+ wash cycles." },
    { label: "Vibrant Color Reproduction", desc: "True-to-design color matching on every order." },
    { label: "Satisfaction Guarantee", desc: "We stand behind every print we produce." },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle className="h-5 w-5 text-teal-500" />
          Quality Commitment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specs.map((s) => (
            <div
              key={s.label}
              className="bg-muted/50 flex items-start gap-3 rounded-xl border border-border p-4"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />
              <div>
                <p className="text-foreground text-sm font-bold">{s.label}</p>
                <p className="text-muted-foreground text-xs">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer Credit                                                     */
/* ------------------------------------------------------------------ */

function FooterCredit() {
  return (
    <div className="border-t border-border pt-6 text-center">
      <p className="text-muted-foreground text-xs">
        Created by {BRAND.contact.creator}, {BRAND.contact.title},{" "}
        {BRAND.contact.phone}{" "}
        <a
          href={`mailto:${BRAND.contact.email}`}
          className="text-primary underline"
        >
          {BRAND.contact.email}
        </a>{" "}
        {BRAND.contact.company} {BRAND.contact.division}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function InfographicsPage() {
  const [activeTab, setActiveTab] = useState("internal");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
            Infographics & Guides
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Visual guides to DTF profitability for your team and your customers.
          </p>
        </div>

        {/* Controls (hidden on print) */}
        <div className="no-print mb-6 flex items-center justify-end">
          <button
            onClick={handlePrint}
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Print Guide
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="no-print mb-8">
            <TabsTrigger value="internal">Internal Guide</TabsTrigger>
            <TabsTrigger value="customer">Customer Guide</TabsTrigger>
          </TabsList>

          {/* ---- Internal Guide ---- */}
          <TabsContent value="internal">
            <div className="space-y-8">
              <ProfitabilityFlow />
              <CostDrivers />
              <MarginImpact />
              <ProductMixes />
              <BreakEven />
              <CapacityEfficiency />
              <FooterCredit />
            </div>
          </TabsContent>

          {/* ---- Customer Guide ---- */}
          <TabsContent value="customer">
            <div className="space-y-8">
              <GangSheetSavings />
              <VolumePricingVisual />
              <LargerOrderEconomics />
              <TurnaroundOptions />
              <WholesaleBenefits />
              <WhyExora />
              <QualityCommitment />
              <FooterCredit />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
