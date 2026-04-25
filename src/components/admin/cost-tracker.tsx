"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CostSummary } from "@/app/api/image-studio/cost/route";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

interface CostTrackerProps {
  /**
   * Bumped by the parent every time a new generation completes — triggers
   * the tracker to re-fetch.
   */
  refreshKey?: number;
}

export function CostTracker({ refreshKey = 0 }: CostTrackerProps) {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/image-studio/cost", { cache: "no-store" });
      if (res.ok) setSummary((await res.json()) as CostSummary);
    } catch {
      // ignore — leave previous summary in place
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Generation Spend
          </span>
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Refresh cost"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Today */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Today</span>
            <span className="text-lg font-bold tabular-nums">
              {summary ? fmt(summary.todayUsd) : "—"}
            </span>
          </div>
          {summary && summary.todayCount > 0 && (
            <BreakdownRow breakdown={summary.todayBreakdown} count={summary.todayCount} />
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Month */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">This Month</span>
            <span className="text-lg font-bold tabular-nums">
              {summary ? fmt(summary.monthUsd) : "—"}
            </span>
          </div>
          {summary && summary.monthCount > 0 && (
            <BreakdownRow breakdown={summary.monthBreakdown} count={summary.monthCount} />
          )}
        </div>

        {summary && summary.monthCount === 0 && (
          <p className="text-xs italic text-muted-foreground">No generations yet this month.</p>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  breakdown,
  count,
}: {
  breakdown: { preview: number; production: number; upscale: number };
  count: number;
}) {
  return (
    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      <div className="flex justify-between">
        <span>Preview</span>
        <span className="tabular-nums">{fmt(breakdown.preview)}</span>
      </div>
      <div className="flex justify-between">
        <span>Production</span>
        <span className="tabular-nums">{fmt(breakdown.production)}</span>
      </div>
      <div className="flex justify-between">
        <span>Upscale</span>
        <span className="tabular-nums">{fmt(breakdown.upscale)}</span>
      </div>
      <div className="flex justify-between border-t border-border/50 pt-0.5 text-[11px]">
        <span>{count} generations</span>
      </div>
    </div>
  );
}
