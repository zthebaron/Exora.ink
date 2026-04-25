"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, History, RefreshCw, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/app/api/image-studio/history/route";

interface PromptHistoryProps {
  /** Bumped whenever a new generation succeeds — triggers a refetch. */
  refreshKey?: number;
  /** Called when the operator clicks a history entry. */
  onApply: (prompt: string) => void;
}

const PREVIEW_LIMIT = 5;

/** Relative time: "just now", "12m ago", "3h ago", "2d ago", or full date. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, (Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 7 * 86_400) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function truncate(text: string, max = 90): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

export function PromptHistory({ refreshKey = 0, onApply }: PromptHistoryProps) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/image-studio/history", { cache: "no-store" });
      if (res.ok) {
        const data: { entries?: HistoryEntry[] } = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const visible = showAll ? entries : entries.slice(0, PREVIEW_LIMIT);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" />
          Prompt History
          {entries.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {entries.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <CardContent className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Click any past prompt to drop it into the textarea.
            </p>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              aria-label="Refresh history"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
              No history yet — generate something and it&apos;ll appear here.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                {visible.map((e) => (
                  <button
                    key={e.prompt}
                    type="button"
                    onClick={() => onApply(e.prompt)}
                    title={e.prompt}
                    className="group flex w-full flex-col gap-1 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="text-xs leading-snug text-foreground">
                      {truncate(e.prompt)}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {e.bestTier === "production" ? (
                          <Sparkles className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Zap className="h-3 w-3 text-teal-500" />
                        )}
                        <span className="font-medium uppercase">{e.bestTier}</span>
                        {e.count > 1 && <span className="tabular-nums">· {e.count}×</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="tabular-nums">${e.totalCostUsd.toFixed(2)}</span>
                        <span>·</span>
                        <span>{relativeTime(e.lastUsed)}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {entries.length > PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full rounded-md border border-dashed border-border py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showAll
                    ? "Show fewer"
                    : `Show ${entries.length - PREVIEW_LIMIT} more`}
                </button>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
