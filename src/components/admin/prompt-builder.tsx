"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wand2, ChevronDown } from "lucide-react";

const STYLES = [
  { value: "flat-bold", label: "Flat bold (vector-like)", prompt: "bold flat illustration in a vector style, hard edges, solid fills, no gradients" },
  { value: "vintage", label: "Vintage / distressed", prompt: "vintage screen-print aesthetic with subtle halftone texture and a weathered, distressed finish" },
  { value: "photo", label: "Photorealistic", prompt: "photorealistic rendering with natural lighting and realistic fabric textures" },
  { value: "line-art", label: "Line art", prompt: "clean line-art illustration, single weight, minimal fills" },
  { value: "halftone", label: "Halftone", prompt: "halftone dot pattern rendering in 2–3 colors" },
  { value: "retro-90s", label: "Retro 90s", prompt: "retro 90s skate graphic style, bold outlines, saturated colors, subtle drop shadow" },
  { value: "geometric", label: "Geometric / minimal", prompt: "minimalist geometric composition, strong shapes, flat color blocks" },
  { value: "watercolor", label: "Watercolor", prompt: "soft watercolor painting style with bleeding edges and warm washes" },
];

const PLACEMENTS = [
  { value: "none", label: "Not specified", sizeNote: "" },
  { value: "left-chest", label: "Left chest (3\" wide)", sizeNote: "sized to print at roughly 3 inches wide on the left chest" },
  { value: "right-chest", label: "Right chest (3\" wide)", sizeNote: "sized to print at roughly 3 inches wide on the right chest" },
  { value: "full-back", label: "Full back (12\")", sizeNote: "sized to print at roughly 12 inches wide as a full back design" },
  { value: "center-back", label: "Center back (10\")", sizeNote: "sized to print at roughly 10 inches wide centered on the back" },
  { value: "sleeve", label: "Sleeve (3\" × 12\")", sizeNote: "a narrow vertical composition suitable for a 3 inch by 12 inch sleeve print" },
  { value: "nape", label: "Nape / Back neck (2\" wide)", sizeNote: "a small 2 inch wide design for the nape of the neck" },
  { value: "pocket", label: "Pocket area (4\" × 4\")", sizeNote: "sized at roughly 4 by 4 inches for a pocket area print" },
];

const COLOR_COUNTS = [
  { value: "1", label: "1 color" },
  { value: "2", label: "2 colors" },
  { value: "3", label: "3 colors" },
  { value: "4-5", label: "4–5 colors" },
  { value: "6+", label: "6+ colors / full color" },
];

const GARMENT_COLORS = [
  { value: "dark", label: "Dark garment (black/navy)", prompt: "designed to be worn on a dark garment — use bold bright colors and include a white underbase concept where needed for opacity" },
  { value: "light", label: "Light garment (white/grey)", prompt: "designed to be worn on a light garment — darker line work and saturated colors read best" },
  { value: "either", label: "Works on either", prompt: "" },
];

interface PromptBuilderProps {
  mode: "generate" | "edit";
  onApply: (prompt: string) => void;
}

export function PromptBuilder({ mode, onApply }: PromptBuilderProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState(STYLES[0].value);
  const [placement, setPlacement] = useState(PLACEMENTS[0].value);
  const [colorCount, setColorCount] = useState(COLOR_COUNTS[1].value);
  const [garmentColor, setGarmentColor] = useState(GARMENT_COLORS[2].value);
  const [wordmark, setWordmark] = useState("");
  const [mustInclude, setMustInclude] = useState("");
  const [mustAvoid, setMustAvoid] = useState("");

  const builtPrompt = useMemo(() => {
    const lines: string[] = [];

    const styleObj = STYLES.find((s) => s.value === style);
    const placementObj = PLACEMENTS.find((p) => p.value === placement);
    const garmentObj = GARMENT_COLORS.find((g) => g.value === garmentColor);
    const colorObj = COLOR_COUNTS.find((c) => c.value === colorCount);

    const subjectText = subject.trim();
    const wordmarkText = wordmark.trim();

    if (mode === "generate") {
      // Opening line
      const opener = subjectText
        ? `A ${styleObj?.prompt ?? "bold flat"} design of ${subjectText}`
        : `A ${styleObj?.prompt ?? "bold flat"} design`;
      lines.push(opener + ".");

      if (wordmarkText) {
        lines.push(`Include the wordmark "${wordmarkText}" as part of the composition.`);
      }
      if (colorObj) {
        lines.push(`${colorObj.label}, crisp edges, suitable for DTF transfer printing.`);
      }
      if (placementObj && placementObj.sizeNote) {
        lines.push(`The design should be ${placementObj.sizeNote}.`);
      }
      if (garmentObj?.prompt) {
        lines.push(garmentObj.prompt + ".");
      }
    } else {
      // Edit mode — focus on the change
      const change = subjectText || "the described change";
      lines.push(`Apply the following edit to the source image(s): ${change}.`);

      if (styleObj && style !== STYLES[0].value) {
        lines.push(`Render the result in a ${styleObj.prompt} style.`);
      }
      if (colorObj && mode === "edit") {
        lines.push(`Target palette: ${colorObj.label}.`);
      }
      if (garmentObj?.prompt && garmentColor !== "either") {
        lines.push(garmentObj.prompt + ".");
      }
      lines.push("Preserve the composition, subject, and core colors of the source image(s) unless explicitly asked to change them.");
    }

    if (mustInclude.trim()) {
      lines.push(`Must include: ${mustInclude.trim()}.`);
    }
    if (mustAvoid.trim()) {
      lines.push(`Must NOT include: ${mustAvoid.trim()}.`);
    }

    return lines.join(" ");
  }, [mode, subject, style, placement, colorCount, garmentColor, wordmark, mustInclude, mustAvoid]);

  const canApply = subject.trim().length > 0 || wordmark.trim().length > 0;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Wand2 className="h-4 w-4 text-primary" />
          Prompt Builder
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <CardContent className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Fill in the parts you know — the rest will default smartly. Output is assembled below.
          </p>

          {/* Subject / change */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {mode === "generate" ? "Subject or concept" : "What should change?"}
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                mode === "generate"
                  ? "e.g. a snarling bulldog mascot wearing a letterman jacket"
                  : "e.g. change the shirt color to burgundy and sharpen the logo"
              }
            />
          </div>

          {/* Wordmark (generate only) */}
          {mode === "generate" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wordmark / text (optional)
              </label>
              <Input
                value={wordmark}
                onChange={(e) => setWordmark(e.target.value)}
                placeholder="e.g. EXORA, STAY RUGGED, DTF NATION"
              />
            </div>
          )}

          {/* Style + Placement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Style</label>
              <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Placement / size
              </label>
              <Select value={placement} onChange={(e) => setPlacement(e.target.value)}>
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Colors + Garment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Colors</label>
              <Select value={colorCount} onChange={(e) => setColorCount(e.target.value)}>
                {COLOR_COUNTS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Target garment
              </label>
              <Select value={garmentColor} onChange={(e) => setGarmentColor(e.target.value)}>
                {GARMENT_COLORS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Must include / avoid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Must include
              </label>
              <Input
                value={mustInclude}
                onChange={(e) => setMustInclude(e.target.value)}
                placeholder="e.g. American flag, est. 2019"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Must avoid
              </label>
              <Input
                value={mustAvoid}
                onChange={(e) => setMustAvoid(e.target.value)}
                placeholder="e.g. drop shadows, gradients, text"
              />
            </div>
          </div>

          {/* Preview + Apply */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Generated prompt
            </p>
            <p className="text-xs leading-relaxed text-foreground">{builtPrompt}</p>
          </div>

          <button
            type="button"
            onClick={() => onApply(builtPrompt)}
            disabled={!canApply}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <Wand2 className="h-4 w-4" />
            Use This Prompt
          </button>
        </CardContent>
      )}
    </Card>
  );
}
