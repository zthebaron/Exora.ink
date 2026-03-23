export interface Assumptions {
  // Material costs
  filmCostPerRoll: number;
  rollWidth: number;         // inches
  rollLength: number;        // feet
  inkCostPerMl: number;
  inkCostWhitePerMl: number;
  inkCostColorPerMl: number;
  avgInkUsagePerSqFt: number; // ml
  powderCostPerLb: number;
  avgPowderUsagePerSqFt: number; // grams

  // Labor
  laborCostPerHour: number;
  avgProductionSpeedPerHour: number; // sheets

  // Equipment & Overhead
  electricityCostPerMonth: number;
  machineLeasePerMonth: number;
  maintenanceReservePerMonth: number;
  softwareCostPerMonth: number;
  rentOverheadPerMonth: number;

  // Waste & Quality
  wastePercentage: number;
  failedPrintPercentage: number;

  // Fulfillment
  packagingCostPerOrder: number;
  shippingMaterialCostPerOrder: number;

  // Margins & Fees
  desiredGrossMargin: number;
  desiredNetMargin: number;
  minimumOrderFee: number;
  setupFee: number;
  rushFeePercentage: number;
  refundRemakeReservePercentage: number;

  // Customer
  customerAcquisitionCost: number;
  avgRepeatPurchaseFrequency: number; // times per year
}

export interface CostBreakdown {
  materialCost: number;
  inkCost: number;
  powderCost: number;
  laborCost: number;
  equipmentBurden: number;
  overheadAllocation: number;
  wasteAllowance: number;
  packagingCost: number;
  reprintReserve: number;
  totalCostPerSheet: number;
  costPerSqFt: number;
}

export interface PricingResult {
  costBreakdown: CostBreakdown;
  retailPrice: number;
  wholesalePrice: number;
  rushPrice: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
}

export interface ScenarioResult {
  name: string;
  monthlyOrders: number;
  avgOrderValue: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
  netMargin: number;
  breakEvenOrders: number;
  breakEvenRevenue: number;
  profitPerOrder: number;
  profitPerSheet: number;
  profitPerSqFt: number;
  monthlyProfitForecast: number;
  annualProfitForecast: number;
}

export interface SensitivityPoint {
  variable: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  lowProfit: number;
  baseProfit: number;
  highProfit: number;
}

export interface CLVResult {
  avgOrderValue: number;
  repeatFrequency: number;
  grossProfitPerCustomer: number;
  acquisitionCost: number;
  paybackPeriodMonths: number;
  lifetimeValue: number;
  lifetimeProfit: number;
}

export interface GangSheetSize {
  name: string;
  width: number;
  height: number;
  label: string;
}

export interface PriceSheetConfig {
  type: "retail" | "wholesale" | "reseller";
  showBulkDiscounts: boolean;
  showRushPricing: boolean;
  showMinimumOrder: boolean;
  customMessage: string;
}

// ---------------------------------------------------------------------------
// Press Service Pricing Types
// ---------------------------------------------------------------------------

import type { PressServiceTier, PlacementComplexity } from "@/lib/constants";

export interface ColorTierDiscount {
  colorCount: number;
  tierA: number;
  tierB: number;
  tierC: number;
}

export interface PressServicePlacement {
  locationId: string;
  locationLabel: string;
  complexity: PlacementComplexity;
  isNonStandard: boolean;
}

export interface PressServiceQuoteInput {
  placements: PressServicePlacement[];
  quantity: number;
  colorCount: number;
  tier: PressServiceTier;
}

export interface PressServiceQuoteResult {
  // Screen print side
  screenPrintPerLocation: number;
  screenPrintScreenCharges: number;
  screenPrintTotalPerShirt: number;
  screenPrintOrderTotal: number;
  // DTF side
  discountPercent: number;
  dtfPerShirt: number;
  dtfOrderTotal: number;
  // Comparison
  customerSavingsPerShirt: number;
  customerSavingsPercent: number;
  // Profitability
  costPerShirt: number;
  grossProfitPerShirt: number;
  grossMarginPercent: number;
  meetsMarginFloor: boolean;
}

export interface WidthComparisonResult {
  ourWidth: number;
  ourSqInPerFoot: number;
  ourCostPerSqIn: number;
  competitorWidth: number;
  competitorSqInPerFoot: number;
  competitorCostPerSqIn: number;
  areaAdvantagePercent: number;
  costAdvantagePercent: number;
}
