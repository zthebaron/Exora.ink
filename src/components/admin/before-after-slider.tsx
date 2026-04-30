"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Download, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  /** Title shown in the modal header. */
  title?: string;
  /** Subtitle / source-file label. */
  subtitle?: string;
  /** Hooks for the action buttons. Omitting hides them. */
  onDownload?: () => void;
  onClose: () => void;
}

/**
 * Modal with a draggable vertical slider that reveals the "after" image
 * over the "before" image. Track the cursor anywhere over the image, or
 * click and drag the centered handle. Touch-friendly.
 *
 * Layout: original (before) is the base layer. The enhanced (after) is
 * stacked on top, clipped to show only the right portion past the
 * slider position. Drag the handle LEFT to reveal more of the after.
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  title = "Before / After",
  subtitle,
  onDownload,
  onClose,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // 0..100
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  // Mouse: track when dragging, OR continuously when hovering (operator
  // can just sweep the cursor across without holding the button).
  const handleMouseMove = (e: React.MouseEvent) => {
    updateFromClientX(e.clientX);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateFromClientX(e.clientX);
  };
  // Touch: must drag (no hover on touch).
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
  };

  // Global mouseup — handle releases outside the container.
  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 2));
      else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 2));
      else if (e.key === "0") setPos(0);
      else if (e.key === "5") setPos(50);
      else if (e.key === "1") setPos(100);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full max-h-[95vh] w-full max-w-[95vw] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-2 text-white">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-sm font-medium">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPos(50)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
              title="Reset to 50%"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              50%
            </button>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" />
                Download enhanced
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Slider canvas */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={cn(
            "relative flex-1 select-none overflow-hidden",
            dragging ? "cursor-grabbing" : "cursor-ew-resize"
          )}
        >
          {/* Before (base layer) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeUrl}
            alt="Original"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-contain"
          />
          {/* After (clipped overlay) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterUrl}
            alt="Enhanced"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          />

          {/* Slider line + handle */}
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: `calc(${pos}% - 1px)` }}
          >
            <div className="h-full w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
            <div
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl ring-2 ring-black/10"
              aria-hidden
            >
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </div>

          {/* Side labels */}
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Original
          </div>
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-emerald-500/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Enhanced
          </div>

          {/* Position readout (bottom center) */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] tracking-wider text-white/80">
            {pos.toFixed(0)}% · ← → / 0 5 1 / Esc
          </div>
        </div>
      </div>
    </div>
  );
}
