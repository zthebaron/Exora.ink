"use client";

import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type GenerationTier = "preview" | "production";

interface TierToggleProps {
  tier: GenerationTier;
  onChange: (tier: GenerationTier) => void;
  disabled?: boolean;
}

export function TierToggle({ tier, onChange, disabled }: TierToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TierCard
        active={tier === "preview"}
        onClick={() => !disabled && onChange("preview")}
        Icon={Zap}
        label="Preview"
        sub="1K · ~$0.04"
        accent="teal"
        description="gemini-2.5-flash-image"
        disabled={disabled}
      />
      <TierCard
        active={tier === "production"}
        onClick={() => !disabled && onChange("production")}
        Icon={Sparkles}
        label="Production"
        sub="4K · ~$0.24"
        accent="amber"
        description="Nano Banana Pro"
        disabled={disabled}
      />
    </div>
  );
}

function TierCard({
  active,
  onClick,
  Icon,
  label,
  sub,
  accent,
  description,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Zap;
  label: string;
  sub: string;
  accent: "teal" | "amber";
  description: string;
  disabled?: boolean;
}) {
  const accentClasses =
    accent === "amber"
      ? {
          activeBorder: "border-amber-500/60",
          activeBg: "bg-amber-500/10",
          activeText: "text-amber-600 dark:text-amber-400",
          icon: "text-amber-500",
        }
      : {
          activeBorder: "border-teal-500/60",
          activeBg: "bg-teal-500/10",
          activeText: "text-teal-600 dark:text-teal-400",
          icon: "text-teal-500",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
        active
          ? cn(accentClasses.activeBorder, accentClasses.activeBg, "shadow-sm")
          : "border-border bg-card hover:border-primary/30",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold",
            active ? accentClasses.activeText : "text-foreground"
          )}
        >
          <Icon className={cn("h-4 w-4", active && accentClasses.icon)} />
          {label}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{description}</span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          active ? accentClasses.activeText : "text-muted-foreground"
        )}
      >
        {sub}
      </span>
    </button>
  );
}
