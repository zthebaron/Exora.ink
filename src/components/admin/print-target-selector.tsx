"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PRINT_TARGETS, type PrintTarget } from "@/lib/qc/types";

interface PrintTargetSelectorProps {
  value: PrintTarget;
  onChange: (target: PrintTarget) => void;
}

const CUSTOM_ID = "custom";

export function PrintTargetSelector({ value, onChange }: PrintTargetSelectorProps) {
  const [isCustom, setIsCustom] = useState(value.id === CUSTOM_ID);
  const [customW, setCustomW] = useState(value.id === CUSTOM_ID ? value.widthIn : 12);
  const [customH, setCustomH] = useState(value.id === CUSTOM_ID ? value.heightIn : 14);

  const handleSelect = (id: string) => {
    if (id === CUSTOM_ID) {
      setIsCustom(true);
      onChange({
        id: CUSTOM_ID,
        label: `Custom (${customW}" × ${customH}")`,
        widthIn: customW,
        heightIn: customH,
      });
    } else {
      setIsCustom(false);
      const target = PRINT_TARGETS.find((p) => p.id === id);
      if (target) onChange(target);
    }
  };

  const updateCustom = (w: number, h: number) => {
    setCustomW(w);
    setCustomH(h);
    onChange({
      id: CUSTOM_ID,
      label: `Custom (${w}" × ${h}")`,
      widthIn: w,
      heightIn: h,
    });
  };

  // 4K native = 4096px. Warn if min print dim × 300 > 4096.
  const min = Math.min(value.widthIn, value.heightIn);
  const needsUpscale = min * 300 > 4096;

  return (
    <div className="space-y-2">
      <Select value={isCustom ? CUSTOM_ID : value.id} onChange={(e) => handleSelect(e.target.value)}>
        {PRINT_TARGETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value={CUSTOM_ID}>Custom…</option>
      </Select>

      {isCustom && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Width (in)</label>
            <Input
              type="number"
              min={1}
              max={36}
              step={0.5}
              value={customW}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) updateCustom(v, customH);
              }}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Height (in)</label>
            <Input
              type="number"
              min={1}
              max={36}
              step={0.5}
              value={customH}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) updateCustom(customW, v);
              }}
            />
          </div>
        </div>
      )}

      {needsUpscale && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠ {value.label} needs ~{Math.ceil(min * 300).toLocaleString()} px on the short side at 300
          DPI — exceeds 4K native. You&apos;ll likely need the upscale step.
        </p>
      )}
    </div>
  );
}
