"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidDiagramProps {
  /** The mermaid source. */
  source: string;
  /** Optional className for the wrapper. */
  className?: string;
}

/**
 * Renders a Mermaid diagram client-side. Mermaid is dynamically imported
 * so the ~2MB lib only ships on pages that use this component. Re-renders
 * when the theme changes so dark/light mode look right.
 */
export function MermaidDiagram({ source, className }: MermaidDiagramProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = resolvedTheme === "dark";
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          themeVariables: {
            primaryColor: "#0D9488",
            primaryTextColor: isDark ? "#e2e8f0" : "#0F172A",
            primaryBorderColor: "#0D9488",
            lineColor: isDark ? "#475569" : "#94a3b8",
            secondaryColor: "#0EA5E9",
            tertiaryColor: "#F59E0B",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            fontSize: "13px",
          },
          flowchart: {
            curve: "basis",
            padding: 20,
            useMaxWidth: true,
          },
        });

        const { svg } = await mermaid.render(`mmd-${id}`, source);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme, id]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return <div ref={ref} className={className} aria-label="Workflow diagram" />;
}
