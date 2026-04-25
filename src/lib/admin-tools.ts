import { Wand2, Sparkles, Cloud, type LucideIcon } from "lucide-react";

export interface AdminTool {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  /** Thumbnail image shown on the Tools tab grid. 2:1 aspect SVG in /public. */
  image: string;
  /** Tailwind color class name stem (e.g. "teal", "amber") */
  accent: "teal" | "amber" | "sky" | "emerald" | "rose" | "indigo";
  poweredBy?: string;
}

/** Registry of admin tools — consumed by both the admin Tools tab and the cross-tool nav. */
export const ADMIN_TOOLS: AdminTool[] = [
  {
    id: "background-remover",
    label: "Background Remover",
    href: "/admin/background-remover",
    description:
      "Upload a product shot or customer artwork and get a transparent PNG back.",
    icon: Wand2,
    image: "/admin/tools/background-remover.svg",
    accent: "teal",
    poweredBy: "remove.bg",
  },
  {
    id: "image-studio",
    label: "Image Studio",
    href: "/admin/image-studio",
    description:
      "Generate artwork from prompts or edit existing images. Gemini 2.5 Flash Image (Nano Banana).",
    icon: Sparkles,
    image: "/admin/tools/image-studio.svg",
    accent: "amber",
    poweredBy: "Google Gemini",
  },
  {
    id: "dropbox-auth",
    label: "Dropbox Hot Folder",
    href: "/admin/dropbox-auth",
    description:
      "One-time OAuth setup so the Image Studio can ship finished files to a Dropbox folder for the RIP machine.",
    icon: Cloud,
    image: "/admin/tools/dropbox-auth.svg",
    accent: "sky",
    poweredBy: "Dropbox",
  },
];

/** Map of accent → Tailwind classes, pre-built so JIT picks them up. */
export const ADMIN_TOOL_ACCENT_CLASSES: Record<
  AdminTool["accent"],
  {
    bg: string;
    bgHover: string;
    text: string;
    textDark: string;
    border: string;
    activeBg: string;
    activeText: string;
  }
> = {
  teal: {
    bg: "bg-teal-500/10",
    bgHover: "group-hover:bg-teal-500/20",
    text: "text-teal-600",
    textDark: "dark:text-teal-400",
    border: "hover:border-teal-500/50",
    activeBg: "bg-teal-500/15",
    activeText: "text-teal-600 dark:text-teal-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    bgHover: "group-hover:bg-amber-500/20",
    text: "text-amber-600",
    textDark: "dark:text-amber-400",
    border: "hover:border-amber-500/50",
    activeBg: "bg-amber-500/15",
    activeText: "text-amber-600 dark:text-amber-400",
  },
  sky: {
    bg: "bg-sky-500/10",
    bgHover: "group-hover:bg-sky-500/20",
    text: "text-sky-600",
    textDark: "dark:text-sky-400",
    border: "hover:border-sky-500/50",
    activeBg: "bg-sky-500/15",
    activeText: "text-sky-600 dark:text-sky-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    bgHover: "group-hover:bg-emerald-500/20",
    text: "text-emerald-600",
    textDark: "dark:text-emerald-400",
    border: "hover:border-emerald-500/50",
    activeBg: "bg-emerald-500/15",
    activeText: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    bgHover: "group-hover:bg-rose-500/20",
    text: "text-rose-600",
    textDark: "dark:text-rose-400",
    border: "hover:border-rose-500/50",
    activeBg: "bg-rose-500/15",
    activeText: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    bgHover: "group-hover:bg-indigo-500/20",
    text: "text-indigo-600",
    textDark: "dark:text-indigo-400",
    border: "hover:border-indigo-500/50",
    activeBg: "bg-indigo-500/15",
    activeText: "text-indigo-600 dark:text-indigo-400",
  },
};
