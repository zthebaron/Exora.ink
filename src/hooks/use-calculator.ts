"use client";

import { useState, useMemo } from "react";
import type { Assumptions } from "@/types";
import {
  getDefaultAssumptions,
  calculateCostBreakdown,
  calculatePricing,
  calculateCLV,
} from "@/lib/pricing-engine";
import { GANG_SHEET_SIZES } from "@/lib/constants";

export function useCalculator() {
  const [assumptions, setAssumptions] = useState<Assumptions>(getDefaultAssumptions());
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(1); // Medium default

  const selectedSize = GANG_SHEET_SIZES[selectedSizeIndex];

  const costBreakdown = useMemo(
    () => calculateCostBreakdown(assumptions, selectedSize.width, selectedSize.height),
    [assumptions, selectedSize]
  );

  const pricing = useMemo(
    () => calculatePricing(assumptions, selectedSize.width, selectedSize.height),
    [assumptions, selectedSize]
  );

  const allSizePricing = useMemo(
    () => GANG_SHEET_SIZES.map((size) => ({
      ...size,
      pricing: calculatePricing(assumptions, size.width, size.height),
    })),
    [assumptions]
  );

  const clv = useMemo(
    () => calculateCLV(assumptions, pricing.retailPrice),
    [assumptions, pricing.retailPrice]
  );

  const updateAssumption = <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
  };

  const resetAssumptions = () => setAssumptions(getDefaultAssumptions());

  return {
    assumptions,
    setAssumptions,
    updateAssumption,
    resetAssumptions,
    selectedSizeIndex,
    setSelectedSizeIndex,
    selectedSize,
    costBreakdown,
    pricing,
    allSizePricing,
    clv,
  };
}
