import type {
  Assumptions,
  CostBreakdown,
  PricingResult,
  ScenarioResult,
  SensitivityPoint,
  CLVResult,
} from "@/types";
import type { RollWidthMode } from "@/lib/constants";
import { ROLL_WIDTH_OPTIONS, getGangSheetSizes } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRAMS_PER_LB = 453.6;
const WORKING_HOURS_PER_MONTH = 160;
const INCHES_PER_FOOT = 12;
const AVG_CUSTOMER_LIFETIME_YEARS = 3;

/** Safely divide, returning 0 when the divisor is zero or non-finite. */
function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || !Number.isFinite(denominator)) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}

/** Round to two decimal places. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// 1. Default Assumptions
// ---------------------------------------------------------------------------

export function getDefaultAssumptions(rollMode: RollWidthMode = "wide"): Assumptions {
  const roll = ROLL_WIDTH_OPTIONS[rollMode];
  return {
    // Material costs
    filmCostPerRoll: roll.rollCost,
    rollWidth: roll.width,  // inches
    rollLength: 328,     // feet
    inkCostPerMl: 0.08,
    avgInkUsagePerSqFt: 12,   // ml
    powderCostPerLb: 12,
    avgPowderUsagePerSqFt: 8, // grams

    // Labor
    laborCostPerHour: 22,
    avgProductionSpeedPerHour: 15, // sheets

    // Equipment & Overhead
    electricityCostPerMonth: 250,
    machineLeasePerMonth: 800,
    maintenanceReservePerMonth: 200,
    softwareCostPerMonth: 150,
    rentOverheadPerMonth: 1500,

    // Waste & Quality
    wastePercentage: 5,
    failedPrintPercentage: 3,

    // Fulfillment
    packagingCostPerOrder: 1.5,
    shippingMaterialCostPerOrder: 2.0,

    // Margins & Fees
    desiredGrossMargin: 55,
    desiredNetMargin: 25,
    minimumOrderFee: 10,
    setupFee: 5,
    rushFeePercentage: 50,
    refundRemakeReservePercentage: 3,

    // Customer
    customerAcquisitionCost: 25,
    avgRepeatPurchaseFrequency: 4,
  };
}

// ---------------------------------------------------------------------------
// 2. Cost Breakdown
// ---------------------------------------------------------------------------

export function calculateCostBreakdown(
  assumptions: Assumptions,
  sheetWidth: number,
  sheetHeight: number,
): CostBreakdown {
  const {
    filmCostPerRoll,
    rollWidth,
    rollLength,
    inkCostPerMl,
    avgInkUsagePerSqFt,
    powderCostPerLb,
    avgPowderUsagePerSqFt,
    laborCostPerHour,
    avgProductionSpeedPerHour,
    electricityCostPerMonth,
    machineLeasePerMonth,
    maintenanceReservePerMonth,
    softwareCostPerMonth,
    rentOverheadPerMonth,
    wastePercentage,
    packagingCostPerOrder,
    refundRemakeReservePercentage,
  } = assumptions;

  // Sheet area in square feet (dimensions are in inches)
  const sqFt = (sheetWidth * sheetHeight) / 144;

  // Roll total area in square feet
  const rollSqFt = (rollWidth * rollLength * INCHES_PER_FOOT) / 144;

  // Material (film) cost
  const materialCost = safeDivide(sqFt, rollSqFt) * filmCostPerRoll;

  // Ink cost
  const inkCost = sqFt * avgInkUsagePerSqFt * inkCostPerMl;

  // Powder cost (convert grams usage to lbs for price calc)
  const powderCost =
    sqFt * avgPowderUsagePerSqFt * safeDivide(powderCostPerLb, GRAMS_PER_LB);

  // Labor cost per sheet
  const laborCost = safeDivide(laborCostPerHour, avgProductionSpeedPerHour);

  // Monthly sheets capacity
  const monthlySheetCapacity = avgProductionSpeedPerHour * WORKING_HOURS_PER_MONTH;

  // Equipment burden per sheet
  const monthlyEquipmentCost =
    machineLeasePerMonth + maintenanceReservePerMonth + electricityCostPerMonth;
  const equipmentBurden = safeDivide(monthlyEquipmentCost, monthlySheetCapacity);

  // Overhead allocation per sheet
  const monthlyOverhead = softwareCostPerMonth + rentOverheadPerMonth;
  const overheadAllocation = safeDivide(monthlyOverhead, monthlySheetCapacity);

  // Subtotal before waste & reserves
  const subtotal =
    materialCost + inkCost + powderCost + laborCost + equipmentBurden + overheadAllocation;

  // Waste allowance
  const wasteAllowance = subtotal * (wastePercentage / 100);

  // Packaging (1 sheet per order)
  const packagingCost = packagingCostPerOrder;

  // Reprint / refund reserve
  const reprintReserve = subtotal * (refundRemakeReservePercentage / 100);

  const totalCostPerSheet = round2(
    subtotal + wasteAllowance + packagingCost + reprintReserve,
  );

  const costPerSqFt = round2(safeDivide(totalCostPerSheet, sqFt));

  return {
    materialCost: round2(materialCost),
    inkCost: round2(inkCost),
    powderCost: round2(powderCost),
    laborCost: round2(laborCost),
    equipmentBurden: round2(equipmentBurden),
    overheadAllocation: round2(overheadAllocation),
    wasteAllowance: round2(wasteAllowance),
    packagingCost: round2(packagingCost),
    reprintReserve: round2(reprintReserve),
    totalCostPerSheet,
    costPerSqFt,
  };
}

// ---------------------------------------------------------------------------
// 3. Pricing
// ---------------------------------------------------------------------------

export function calculatePricing(
  assumptions: Assumptions,
  sheetWidth: number,
  sheetHeight: number,
): PricingResult {
  const costBreakdown = calculateCostBreakdown(assumptions, sheetWidth, sheetHeight);
  const { totalCostPerSheet } = costBreakdown;
  const { desiredGrossMargin, desiredNetMargin, rushFeePercentage } = assumptions;

  // Retail price backed out from desired gross margin
  const retailPrice = round2(
    safeDivide(totalCostPerSheet, 1 - desiredGrossMargin / 100),
  );

  // Wholesale = 70 % of retail
  const wholesalePrice = round2(retailPrice * 0.7);

  // Rush pricing
  const rushPrice = round2(retailPrice * (1 + rushFeePercentage / 100));

  // Gross profit & margin (based on retail)
  const grossProfit = round2(retailPrice - totalCostPerSheet);
  const grossMargin = round2(safeDivide(grossProfit, retailPrice) * 100);

  // Net profit & margin (apply desired net margin to retail)
  const netProfit = round2(retailPrice * (desiredNetMargin / 100));
  const netMargin = desiredNetMargin;

  return {
    costBreakdown,
    retailPrice,
    wholesalePrice,
    rushPrice,
    grossProfit,
    grossMargin,
    netProfit,
    netMargin,
  };
}

// ---------------------------------------------------------------------------
// 4. Scenario Calculator
// ---------------------------------------------------------------------------

export function calculateScenario(
  name: string,
  assumptions: Assumptions,
  monthlyOrders: number,
  avgSheetSize: { width: number; height: number },
  retailMix: number,
): ScenarioResult {
  const pricing = calculatePricing(assumptions, avgSheetSize.width, avgSheetSize.height);
  const { retailPrice, wholesalePrice, costBreakdown } = pricing;
  const { totalCostPerSheet } = costBreakdown;
  const sqFt = (avgSheetSize.width * avgSheetSize.height) / 144;

  // Blended average order value
  const avgOrderValue = round2(
    retailPrice * retailMix + wholesalePrice * (1 - retailMix),
  );

  const revenue = round2(monthlyOrders * avgOrderValue);
  const cogs = round2(monthlyOrders * totalCostPerSheet);
  const grossProfit = round2(revenue - cogs);
  const grossMargin = round2(safeDivide(grossProfit, revenue) * 100);

  // Fixed monthly operating expenses
  const operatingExpenses = round2(
    assumptions.electricityCostPerMonth +
      assumptions.machineLeasePerMonth +
      assumptions.maintenanceReservePerMonth +
      assumptions.softwareCostPerMonth +
      assumptions.rentOverheadPerMonth,
  );

  const netProfit = round2(grossProfit - operatingExpenses);
  const netMargin = round2(safeDivide(netProfit, revenue) * 100);

  // Break-even
  const contributionPerOrder = avgOrderValue - totalCostPerSheet;
  const breakEvenOrders = round2(
    Math.ceil(safeDivide(operatingExpenses, contributionPerOrder)),
  );
  const breakEvenRevenue = round2(breakEvenOrders * avgOrderValue);

  // Per-unit profitability
  const profitPerOrder = round2(safeDivide(netProfit, monthlyOrders));
  const profitPerSheet = profitPerOrder; // 1 sheet per order assumption
  const profitPerSqFt = round2(safeDivide(profitPerOrder, sqFt));

  return {
    name,
    monthlyOrders,
    avgOrderValue,
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses,
    netProfit,
    netMargin,
    breakEvenOrders,
    breakEvenRevenue,
    profitPerOrder,
    profitPerSheet,
    profitPerSqFt,
    monthlyProfitForecast: netProfit,
    annualProfitForecast: round2(netProfit * 12),
  };
}

// ---------------------------------------------------------------------------
// 5. Scenario Presets
// ---------------------------------------------------------------------------

export function getScenarioPresets(assumptions: Assumptions, rollMode: RollWidthMode = "wide"): ScenarioResult[] {
  const sizes = getGangSheetSizes(rollMode);
  const defaultSize = { width: sizes[1].width, height: sizes[1].height };

  // Best-case: premium pricing with 70 % gross margin
  const premiumMarginAssumptions: Assumptions = {
    ...assumptions,
    desiredGrossMargin: 70,
  };

  // Worst-case: high waste, lower retail mix
  const worstCaseAssumptions: Assumptions = {
    ...assumptions,
    wastePercentage: 12,
  };

  // Aggressive pricing: low margin, high volume
  const aggressiveAssumptions: Assumptions = {
    ...assumptions,
    desiredGrossMargin: 40,
  };

  // Premium pricing: high margin, lower volume
  const premiumPricingAssumptions: Assumptions = {
    ...assumptions,
    desiredGrossMargin: 65,
  };

  return [
    calculateScenario("Low Volume", assumptions, 100, defaultSize, 1.0),
    calculateScenario("Medium Volume", assumptions, 250, defaultSize, 0.8),
    calculateScenario("High Volume", assumptions, 500, defaultSize, 0.6),
    calculateScenario("Best Case", premiumMarginAssumptions, 500, defaultSize, 0.8),
    calculateScenario("Expected Case", assumptions, 250, defaultSize, 0.8),
    calculateScenario("Worst Case", worstCaseAssumptions, 100, defaultSize, 0.6),
    calculateScenario("Aggressive Pricing", aggressiveAssumptions, 500, defaultSize, 0.7),
    calculateScenario("Premium Pricing", premiumPricingAssumptions, 150, defaultSize, 0.85),
    calculateScenario("Wholesale Focus", assumptions, 400, defaultSize, 0.2),
    calculateScenario("Retail Focus", assumptions, 200, defaultSize, 0.95),
  ];
}

// ---------------------------------------------------------------------------
// 6. Sensitivity Analysis
// ---------------------------------------------------------------------------

export function calculateSensitivity(assumptions: Assumptions, rollMode: RollWidthMode = "wide"): SensitivityPoint[] {
  const sizes = getGangSheetSizes(rollMode);
  const defaultSize = { width: sizes[1].width, height: sizes[1].height };
  const baseMonthlyOrders = 250;
  const baseRetailMix = 0.8;

  /** Run a scenario and return monthly net profit. */
  function profit(overrides: Partial<Assumptions>, orders?: number): number {
    const a: Assumptions = { ...assumptions, ...overrides };
    const result = calculateScenario(
      "sensitivity",
      a,
      orders ?? baseMonthlyOrders,
      defaultSize,
      baseRetailMix,
    );
    return result.netProfit;
  }

  const baseProfit = profit({});

  // Helper to build a sensitivity point from assumption overrides
  function buildPoint(
    variable: string,
    lowOverrides: Partial<Assumptions>,
    highOverrides: Partial<Assumptions>,
    baseValue: number,
    lowValue: number,
    highValue: number,
    lowOrders?: number,
    highOrders?: number,
  ): SensitivityPoint {
    return {
      variable,
      baseValue: round2(baseValue),
      lowValue: round2(lowValue),
      highValue: round2(highValue),
      lowProfit: round2(profit(lowOverrides, lowOrders)),
      baseProfit: round2(baseProfit),
      highProfit: round2(profit(highOverrides, highOrders)),
    };
  }

  // Selling price (±20 %) — modeled via gross margin shifts
  const basePricing = calculatePricing(assumptions, defaultSize.width, defaultSize.height);
  const baseRetail = basePricing.retailPrice;
  const lowRetail = baseRetail * 0.8;
  const highRetail = baseRetail * 1.2;
  // Reverse-engineer margin from adjusted price: margin = 1 - cost/price
  const cost = basePricing.costBreakdown.totalCostPerSheet;
  const lowPriceMargin = Math.max(1, (1 - safeDivide(cost, lowRetail)) * 100);
  const highPriceMargin = Math.min(99, (1 - safeDivide(cost, highRetail)) * 100);

  const points: SensitivityPoint[] = [
    // Selling price
    buildPoint(
      "Selling Price",
      { desiredGrossMargin: lowPriceMargin },
      { desiredGrossMargin: highPriceMargin },
      baseRetail,
      lowRetail,
      highRetail,
    ),

    // Waste rate (3 % — 12 %)
    buildPoint(
      "Waste Rate",
      { wastePercentage: 3 },
      { wastePercentage: 12 },
      assumptions.wastePercentage,
      3,
      12,
    ),

    // Ink cost (±30 %)
    buildPoint(
      "Ink Cost",
      { inkCostPerMl: assumptions.inkCostPerMl * 0.7 },
      { inkCostPerMl: assumptions.inkCostPerMl * 1.3 },
      assumptions.inkCostPerMl,
      round2(assumptions.inkCostPerMl * 0.7),
      round2(assumptions.inkCostPerMl * 1.3),
    ),

    // Labor cost (±25 %)
    buildPoint(
      "Labor Cost",
      { laborCostPerHour: assumptions.laborCostPerHour * 0.75 },
      { laborCostPerHour: assumptions.laborCostPerHour * 1.25 },
      assumptions.laborCostPerHour,
      round2(assumptions.laborCostPerHour * 0.75),
      round2(assumptions.laborCostPerHour * 1.25),
    ),

    // Monthly orders (100 — 500)
    buildPoint(
      "Monthly Orders",
      {},
      {},
      baseMonthlyOrders,
      100,
      500,
      100,
      500,
    ),

    // Average order size (±30 %)
    {
      variable: "Avg Order Size",
      baseValue: round2((defaultSize.width * defaultSize.height) / 144),
      lowValue: round2(((defaultSize.width * defaultSize.height) / 144) * 0.7),
      highValue: round2(((defaultSize.width * defaultSize.height) / 144) * 1.3),
      lowProfit: round2(
        calculateScenario(
          "sensitivity",
          assumptions,
          baseMonthlyOrders,
          {
            width: defaultSize.width,
            height: Math.round(defaultSize.height * 0.7),
          },
          baseRetailMix,
        ).netProfit,
      ),
      baseProfit: round2(baseProfit),
      highProfit: round2(
        calculateScenario(
          "sensitivity",
          assumptions,
          baseMonthlyOrders,
          {
            width: defaultSize.width,
            height: Math.round(defaultSize.height * 1.3),
          },
          baseRetailMix,
        ).netProfit,
      ),
    },

    // Discount percentage (0 % — 25 %, modeled as margin reduction)
    buildPoint(
      "Discount Percentage",
      { desiredGrossMargin: assumptions.desiredGrossMargin },
      { desiredGrossMargin: Math.max(1, assumptions.desiredGrossMargin - 25) },
      0,
      0,
      25,
    ),

    // Overhead (±20 %)
    buildPoint(
      "Overhead",
      {
        rentOverheadPerMonth: assumptions.rentOverheadPerMonth * 0.8,
        softwareCostPerMonth: assumptions.softwareCostPerMonth * 0.8,
      },
      {
        rentOverheadPerMonth: assumptions.rentOverheadPerMonth * 1.2,
        softwareCostPerMonth: assumptions.softwareCostPerMonth * 1.2,
      },
      assumptions.rentOverheadPerMonth + assumptions.softwareCostPerMonth,
      round2((assumptions.rentOverheadPerMonth + assumptions.softwareCostPerMonth) * 0.8),
      round2((assumptions.rentOverheadPerMonth + assumptions.softwareCostPerMonth) * 1.2),
    ),
  ];

  return points;
}

// ---------------------------------------------------------------------------
// 7. Customer Lifetime Value
// ---------------------------------------------------------------------------

export function calculateCLV(
  assumptions: Assumptions,
  avgOrderValue: number,
): CLVResult {
  const repeatFrequency = assumptions.avgRepeatPurchaseFrequency;
  const annualRevenue = avgOrderValue * repeatFrequency;
  const grossProfitPerCustomer = annualRevenue * (assumptions.desiredGrossMargin / 100);
  const acquisitionCost = assumptions.customerAcquisitionCost;

  const monthlyGrossProfit = safeDivide(grossProfitPerCustomer, 12);
  const paybackPeriodMonths = round2(safeDivide(acquisitionCost, monthlyGrossProfit));

  const lifetimeValue = round2(annualRevenue * AVG_CUSTOMER_LIFETIME_YEARS);
  const lifetimeProfit = round2(
    grossProfitPerCustomer * AVG_CUSTOMER_LIFETIME_YEARS - acquisitionCost,
  );

  return {
    avgOrderValue: round2(avgOrderValue),
    repeatFrequency,
    grossProfitPerCustomer: round2(grossProfitPerCustomer),
    acquisitionCost,
    paybackPeriodMonths,
    lifetimeValue,
    lifetimeProfit,
  };
}
