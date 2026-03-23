"use client";

import { useState, useMemo } from "react";
import type { PressServiceQuoteInput, PressServiceQuoteResult, PressServicePlacement } from "@/types";
import type { PressServiceTier } from "@/lib/constants";
import { PRESS_LOCATIONS } from "@/lib/constants";
import { calculatePressServiceQuote, getColorTierDiscount } from "@/lib/pricing-engine";

const DEFAULT_PLACEMENT: PressServicePlacement = {
  locationId: PRESS_LOCATIONS[0].id,
  locationLabel: PRESS_LOCATIONS[0].label,
  complexity: PRESS_LOCATIONS[0].complexity,
  isNonStandard: PRESS_LOCATIONS[0].isNonStandard,
};

export function usePressService() {
  const [tier, setTier] = useState<PressServiceTier>("B");
  const [placements, setPlacements] = useState<PressServicePlacement[]>([
    { ...DEFAULT_PLACEMENT },
  ]);
  const [quantity, setQuantity] = useState(100);
  const [colorCount, setColorCount] = useState(1);
  const [showInternalMetrics, setShowInternalMetrics] = useState(false);

  const addPlacement = () => {
    // Find first unused location
    const usedIds = new Set(placements.map((p) => p.locationId));
    const next = PRESS_LOCATIONS.find((l) => !usedIds.has(l.id));
    if (next) {
      setPlacements((prev) => [
        ...prev,
        {
          locationId: next.id,
          locationLabel: next.label,
          complexity: next.complexity,
          isNonStandard: next.isNonStandard,
        },
      ]);
    }
  };

  const removePlacement = (index: number) => {
    setPlacements((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlacement = (index: number, locationId: string) => {
    const loc = PRESS_LOCATIONS.find((l) => l.id === locationId);
    if (!loc) return;
    setPlacements((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              locationId: loc.id,
              locationLabel: loc.label,
              complexity: loc.complexity,
              isNonStandard: loc.isNonStandard,
            }
          : p,
      ),
    );
  };

  const updatePlacementComplexity = (
    index: number,
    complexity: PressServicePlacement["complexity"],
  ) => {
    setPlacements((prev) =>
      prev.map((p, i) => (i === index ? { ...p, complexity } : p)),
    );
  };

  const quote = useMemo((): PressServiceQuoteResult | null => {
    if (placements.length === 0 || quantity < 1) return null;
    const input: PressServiceQuoteInput = {
      placements,
      quantity,
      colorCount,
      tier,
    };
    return calculatePressServiceQuote(input);
  }, [placements, quantity, colorCount, tier]);

  // Color escalation: show price at 1,2,3,4,6,8 colors for current tier
  const colorEscalation = useMemo(() => {
    if (placements.length === 0) return [];
    const colors = [1, 2, 3, 4, 6, 8];
    return colors.map((c) => {
      const result = calculatePressServiceQuote({
        placements,
        quantity,
        colorCount: c,
        tier,
      });
      return {
        colorCount: c,
        discountPercent: result.discountPercent,
        dtfPerShirt: result.dtfPerShirt,
        dtfOrderTotal: result.dtfOrderTotal,
        screenPrintOrderTotal: result.screenPrintOrderTotal,
        grossMarginPercent: result.grossMarginPercent,
        customerSavingsPercent: result.customerSavingsPercent,
      };
    });
  }, [placements, quantity, tier]);

  return {
    tier,
    setTier,
    placements,
    addPlacement,
    removePlacement,
    updatePlacement,
    updatePlacementComplexity,
    quantity,
    setQuantity,
    colorCount,
    setColorCount,
    showInternalMetrics,
    setShowInternalMetrics,
    quote,
    colorEscalation,
  };
}
