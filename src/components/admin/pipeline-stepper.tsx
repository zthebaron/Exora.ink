"use client";

import { Check, ChevronRight, Cloud, Download, Eraser, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStage =
  /** No result yet — operator is iterating on prompt at the Preview stage. */
  | "preview"
  /** Has a 1K preview but hasn't promoted to 4K yet. */
  | "preview-done"
  /** Has a 4K production result, magenta still in place. */
  | "production"
  /** Production result has been chroma-keyed (transparent PNG ready). */
  | "keyed"
  /** Final image has been shipped (downloaded or sent to hot folder). */
  | "shipped";

interface PipelineStepperProps {
  stage: PipelineStage;
  /** Current tier (for the active step indicator). */
  tier: "preview" | "production";
  onSelectStage?: (stage: "preview" | "production") => void;
}

const STEPS = [
  { id: "preview", label: "Preview", sub: "1K · ~$0.04", icon: Zap, accent: "teal" },
  { id: "production", label: "Production 4K", sub: "Nano Banana Pro", icon: Sparkles, accent: "amber" },
  { id: "keyed", label: "Key Magenta", sub: "Background remover", icon: Eraser, accent: "rose" },
  { id: "shipped", label: "Ship", sub: "Download or Hot Folder", icon: Cloud, accent: "emerald" },
] as const;

const ACCENTS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  teal: {
    bg: "bg-teal-500/15",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-500/40",
    ring: "ring-teal-500/30",
  },
  amber: {
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/40",
    ring: "ring-amber-500/30",
  },
  rose: {
    bg: "bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/40",
    ring: "ring-rose-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/30",
  },
};

/**
 * Map the high-level pipeline stage to: which step is "current" and which
 * earlier steps should be marked complete.
 */
function stageIndex(stage: PipelineStage, tier: "preview" | "production"): number {
  switch (stage) {
    case "preview":
      // Currently iterating — Preview step is active.
      return 0;
    case "preview-done":
      // Have a preview result but no production yet.
      // If tier is preview, we're "done" with step 0; if production, we're at step 1 wanting 4K.
      return tier === "production" ? 1 : 0;
    case "production":
      // Have a 4K result — Key step is next/current.
      return 2;
    case "keyed":
      // Keyed PNG ready — Ship step is current.
      return 3;
    case "shipped":
      // Done. All complete.
      return 4;
  }
}

export function PipelineStepper({ stage, tier, onSelectStage }: PipelineStepperProps) {
  const currentIdx = stageIndex(stage, tier);

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-border bg-card/60 p-2">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        const accent = ACCENTS[step.accent];
        const Icon = step.icon;

        const stepNumber = i + 1;
        const stepIsClickable =
          (step.id === "preview" || step.id === "production") && !!onSelectStage;
        const Tag = stepIsClickable ? "button" : "div";

        return (
          <li key={step.id} className="flex items-center gap-1">
            <Tag
              {...(stepIsClickable
                ? {
                    type: "button" as const,
                    onClick: () => onSelectStage?.(step.id as "preview" | "production"),
                  }
                : {})}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                isCurrent && cn(accent.bg, accent.text, "ring-1", accent.ring),
                isComplete && "text-emerald-700 dark:text-emerald-400",
                isFuture && "text-muted-foreground/60",
                stepIsClickable && "hover:bg-muted",
                !stepIsClickable && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold tabular-nums",
                  isComplete &&
                    "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                  isCurrent && cn(accent.border, accent.bg),
                  isFuture && "border-border"
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span className="flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                  <Icon className="h-3 w-3" />
                  {step.label}
                </span>
                <span className="text-[10px] leading-tight opacity-70">{step.sub}</span>
              </span>
            </Tag>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Re-export for convenience
export const PIPELINE_STEPS_ICONS = { Download };
