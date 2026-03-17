"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDefaultAssumptions } from "@/lib/pricing-engine";
import { GANG_SHEET_SIZES, VOLUME_DISCOUNT_TIERS, BRAND } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Assumptions } from "@/types";
import {
  Save,
  RotateCcw,
  Settings,
  Package,
  Tag,
  Percent,
  Building2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Assumption field definitions grouped by category
// ---------------------------------------------------------------------------

interface FieldDef {
  key: keyof Assumptions;
  label: string;
  unit: string;
}

const ASSUMPTION_CATEGORIES: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Material Costs",
    fields: [
      { key: "filmCostPerRoll", label: "Film Cost per Roll", unit: "$" },
      { key: "rollWidth", label: "Roll Width", unit: "in" },
      { key: "rollLength", label: "Roll Length", unit: "ft" },
      { key: "inkCostPerMl", label: "Ink Cost per mL", unit: "$" },
      { key: "avgInkUsagePerSqFt", label: "Avg Ink Usage per sq ft", unit: "mL" },
      { key: "powderCostPerLb", label: "Powder Cost per lb", unit: "$" },
      { key: "avgPowderUsagePerSqFt", label: "Avg Powder Usage per sq ft", unit: "g" },
    ],
  },
  {
    title: "Labor & Production",
    fields: [
      { key: "laborCostPerHour", label: "Labor Cost per Hour", unit: "$/hr" },
      { key: "avgProductionSpeedPerHour", label: "Avg Production Speed", unit: "sheets/hr" },
    ],
  },
  {
    title: "Overhead & Fixed Costs",
    fields: [
      { key: "electricityCostPerMonth", label: "Electricity Cost / Month", unit: "$/mo" },
      { key: "machineLeasePerMonth", label: "Machine Lease / Month", unit: "$/mo" },
      { key: "maintenanceReservePerMonth", label: "Maintenance Reserve / Month", unit: "$/mo" },
      { key: "softwareCostPerMonth", label: "Software Cost / Month", unit: "$/mo" },
      { key: "rentOverheadPerMonth", label: "Rent & Overhead / Month", unit: "$/mo" },
    ],
  },
  {
    title: "Quality & Waste",
    fields: [
      { key: "wastePercentage", label: "Waste Percentage", unit: "%" },
      { key: "failedPrintPercentage", label: "Failed Print Percentage", unit: "%" },
    ],
  },
  {
    title: "Margins & Fees",
    fields: [
      { key: "desiredGrossMargin", label: "Desired Gross Margin", unit: "%" },
      { key: "desiredNetMargin", label: "Desired Net Margin", unit: "%" },
      { key: "minimumOrderFee", label: "Minimum Order Fee", unit: "$" },
      { key: "setupFee", label: "Setup Fee", unit: "$" },
      { key: "rushFeePercentage", label: "Rush Fee Percentage", unit: "%" },
      { key: "refundRemakeReservePercentage", label: "Refund / Remake Reserve", unit: "%" },
      { key: "packagingCostPerOrder", label: "Packaging Cost per Order", unit: "$" },
      { key: "shippingMaterialCostPerOrder", label: "Shipping Material Cost per Order", unit: "$" },
    ],
  },
  {
    title: "Customer Metrics",
    fields: [
      { key: "customerAcquisitionCost", label: "Customer Acquisition Cost", unit: "$" },
      { key: "avgRepeatPurchaseFrequency", label: "Avg Repeat Purchase Frequency", unit: "x/yr" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Assumptions glossary
// ---------------------------------------------------------------------------

const ASSUMPTIONS_GLOSSARY: Record<string, string> = {
  filmCostPerRoll: "Cost of one roll of DTF transfer film.",
  rollWidth: "Width of the film roll in inches.",
  rollLength: "Length of the film roll in feet.",
  inkCostPerMl: "Cost of DTF ink per milliliter.",
  avgInkUsagePerSqFt: "Average ink consumed per square foot of printed area.",
  powderCostPerLb: "Cost of adhesive powder per pound.",
  avgPowderUsagePerSqFt: "Average powder consumed per square foot of printed area.",
  laborCostPerHour: "Fully loaded hourly labor cost for production staff.",
  avgProductionSpeedPerHour: "Number of gang sheets produced per hour on average.",
  electricityCostPerMonth: "Monthly electricity bill attributable to production.",
  machineLeasePerMonth: "Monthly lease or depreciation cost for printing equipment.",
  maintenanceReservePerMonth: "Monthly reserve for equipment maintenance and repairs.",
  softwareCostPerMonth: "Monthly cost of RIP software, design tools, and SaaS subscriptions.",
  rentOverheadPerMonth: "Monthly rent and general overhead costs.",
  wastePercentage: "Percentage of material lost to waste during production.",
  failedPrintPercentage: "Percentage of prints that fail quality control.",
  desiredGrossMargin: "Target gross margin as a percentage of revenue.",
  desiredNetMargin: "Target net margin after all expenses.",
  minimumOrderFee: "Minimum fee charged for small orders.",
  setupFee: "One-time setup fee per order for artwork preparation.",
  rushFeePercentage: "Percentage surcharge applied to rush orders.",
  refundRemakeReservePercentage: "Reserve percentage for refunds and reprints.",
  packagingCostPerOrder: "Cost of packaging materials per order.",
  shippingMaterialCostPerOrder: "Cost of shipping materials per order.",
  customerAcquisitionCost: "Average cost to acquire a new customer.",
  avgRepeatPurchaseFrequency: "Average number of repeat purchases per customer per year.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [assumptions, setAssumptions] = useState<Assumptions>(getDefaultAssumptions());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Product sizes state (mutable copy)
  const [sizes, setSizes] = useState<Array<{ name: string; width: number; height: number; label: string; active: boolean; retailPrice: number; wholesalePrice: number }>>(
    GANG_SHEET_SIZES.map((s) => ({ name: s.name, width: s.width, height: s.height, label: s.label, active: true, retailPrice: 0, wholesalePrice: 0 })),
  );
  const [showNewSizeForm, setShowNewSizeForm] = useState(false);
  const [newSize, setNewSize] = useState({ name: "", width: 22, height: 12, label: "" });

  // Volume discount state
  const [discountTiers, setDiscountTiers] = useState<Array<{ minQuantity: number; maxQuantity: number; discount: number; label: string }>>(
    VOLUME_DISCOUNT_TIERS.map((t) => ({ minQuantity: t.minQuantity, maxQuantity: t.maxQuantity, discount: t.discount, label: t.label })),
  );

  // Company settings state
  const [company, setCompany] = useState<{ name: string; tagline: string; email: string; phone: string; website: string; standardTurnaround: string; rushTurnaround: string; sameDayTurnaround: string }>({
    name: BRAND.name,
    tagline: BRAND.tagline,
    email: BRAND.contact.email,
    phone: BRAND.contact.phone,
    website: "https://exora.ink",
    standardTurnaround: "3-5 business days",
    rushTurnaround: "1-2 business days",
    sameDayTurnaround: "Same day (order by 10 AM)",
  });

  // Content editing toggles
  const [editingContent, setEditingContent] = useState<Record<string, boolean>>({});

  // Content state
  const [content, setContent] = useState({
    executiveSummary: `Exora.ink is a DTF (Direct-to-Film) printing profitability intelligence platform designed for modern print operations. The platform provides real-time cost analysis, pricing optimization, scenario modeling, and business intelligence to help DTF print shops maximize profitability.\n\nKey capabilities include a full cost breakdown engine that accounts for materials, labor, equipment, overhead, and waste. The pricing engine reverse-engineers optimal retail and wholesale prices from desired margins. Scenario modeling allows operators to compare low-volume, high-volume, wholesale-focused, and premium-pricing strategies side by side.\n\nThe platform is built for operators who want data-driven decisions rather than guesswork. Every assumption is editable, every formula is transparent, and every recommendation is backed by the numbers.`,
    pricingRecommendation: `Optimal pricing strategy balances volume acquisition with margin preservation. For most DTF operations, a 55% gross margin on retail orders provides a strong foundation while remaining competitive. Wholesale pricing at 70% of retail attracts bulk buyers without cannibalizing direct sales.\n\nRush orders represent a high-margin opportunity -- customers willing to pay 50% premiums for fast turnaround are less price-sensitive and more loyal. Volume discount tiers (5-25% off based on quantity) incentivize larger orders which reduce per-unit overhead allocation.\n\nReview pricing quarterly against actual COGS data. Small adjustments of 2-3% are easier for customers to absorb than infrequent large increases.`,
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleAssumptionChange(key: keyof Assumptions, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setAssumptions((prev) => ({ ...prev, [key]: num }));
    }
  }

  function handleSave(section: string) {
    setSavedMessage(`${section} saved successfully.`);
    setTimeout(() => setSavedMessage(null), 3000);
  }

  function handleResetAssumptions() {
    setAssumptions(getDefaultAssumptions());
    setSavedMessage("Assumptions reset to defaults.");
    setTimeout(() => setSavedMessage(null), 3000);
  }

  function toggleContentEdit(key: string) {
    setEditingContent((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Settings className="h-8 w-8" />
          Admin &amp; Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage assumptions, pricing tiers, products, and company settings.
        </p>
      </div>

      {/* Success banner */}
      {savedMessage && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
          {savedMessage}
        </div>
      )}

      <Tabs defaultValue="assumptions" className="w-full">
        <TabsList className="mb-6 flex flex-wrap gap-1">
          <TabsTrigger value="assumptions" className="gap-1.5">
            <Percent className="h-4 w-4" /> Assumptions
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-4 w-4" /> Product Sizes
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            <Tag className="h-4 w-4" /> Pricing &amp; Discounts
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Company Settings
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5">
            <Settings className="h-4 w-4" /> Content &amp; Guides
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: ASSUMPTIONS                                               */}
        {/* ================================================================ */}
        <TabsContent value="assumptions" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            All values are editable placeholders. Replace with your actual business numbers.
          </p>

          {ASSUMPTION_CATEGORIES.map((cat) => (
            <Card key={cat.title}>
              <CardHeader>
                <CardTitle className="text-lg">{cat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}{" "}
                        <span className="text-xs text-muted-foreground/60">({field.unit})</span>
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={assumptions[field.key]}
                        onChange={(e) => handleAssumptionChange(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("Assumptions")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" /> Save Assumptions
            </button>
            <button
              onClick={handleResetAssumptions}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Reset to Defaults
            </button>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: PRODUCT SIZES                                             */}
        {/* ================================================================ */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gang Sheet Sizes</CardTitle>
              <CardDescription>
                Manage available gang sheet sizes with retail and wholesale pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Dimensions</th>
                      <th className="px-3 py-2">Retail Price</th>
                      <th className="px-3 py-2">Wholesale Price</th>
                      <th className="px-3 py-2">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2 font-medium">{size.name}</td>
                        <td className="px-3 py-2">{size.label}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28"
                            value={size.retailPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSizes((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, retailPrice: val } : s)),
                              );
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28"
                            value={size.wholesalePrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSizes((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, wholesalePrice: val } : s)),
                              );
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              setSizes((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, active: !s.active } : s,
                                ),
                              )
                            }
                            className="text-xs"
                          >
                            <Badge variant={size.active ? "default" : "secondary"}>
                              {size.active ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Size */}
              <div className="mt-4">
                {showNewSizeForm ? (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h4 className="text-sm font-semibold">Add New Size</h4>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Name</label>
                        <Input
                          value={newSize.name}
                          onChange={(e) => setNewSize((p) => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. XXXL"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Width (in)</label>
                        <Input
                          type="number"
                          value={newSize.width}
                          onChange={(e) =>
                            setNewSize((p) => ({ ...p, width: parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Height (in)</label>
                        <Input
                          type="number"
                          value={newSize.height}
                          onChange={(e) =>
                            setNewSize((p) => ({ ...p, height: parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => {
                            const label = `${newSize.width}" x ${newSize.height}"`;
                            setSizes((prev) => [
                              ...prev,
                              { ...newSize, label, active: true, retailPrice: 0, wholesalePrice: 0 },
                            ]);
                            setNewSize({ name: "", width: 22, height: 12, label: "" });
                            setShowNewSizeForm(false);
                          }}
                          className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowNewSizeForm(false)}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewSizeForm(true)}
                    className="rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    + Add New Size
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("Product Sizes")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" /> Save Product Sizes
            </button>
            <button
              onClick={() => {
                setSizes(
                  GANG_SHEET_SIZES.map((s) => ({
                    ...s,
                    active: true,
                    retailPrice: 0,
                    wholesalePrice: 0,
                  })),
                );
                setSavedMessage("Product sizes reset to defaults.");
                setTimeout(() => setSavedMessage(null), 3000);
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Reset to Defaults
            </button>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: PRICING & DISCOUNTS                                       */}
        {/* ================================================================ */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Volume Discount Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Discount Tiers</CardTitle>
              <CardDescription>
                Quantity-based discounts applied automatically at checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2">Min Qty</th>
                    <th className="px-3 py-2">Max Qty</th>
                    <th className="px-3 py-2">Discount %</th>
                  </tr>
                </thead>
                <tbody>
                  {discountTiers.map((tier, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{tier.label}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className="w-24"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setDiscountTiers((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, minQuantity: val } : t)),
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className="w-24"
                          value={tier.maxQuantity === Infinity ? "" : tier.maxQuantity}
                          placeholder="Unlimited"
                          onChange={(e) => {
                            const val = e.target.value === "" ? Infinity : parseInt(e.target.value) || 0;
                            setDiscountTiers((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, maxQuantity: val } : t)),
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className="w-24"
                          value={tier.discount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDiscountTiers((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, discount: val } : t)),
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Fee Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Rush Fee Percentage (%)
                  </label>
                  <Input
                    type="number"
                    value={assumptions.rushFeePercentage}
                    onChange={(e) => handleAssumptionChange("rushFeePercentage", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Currently: {formatPercent(assumptions.rushFeePercentage)} surcharge
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Minimum Order Fee ($)
                  </label>
                  <Input
                    type="number"
                    value={assumptions.minimumOrderFee}
                    onChange={(e) => handleAssumptionChange("minimumOrderFee", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Currently: {formatCurrency(assumptions.minimumOrderFee)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Setup Fee ($)
                  </label>
                  <Input
                    type="number"
                    value={assumptions.setupFee}
                    onChange={(e) => handleAssumptionChange("setupFee", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Currently: {formatCurrency(assumptions.setupFee)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Wholesale Discount (%)
                  </label>
                  <Input type="number" defaultValue={30} />
                  <p className="text-xs text-muted-foreground">
                    Wholesale = Retail x (1 - discount%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("Pricing & Discounts")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" /> Save Pricing
            </button>
            <button
              onClick={() => {
                setDiscountTiers(VOLUME_DISCOUNT_TIERS.map((t) => ({ ...t })));
                setSavedMessage("Pricing reset to defaults.");
                setTimeout(() => setSavedMessage(null), 3000);
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Reset to Defaults
            </button>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 4: COMPANY SETTINGS                                          */}
        {/* ================================================================ */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Tagline</label>
                  <Input
                    value={company.tagline}
                    onChange={(e) => setCompany((p) => ({ ...p, tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <Input
                    value={company.phone}
                    onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <Input
                    value={company.website}
                    onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turnaround Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Standard Turnaround
                  </label>
                  <Input
                    value={company.standardTurnaround}
                    onChange={(e) =>
                      setCompany((p) => ({ ...p, standardTurnaround: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Rush Turnaround
                  </label>
                  <Input
                    value={company.rushTurnaround}
                    onChange={(e) =>
                      setCompany((p) => ({ ...p, rushTurnaround: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Same-Day Turnaround
                  </label>
                  <Input
                    value={company.sameDayTurnaround}
                    onChange={(e) =>
                      setCompany((p) => ({ ...p, sameDayTurnaround: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("Company Settings")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" /> Save Company Settings
            </button>
            <button
              onClick={() => {
                setCompany({
                  name: BRAND.name,
                  tagline: BRAND.tagline,
                  email: BRAND.contact.email,
                  phone: BRAND.contact.phone,
                  website: "https://exora.ink",
                  standardTurnaround: "3-5 business days",
                  rushTurnaround: "1-2 business days",
                  sameDayTurnaround: "Same day (order by 10 AM)",
                });
                setSavedMessage("Company settings reset to defaults.");
                setTimeout(() => setSavedMessage(null), 3000);
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Reset to Defaults
            </button>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 5: CONTENT & GUIDES                                          */}
        {/* ================================================================ */}
        <TabsContent value="content" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Executive Summary</CardTitle>
                <CardDescription>
                  Overview of the DTF profitability platform.
                </CardDescription>
              </div>
              <button
                onClick={() => toggleContentEdit("executiveSummary")}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {editingContent.executiveSummary ? "Lock" : "Edit"}
              </button>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[160px] w-full rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editingContent.executiveSummary}
                value={content.executiveSummary}
                onChange={(e) =>
                  setContent((p) => ({ ...p, executiveSummary: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {/* Assumptions Glossary */}
          <Card>
            <CardHeader>
              <CardTitle>Assumptions Glossary</CardTitle>
              <CardDescription>
                Definitions for each assumption field used in the pricing engine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(ASSUMPTIONS_GLOSSARY).map(([key, definition]) => (
                  <div key={key} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{key}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formula Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Formula Summary</CardTitle>
              <CardDescription>
                Key formulas powering the pricing engine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="rounded-lg border p-3">
                  <p className="font-medium">Cost per sq ft</p>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    (material + ink + powder + labor + equipment + overhead) / area
                  </code>
                </li>
                <li className="rounded-lg border p-3">
                  <p className="font-medium">Retail Price</p>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    Total Cost / (1 - Desired Gross Margin%)
                  </code>
                </li>
                <li className="rounded-lg border p-3">
                  <p className="font-medium">Gross Margin</p>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    (Revenue - COGS) / Revenue x 100
                  </code>
                </li>
                <li className="rounded-lg border p-3">
                  <p className="font-medium">Break-even</p>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    Fixed Costs / (Price - Variable Cost per Unit)
                  </code>
                </li>
                <li className="rounded-lg border p-3">
                  <p className="font-medium">Customer Lifetime Value (CLV)</p>
                  <code className="mt-1 block text-xs text-muted-foreground">
                    (Avg Order x Repeat Frequency x Years) - Acquisition Cost
                  </code>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pricing Recommendation Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pricing Recommendation Summary</CardTitle>
                <CardDescription>
                  Guidance on optimal pricing strategy.
                </CardDescription>
              </div>
              <button
                onClick={() => toggleContentEdit("pricingRecommendation")}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {editingContent.pricingRecommendation ? "Lock" : "Edit"}
              </button>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[120px] w-full rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editingContent.pricingRecommendation}
                value={content.pricingRecommendation}
                onChange={(e) =>
                  setContent((p) => ({ ...p, pricingRecommendation: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {/* 90-Day Improvement Plan */}
          <Card>
            <CardHeader>
              <CardTitle>90-Day Improvement Plan</CardTitle>
              <CardDescription>
                Actionable suggestions to improve profitability within the next quarter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    1
                  </Badge>
                  <div>
                    <p className="font-medium">Reduce waste from 5% to 3%</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Improve nesting algorithms and optimize gang sheet layouts to minimize
                      material waste.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    2
                  </Badge>
                  <div>
                    <p className="font-medium">Introduce rush order pricing</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Capture 15-20% premium on urgent jobs by offering expedited turnaround
                      options.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    3
                  </Badge>
                  <div>
                    <p className="font-medium">Launch wholesale program</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Target 30% of revenue from wholesale accounts with dedicated pricing
                      tiers.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    4
                  </Badge>
                  <div>
                    <p className="font-medium">Implement volume discount tiers</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Incentivize larger orders with structured quantity-based discounts.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    5
                  </Badge>
                  <div>
                    <p className="font-medium">Track and optimize customer lifetime value</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Encourage repeat purchases through loyalty incentives and follow-up
                      campaigns.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    6
                  </Badge>
                  <div>
                    <p className="font-medium">
                      Review overhead allocation and renegotiate supplier contracts
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Conduct monthly reviews of overhead and explore bulk purchasing or
                      alternative suppliers.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave("Content & Guides")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" /> Save Content
            </button>
            <button
              onClick={() => {
                setEditingContent({});
                setSavedMessage("Content editing locked.");
                setTimeout(() => setSavedMessage(null), 3000);
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Lock All Editing
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
