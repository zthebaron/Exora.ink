"use client";

import { useState, useMemo } from "react";
import type { Assumptions } from "@/types";
import type { RollWidthMode } from "@/lib/constants";
import {
  getDefaultAssumptions,
  calculateCostBreakdown,
  calculatePricing,
  calculateCLV,
} from "@/lib/pricing-engine";
import { getGangSheetSizes, ROLL_WIDTH_OPTIONS } from "@/lib/constants";

export function useCalculator() {
  const [rollMode, setRollMode] = useState<RollWidthMode>("wide");
  const [assumptions, setAssumptions] = useState<Assumptions>(() => getDefaultAssumptions("wide"));
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(1); // Medium default

  const gangSheetSizes = useMemo(() => getGangSheetSizes(rollMode), [rollMode]);
  const selectedSize = gangSheetSizes[selectedSizeIndex] ?? gangSheetSizes[0];

  const switchRollMode = (mode: RollWidthMode) => {
    const rollOpt = ROLL_WIDTH_OPTIONS[mode];
    setRollMode(mode);
    setAssumptions((prev) => ({
      ...prev,
      rollWidth: rollOpt.width,
      filmCostPerRoll: rollOpt.rollCost,
    }));
    // Reset size index if out of bounds (shouldn't happen since arrays are same length)
    setSelectedSizeIndex((idx) => Math.min(idx, getGangSheetSizes(mode).length - 1));
  };

  const costBreakdown = useMemo(
    () => calculateCostBreakdown(assumptions, selectedSize.width, selectedSize.height),
    [assumptions, selectedSize]
  );

  const pricing = useMemo(
    () => calculatePricing(assumptions, selectedSize.width, selectedSize.height),
    [assumptions, selectedSize]
  );

  const allSizePricing = useMemo(
    () => gangSheetSizes.map((size) => ({
      ...size,
      pricing: calculatePricing(assumptions, size.width, size.height),
    })),
    [assumptions, gangSheetSizes]
  );

  const clv = useMemo(
    () => calculateCLV(assumptions, pricing.retailPrice),
    [assumptions, pricing.retailPrice]
  );

  const updateAssumption = <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
  };

  const resetAssumptions = () => {
    setAssumptions(getDefaultAssumptions(rollMode));
  };

  return {
    rollMode,
    switchRollMode,
    assumptions,
    setAssumptions,
    updateAssumption,
    resetAssumptions,
    selectedSizeIndex,
    setSelectedSizeIndex,
    selectedSize,
    gangSheetSizes,
    costBreakdown,
    pricing,
    allSizePricing,
    clv,
  };
}
