export const BRAND = {
  name: "Exora.ink",
  tagline: "DTF Printing Intelligence Platform",
  description: "Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.",
  colors: {
    primary: "#6D28D9",     // violet-700
    primaryLight: "#8B5CF6", // violet-500
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

export const GANG_SHEET_SIZES = [
  { name: "Small", width: 22, height: 12, label: '22" x 12"' },
  { name: "Medium", width: 22, height: 24, label: '22" x 24"' },
  { name: "Large", width: 22, height: 36, label: '22" x 36"' },
  { name: "XL", width: 22, height: 48, label: '22" x 48"' },
  { name: "XXL", width: 22, height: 60, label: '22" x 60"' },
  { name: "Max", width: 22, height: 72, label: '22" x 72"' },
] as const;

export const VOLUME_DISCOUNT_TIERS = [
  { minQuantity: 1, maxQuantity: 9, discount: 0, label: "1-9 sheets" },
  { minQuantity: 10, maxQuantity: 24, discount: 5, label: "10-24 sheets" },
  { minQuantity: 25, maxQuantity: 49, discount: 10, label: "25-49 sheets" },
  { minQuantity: 50, maxQuantity: 99, discount: 15, label: "50-99 sheets" },
  { minQuantity: 100, maxQuantity: 249, discount: 20, label: "100-249 sheets" },
  { minQuantity: 250, maxQuantity: Infinity, discount: 25, label: "250+ sheets" },
] as const;
