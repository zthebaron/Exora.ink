"use client";

import { useState, useMemo, useRef } from "react";
import { getDefaultAssumptions, calculatePricing } from "@/lib/pricing-engine";
import { GANG_SHEET_SIZES, VOLUME_DISCOUNT_TIERS, BRAND } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Printer, Download, Eye } from "lucide-react";

type PricingTier = "retail" | "wholesale" | "reseller";

const TIER_LABELS: Record<PricingTier, string> = {
  retail: "Retail Pricing",
  wholesale: "Wholesale Pricing",
  reseller: "Reseller Pricing",
};

export default function PriceSheetsPage() {
  const [activeTier, setActiveTier] = useState<PricingTier>("retail");
  const [showBulkDiscounts, setShowBulkDiscounts] = useState(true);
  const [showRushPricing, setShowRushPricing] = useState(true);
  const [showMinimumOrder, setShowMinimumOrder] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const assumptions = useMemo(() => getDefaultAssumptions(), []);

  const sheetPricing = useMemo(() => {
    return GANG_SHEET_SIZES.map((size) => {
      const result = calculatePricing(assumptions, size.width, size.height);
      const resellerPrice = Math.round(result.wholesalePrice * 0.85 * 100) / 100;
      return {
        ...size,
        retailPrice: result.retailPrice,
        wholesalePrice: result.wholesalePrice,
        resellerPrice,
        rushPrice: result.rushPrice,
      };
    });
  }, [assumptions]);

  const mediumPricing = sheetPricing.find((s) => s.name === "Medium");

  function getPrice(
    sheet: (typeof sheetPricing)[number],
    tier: PricingTier
  ): number {
    switch (tier) {
      case "retail":
        return sheet.retailPrice;
      case "wholesale":
        return sheet.wholesalePrice;
      case "reseller":
        return sheet.resellerPrice;
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Price Sheet Generator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create customer-ready price sheets for retail and wholesale.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Controls - hidden when printing */}
        <div className="no-print">
          <Card>
            <CardHeader>
              <CardTitle>Configure Price Sheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tier Tabs */}
              <Tabs defaultValue="retail">
                <TabsList>
                  <TabsTrigger
                    value="retail"
                    onClick={() => setActiveTier("retail")}
                  >
                    Retail
                  </TabsTrigger>
                  <TabsTrigger
                    value="wholesale"
                    onClick={() => setActiveTier("wholesale")}
                  >
                    Wholesale
                  </TabsTrigger>
                  <TabsTrigger
                    value="reseller"
                    onClick={() => setActiveTier("reseller")}
                  >
                    Reseller
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Toggle Options */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBulkDiscounts}
                    onChange={(e) => setShowBulkDiscounts(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                  Show Bulk Discounts
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRushPricing}
                    onChange={(e) => setShowRushPricing(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                  Show Rush Pricing
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMinimumOrder}
                    onChange={(e) => setShowMinimumOrder(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                  Show Minimum Order
                </label>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Custom Message{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional footer message)
                  </span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personalized message for this price sheet..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save as PDF
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* PRINTABLE PRICE SHEET                                            */}
        {/* ================================================================ */}
        <div
          ref={previewRef}
          className="bg-white text-slate-900 rounded-xl shadow-lg border border-border overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          {/* Sheet Header */}
          <div className="bg-gradient-to-r from-violet-700 to-violet-900 px-10 py-10 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-4xl font-bold tracking-tight">
                  {BRAND.name}
                </h2>
                <p className="mt-1 text-violet-200 text-lg">
                  {BRAND.tagline}
                </p>
              </div>
              <Badge className="bg-white/20 text-white border border-white/30 text-sm px-4 py-1.5">
                {TIER_LABELS[activeTier]}
              </Badge>
            </div>
          </div>

          <div className="px-10 py-8 space-y-10">
            {/* ---- Gang Sheet Pricing Table ---- */}
            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Gang Sheet Pricing
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-3 text-left font-semibold text-slate-700">
                        Size
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-700">
                        Dimensions
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-slate-700">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetPricing.map((sheet, i) => (
                      <tr
                        key={sheet.name}
                        className={
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        }
                      >
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {sheet.name}
                          {sheet.name === "Medium" && (
                            <span className="ml-2 inline-block rounded bg-violet-100 text-violet-700 px-2 py-0.5 text-xs font-medium">
                              Most Popular
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {sheet.label}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(getPrice(sheet, activeTier))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---- Volume Discounts ---- */}
            {showBulkDiscounts && (
              <section>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Volume Discounts
                </h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Quantity
                        </th>
                        <th className="px-5 py-3 text-center font-semibold text-slate-700">
                          Discount
                        </th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-700">
                          Medium Sheet Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {VOLUME_DISCOUNT_TIERS.map((tier, i) => {
                        const basePrice = mediumPricing
                          ? getPrice(mediumPricing, activeTier)
                          : 0;
                        const discountedPrice =
                          basePrice * (1 - tier.discount / 100);
                        return (
                          <tr
                            key={tier.label}
                            className={
                              i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                            }
                          >
                            <td className="px-5 py-3 font-medium text-slate-900">
                              {tier.label}
                            </td>
                            <td className="px-5 py-3 text-center text-slate-600">
                              {tier.discount === 0 ? (
                                <span className="text-slate-400">--</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">
                                  {formatPercent(tier.discount)}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(discountedPrice)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ---- Rush Service Pricing ---- */}
            {showRushPricing && (
              <section>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Rush Service Pricing
                </h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Service Level
                        </th>
                        <th className="px-5 py-3 text-center font-semibold text-slate-700">
                          Turnaround
                        </th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-700">
                          Surcharge
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          Standard
                        </td>
                        <td className="px-5 py-3 text-center text-slate-600">
                          3-5 business days
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          --
                        </td>
                      </tr>
                      <tr className="bg-slate-50/60">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          Rush
                        </td>
                        <td className="px-5 py-3 text-center text-slate-600">
                          1-2 business days
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-amber-600">
                          +50%
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          Same Day
                        </td>
                        <td className="px-5 py-3 text-center text-slate-600">
                          Order by 10am
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-red-600">
                          +100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ---- Minimum Order Policy ---- */}
            {showMinimumOrder && (
              <section>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Minimum Order Policy
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">
                        Minimum order fee:
                      </span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {formatCurrency(assumptions.minimumOrderFee)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">
                        Setup fee:
                      </span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {formatCurrency(assumptions.setupFee)} per design
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ---- Additional Info ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Artwork Requirements */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Artwork Requirements
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    Vector files preferred (AI, EPS, SVG, PDF)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    300 DPI minimum for raster images
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    CMYK color space
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    White layer included at no extra cost
                  </li>
                </ul>
              </section>

              {/* How to Order */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  How to Order
                </h3>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                      1
                    </span>
                    Upload your artwork
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                      2
                    </span>
                    Select sheet size and quantity
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                      3
                    </span>
                    Approve proof
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                      4
                    </span>
                    We print and ship
                  </li>
                </ol>
              </section>

              {/* Why Exora.ink */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Why {BRAND.name}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Premium DTF films and inks
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Color-matched accuracy
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Fast turnaround
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Quality guaranteed
                  </li>
                </ul>
              </section>

              {/* Shipping */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Shipping
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    Standard shipping calculated at checkout
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    Free shipping on orders over $150
                  </li>
                </ul>
              </section>
            </div>

            {/* ---- Custom Message ---- */}
            {customMessage.trim() && (
              <section className="rounded-lg border border-violet-200 bg-violet-50 px-6 py-5">
                <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">
                  {customMessage}
                </p>
              </section>
            )}
          </div>

          {/* Sheet Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-10 py-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 text-xs text-slate-500">
              <div className="space-y-1">
                <p className="font-medium text-slate-700">
                  {BRAND.name}
                </p>
                <p>
                  {BRAND.contact.email} &middot; {BRAND.contact.phone}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p>
                  Created by {BRAND.contact.creator},{" "}
                  {BRAND.contact.title}, {BRAND.contact.phone}{" "}
                  {BRAND.contact.email}
                </p>
                <p>
                  {BRAND.contact.company} {BRAND.contact.division}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
