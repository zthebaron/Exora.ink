"use client";

import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { ADMIN_TOOLS, ADMIN_TOOL_ACCENT_CLASSES } from "@/lib/admin-tools";
import { cn } from "@/lib/utils";

interface ToolsNavProps {
  /** The id of the current tool (matches AdminTool.id). */
  currentTool: string;
}

/**
 * Top navigation for admin tool pages. Shows a "Back to Tools" link and
 * pill buttons to jump to other tools. The active tool is highlighted.
 */
export function ToolsNav({ currentTool }: ToolsNavProps) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 p-2">
      <Link
        href="/admin?tab=tools"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <LayoutGrid className="h-3.5 w-3.5" />
        Tools
      </Link>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ul className="flex flex-1 flex-wrap items-center gap-1.5">
        {ADMIN_TOOLS.map((tool) => {
          const active = tool.id === currentTool;
          const accent = ADMIN_TOOL_ACCENT_CLASSES[tool.accent];
          const Icon = tool.icon;
          return (
            <li key={tool.id}>
              <Link
                href={tool.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? cn(accent.activeBg, accent.activeText)
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tool.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
