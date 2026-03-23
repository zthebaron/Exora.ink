export const BRAND = {
  name: "Exora.ink",
  tagline: "DTF Printing Intelligence Platform",
  description: "Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.",
  colors: {
    primary: "#0D9488",     // teal-600
    primaryLight: "#14B8A6", // teal-500
    secondary: "#0EA5E9",   // sky-500
    accent: "#F59E0B",      // amber-500
    dark: "#0F172A",        // slate-900
    light: "#F8FAFC",       // slate-50
  },
  contact: {
    creator: "Tim de Vallee",
    title: "AI Architect",
    phone: "310-453-5555",
    email: "tim@digitalboutique.ai",
    company: "Digital Boutique",
    division: "a Division of Digital Universe",
  },
} as const;

export type RollWidthMode = "standard" | "wide";

export const ROLL_WIDTH_OPTIONS = {
  standard: { width: 22, rollCost: 85, label: '22" Standard (Competitor Reference)' },
  wide: { width: 30, rollCost: 264.49, label: '30" Wide (Mimaki TxF300-75)' },
} as const;

export const GANG_SHEET_SIZES_STANDARD = [
  { name: "Small", width: 22, height: 12, label: '22" x 12"' },
  { name: "Medium", width: 22, height: 24, label: '22" x 24"' },
  { name: "Large", width: 22, height: 36, label: '22" x 36"' },
  { name: "XL", width: 22, height: 48, label: '22" x 48"' },
  { name: "XXL", width: 22, height: 60, label: '22" x 60"' },
  { name: "Max", width: 22, height: 72, label: '22" x 72"' },
] as const;

export const GANG_SHEET_SIZES_WIDE = [
  { name: "Small", width: 30, height: 12, label: '30" x 12"' },
  { name: "Medium", width: 30, height: 24, label: '30" x 24"' },
  { name: "Large", width: 30, height: 36, label: '30" x 36"' },
  { name: "XL", width: 30, height: 48, label: '30" x 48"' },
  { name: "XXL", width: 30, height: 60, label: '30" x 60"' },
  { name: "Max", width: 30, height: 72, label: '30" x 72"' },
] as const;

/** @deprecated Use GANG_SHEET_SIZES_STANDARD instead */
export const GANG_SHEET_SIZES = GANG_SHEET_SIZES_STANDARD;

export function getGangSheetSizes(mode: RollWidthMode) {
  return mode === "wide" ? GANG_SHEET_SIZES_WIDE : GANG_SHEET_SIZES_STANDARD;
}

export const VOLUME_DISCOUNT_TIERS = [
  { minQuantity: 1, maxQuantity: 9, discount: 0, label: "1-9 sheets" },
  { minQuantity: 10, maxQuantity: 24, discount: 5, label: "10-24 sheets" },
  { minQuantity: 25, maxQuantity: 49, discount: 10, label: "25-49 sheets" },
  { minQuantity: 50, maxQuantity: 99, discount: 15, label: "50-99 sheets" },
  { minQuantity: 100, maxQuantity: 249, discount: 20, label: "100-249 sheets" },
  { minQuantity: 250, maxQuantity: Infinity, discount: 25, label: "250+ sheets" },
] as const;

// ---------------------------------------------------------------------------
// Press Service Pricing (v3 Tiered Model)
// ---------------------------------------------------------------------------

export type PressServiceTier = "A" | "B" | "C";
export type PlacementComplexity = "standard" | "precision" | "specialty";

/** Screen print benchmark rates (ScreenPlay reference, 49-143 qty tier) */
export const SCREEN_PRINT_RATES = {
  /** Per-shirt per-location rate by color count */
  base: {
    1: 1.56,
    2: 2.06,
    3: 2.56,
    4: 3.06,
    5: 3.31,
    6: 3.56,
    7: 3.81,
    8: 4.06,
  } as Record<number, number>,
  nonStandardSurcharge: 0.40,
  screenCharge: 35,
  artChargePerHour: 60,
} as const;

/** Color-tier discount matrix: % discount off screen print rate per tier */
export const COLOR_TIER_DISCOUNTS = [
  { colorCount: 1, tierA: 5,  tierB: 10, tierC: 15 },
  { colorCount: 2, tierA: 15, tierB: 25, tierC: 35 },
  { colorCount: 3, tierA: 20, tierB: 32, tierC: 42 },
  { colorCount: 4, tierA: 25, tierB: 38, tierC: 48 },
  { colorCount: 5, tierA: 28, tierB: 42, tierC: 52 },
  { colorCount: 6, tierA: 30, tierB: 45, tierC: 55 },
  { colorCount: 7, tierA: 31, tierB: 47, tierC: 57 },
  { colorCount: 8, tierA: 32, tierB: 48, tierC: 58 },
] as const;

/** Placement complexity definitions */
export const PLACEMENT_TYPES = {
  standard: {
    label: "Standard",
    description: "Center chest, full back, left chest, sleeves",
    rateMultiplier: 1.0,
    shirtsPerHour: { min: 40, max: 67 },
  },
  precision: {
    label: "Precision",
    description: "Near existing branding, exact measurements",
    rateMultiplier: 1.25,
    shirtsPerHour: { min: 20, max: 40 },
  },
  specialty: {
    label: "Specialty",
    description: "Along seams, collar area, pocket",
    rateMultiplier: 1.50,
    shirtsPerHour: { min: 15, max: 30 },
  },
} as const;

/** Press service placement locations with base pricing */
export const PRESS_LOCATIONS = [
  { id: "front", label: "Front (Center Chest)", complexity: "standard" as PlacementComplexity, isNonStandard: false },
  { id: "back", label: "Full Back", complexity: "standard" as PlacementComplexity, isNonStandard: false },
  { id: "left-chest", label: "Left Chest", complexity: "standard" as PlacementComplexity, isNonStandard: false },
  { id: "right-chest", label: "Right Chest", complexity: "standard" as PlacementComplexity, isNonStandard: false },
  { id: "sleeve-l", label: "Left Sleeve", complexity: "standard" as PlacementComplexity, isNonStandard: true },
  { id: "sleeve-r", label: "Right Sleeve", complexity: "standard" as PlacementComplexity, isNonStandard: true },
  { id: "nape", label: "Nape / Back Neck", complexity: "precision" as PlacementComplexity, isNonStandard: true },
] as const;

/** Minimum gross margin floor — quotes below this trigger a warning */
export const GROSS_MARGIN_FLOOR = 50;

/** Approximate DTF material + labor cost per placement (from v3 analysis) */
export const DTF_COST_PER_PLACEMENT = 0.93; // ~$280 / (100 shirts × 3 placements)

/** Individual transfer pricing: base rate per sq in */
export const INDIVIDUAL_TRANSFER_BASE_RATE = 0.06; // $/sq in

/** Individual transfer size presets */
export const INDIVIDUAL_TRANSFER_SIZES = [
  { label: '3" × 3"', width: 3, height: 3 },
  { label: '4" × 4"', width: 4, height: 4 },
  { label: '5" × 5"', width: 5, height: 5 },
  { label: '3" × 1.5" (Left Chest)', width: 3, height: 1.5 },
  { label: '10" × 6" (Back)', width: 10, height: 6 },
  { label: '10" × 12" (Full Back)', width: 10, height: 12 },
  { label: '12" × 14" (Oversize Back)', width: 12, height: 14 },
] as const;

/** Individual transfer volume discount tiers */
export const INDIVIDUAL_TRANSFER_VOLUME_TIERS = [
  { min: 1, max: 24, discount: 0, label: "1–24 transfers" },
  { min: 25, max: 49, discount: 0.10, label: "25–49 (10% off)" },
  { min: 50, max: 99, discount: 0.15, label: "50–99 (15% off)" },
  { min: 100, max: 249, discount: 0.20, label: "100–249 (20% off)" },
  { min: 250, max: Infinity, discount: 0.25, label: "250+ (25% off)" },
] as const;
