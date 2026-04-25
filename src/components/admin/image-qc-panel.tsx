"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QCCheck, QCResult } from "@/lib/qc/types";

interface ImageQCPanelProps {
  qc: QCResult | null;
  /** Show "Upscale to print-ready" CTA when DPI fails. */
  onUpscale?: () => void;
  upscaleAvailable?: boolean;
  upscaling?: boolean;
}

const STATUS_STYLES: Record<
  QCCheck["status"],
  { Icon: typeof CheckCircle2; color: string; bg: string; border: string }
> = {
  pass: {
    Icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
  },
  warn: {
    Icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  fail: {
    Icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  info: {
    Icon: Info,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
  },
};

export function ImageQCPanel({
  qc,
  onUpscale,
  upscaleAvailable,
  upscaling,
}: ImageQCPanelProps) {
  const [open, setOpen] = useState(true);

  if (!qc) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          QC data unavailable for this image.
        </CardContent>
      </Card>
    );
  }

  const failed = qc.checks.filter((c) => c.status === "fail").length;
  const warned = qc.checks.filter((c) => c.status === "warn").length;
  const passed = qc.checks.filter((c) => c.status === "pass").length;

  const headlineStatus: QCCheck["status"] =
    failed > 0 ? "fail" : warned > 0 ? "warn" : "pass";
  const Headline = STATUS_STYLES[headlineStatus];

  const dpiCheck = qc.checks.find((c) => c.id === "effective-dpi");
  const showUpscale = !!onUpscale && (dpiCheck?.status === "fail" || qc.effectiveDpi < 300);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-3 text-left"
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <Headline.Icon className={cn("h-5 w-5", Headline.color)} />
          Quality Control
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {passed} pass · {warned} warn · {failed} fail
          </span>
        </CardTitle>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <CardContent className="space-y-2 border-t border-border pt-4">
          {qc.checks.map((c) => (
            <QCRow key={c.id} check={c} />
          ))}

          {showUpscale && onUpscale && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Below 300 DPI for the selected print size.</p>
                  <p className="mt-0.5 text-xs">
                    Upscale with Real-ESRGAN to reach print-ready resolution. Adds ~$0.012/image.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onUpscale}
                disabled={!upscaleAvailable || upscaling}
                className={cn(
                  "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  "bg-amber-600 text-white hover:bg-amber-700",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {upscaling ? "Upscaling…" : "Upscale to Print-Ready"}
              </button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function QCRow({ check }: { check: QCCheck }) {
  const style = STATUS_STYLES[check.status];
  const { Icon } = style;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
        style.border,
        style.bg
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {check.label}
            <span title={check.help} className="cursor-help text-muted-foreground/60">
              <HelpCircle className="h-3 w-3" />
            </span>
          </span>
          <span className={cn("text-xs font-medium tabular-nums", style.color)}>
            {check.value}
          </span>
        </div>
        {check.detail && (
          <p className={cn("mt-0.5 text-xs", style.color)}>{check.detail}</p>
        )}
      </div>
    </div>
  );
}
