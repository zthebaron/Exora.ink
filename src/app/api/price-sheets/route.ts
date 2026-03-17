import { NextResponse } from "next/server";
import { getDefaultAssumptions, calculatePricing } from "@/lib/pricing-engine";
import { GANG_SHEET_SIZES, VOLUME_DISCOUNT_TIERS } from "@/lib/constants";

export async function GET() {
  const assumptions = getDefaultAssumptions();
  const pricing = GANG_SHEET_SIZES.map((size) => ({
    ...size,
    ...calculatePricing(assumptions, size.width, size.height),
  }));

  return NextResponse.json({
    pricing,
    volumeDiscounts: VOLUME_DISCOUNT_TIERS,
    rushFeePercentage: assumptions.rushFeePercentage,
    minimumOrderFee: assumptions.minimumOrderFee,
    setupFee: assumptions.setupFee,
  });
}
