"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Cloud,
  ClipboardList,
  Eraser,
  Flame,
  Sparkles,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowInfographic } from "@/components/workflow/flow-infographic";
import { MermaidDiagram } from "@/components/workflow/mermaid-diagram";

const MERMAID_GRAPH = `flowchart TB
  classDef intake fill:#0D948822,stroke:#0D9488,color:#cbd5e1;
  classDef design fill:#F59E0B22,stroke:#F59E0B,color:#cbd5e1;
  classDef key fill:#F43F5E22,stroke:#F43F5E,color:#cbd5e1;
  classDef qc fill:#0EA5E922,stroke:#0EA5E9,color:#cbd5e1;
  classDef ship fill:#10B98122,stroke:#10B981,color:#cbd5e1;
  classDef fail fill:#dc262633,stroke:#dc2626,color:#fecaca;

  Start([Order request])
  Start --> Source{Source?}
  Source -->|Website| WP[exora.ink<br/>WooCommerce]
  Source -->|Phone / email / walk-in| Manual[Custom order intake<br/>Auto-numbered C-NNNN]
  WP --> OrdDash[Orders Dashboard<br/>read-only mirror]
  Manual --> CustDash[Custom Orders Dashboard<br/>full CRUD]
  OrdDash & CustDash --> Triage{Customer art?}
  Triage -->|Yes| Upload[Upload customer file]
  Triage -->|No, generate| ImgStudio[Image Studio<br/>Preview tier ~$0.04]
  Upload --> BgRemove[Background Remover<br/>remove.bg API]
  ImgStudio --> Promote{Approved?}
  Promote -->|Iterate| ImgStudio
  Promote -->|Lock| Production[Production tier 4K ~$0.24<br/>Nano Banana Pro]
  Production --> KeyOut[Key out magenta #FF00FF<br/>server-side sharp]
  BgRemove --> QC[QC engine: 7 checks]
  KeyOut --> QC
  QC --> Effective{Effective DPI<br/>≥ 300 at print size?}
  Effective -->|No| Upscale[Real-ESRGAN upscale<br/>via Replicate]
  Upscale --> QC
  Effective -->|Yes| Halo[Mandatory halo<br/>inspection checkbox]
  Halo --> ShipChoice{Where to?}
  ShipChoice -->|Local| Download[Download PNG]
  ShipChoice -->|RIP machine| HotFolder[Dropbox hot folder<br/>/Apps/Exora-RIP/hot]
  Download & HotFolder --> RIP[RIP software<br/>color-manage + nest]
  RIP --> Print[Mimaki TxF300-75<br/>30&quot; wide DTF print]
  Print --> Powder[White powder + cure]
  Powder --> Press[Heat press<br/>300°F · 12s · firm]
  Press --> Inspect[Final inspection]
  Inspect --> Done([Ship or pickup])

  class WP,Manual,OrdDash,CustDash intake;
  class ImgStudio,Production,Upload,BgRemove design;
  class KeyOut key;
  class QC,Effective,Upscale,Halo qc;
  class HotFolder,Download,RIP,Print,Powder,Press,Inspect,Done ship;
`;

const STAGES = [
  {
    n: "01",
    title: "Intake",
    color: "teal",
    icon: ClipboardList,
    body:
      "Orders come in two ways. Website orders flow from exora.ink via the WooCommerce REST API into the Orders Dashboard. Manual orders (phone, email, walk-in, invoiced clients) go into the Custom Orders Dashboard with auto-generated C-NNNN numbers and full CRUD. Both share the same status vocabulary so operators have one mental model.",
    tools: ["exora.ink (WooCommerce)", "Custom Orders dashboard", "WP Application Password auth"],
  },
  {
    n: "02",
    title: "Design Prep",
    color: "amber",
    icon: Sparkles,
    body:
      "Either start from customer-supplied art (uploaded directly) or generate from scratch in the Image Studio with Gemini Nano Banana. The Image Studio has two tiers: Preview ($0.04, 1K) for iterating on prompt and composition, and Production ($0.24, 4K) for the locked version. A magenta #FF00FF chroma-key background is enforced by every prompt — no transparent-PNG halos.",
    tools: ["Image Studio · Gemini 2.5 Flash Image", "Production · Gemini 3 Pro Image (4K)", "Background Remover · remove.bg"],
  },
  {
    n: "03",
    title: "Key Out Magenta",
    color: "rose",
    icon: Eraser,
    body:
      "Server-side sharp pipeline walks every pixel and converts anything within tolerance of #FF00FF to fully transparent. Tight tolerance (24/255) prevents eating into hot-pink elements. Output is a real transparent PNG — no anti-aliased fringe to print as a white halo on dark garments.",
    tools: ["sharp (raw RGBA pixel walk)", "Tolerance: 24/255 per channel"],
  },
  {
    n: "04",
    title: "QC + Halo Inspection",
    color: "sky",
    icon: CheckCircle2,
    body:
      "Every result runs through 7 automated checks: pixel dimensions, effective DPI at the selected print size, metadata DPI (cosmetic), transparency, RGB color mode, edge bleed, file size. If effective DPI is below 300 at the chosen print size, the Real-ESRGAN upscale button appears. The operator must tick a HALO INSPECTION REQUIRED checkbox before download/ship to confirm there's no edge fringe that'll print as a white halo.",
    tools: ["QC engine (sharp + exifr)", "Real-ESRGAN via Replicate (~$0.006–0.012)", "Halo inspection gate"],
  },
  {
    n: "05",
    title: "Handoff",
    color: "sky",
    icon: Cloud,
    body:
      "Two ship paths. Local download for one-off jobs. Send to Hot Folder uploads the print-ready PNG to a configured Dropbox folder (/Apps/Exora-RIP/hot) where the RIP machine watches for new files. Dropbox auth uses a long-lived OAuth refresh token so the connection survives indefinitely.",
    tools: ["Dropbox API · refresh token OAuth", "Hot folder: /Apps/Exora-RIP/hot", "Auto-share-link generation"],
  },
  {
    n: "06",
    title: "RIP, Print, Press",
    color: "emerald",
    icon: Flame,
    body:
      "RIP software color-manages and nests for material efficiency. The Mimaki TxF300-75 prints onto 30\" × 325ft DTF film — 36% more printable area per linear foot than competing 22\" transfer houses. White ink underbase + adhesive powder cure. Hotronix Dual Air Fusion presses at 300°F for 12s with firm pressure. Final visual inspection, then ship or pickup.",
    tools: ["Mimaki TxF300-75 · 30\" wide", "Hotronix Dual Air Fusion ProPlace IQ", "300 °F · 12s · firm"],
  },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; ring: string; chip: string }> = {
  teal: {
    bg: "bg-teal-500/15",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-500/30",
    ring: "ring-teal-500/30",
    chip: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
  amber: {
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    ring: "ring-amber-500/30",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/30",
    ring: "ring-rose-500/30",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  sky: {
    bg: "bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/30",
    ring: "ring-sky-500/30",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/30",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export default function WorkflowPage() {
  const [view, setView] = useState<"infographic" | "graph">("infographic");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <WorkflowIcon className="h-3 w-3" />
            The Flow
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            From order to garment
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
            How Exora.ink moves a job through every stage — from intake all the way to a finished
            garment. Two formats: a polished infographic for the bird&apos;s-eye view, and a detailed
            flowchart with every system and decision point.
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setView("infographic")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                view === "infographic"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Infographic
            </button>
            <button
              type="button"
              onClick={() => setView("graph")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                view === "graph"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Detailed Graph
            </button>
          </div>
        </div>

        {/* Active view */}
        <div className="mb-12">
          {view === "infographic" ? (
            <FlowInfographic />
          ) : (
            <Card className="overflow-x-auto">
              <CardContent className="py-6">
                <MermaidDiagram source={MERMAID_GRAPH} className="mx-auto max-w-full" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stage breakdown */}
        <div className="mb-10">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Stage by stage
          </h2>
          <p className="text-muted-foreground">
            Each stage in plain English, with the systems and tools that drive it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STAGES.map((s) => {
            const c = COLOR_CLASSES[s.color];
            const Icon = s.icon;
            return (
              <Card
                key={s.n}
                className={cn(
                  "overflow-hidden border-2 transition-shadow hover:shadow-lg",
                  c.border
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", c.bg, c.text)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[10px] font-bold tracking-widest", c.text)}>
                        {s.n}
                      </p>
                      <CardTitle className="text-xl">{s.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tools.map((t) => (
                      <Badge
                        key={t}
                        className={cn("font-normal", c.chip)}
                        variant="outline"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing summary */}
        <Card className="mt-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Pricing tiers (Press Service)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Print-and-Press service is anchored to the screen-print market rate, with the discount
              scaling by color count. The customer always saves vs. screen print; we capture more of
              the color-count value gap as our revenue at higher color counts.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
                <p className="text-xs font-bold tracking-wide text-teal-700 dark:text-teal-400">
                  TIER A · PREMIUM
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">5–32%</p>
                <p className="text-xs text-muted-foreground">below screen print</p>
                <p className="mt-2 text-xs">Complex art · premium garments · precision placements</p>
              </div>
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-4">
                <p className="text-xs font-bold tracking-wide text-sky-700 dark:text-sky-400">
                  TIER B · COMPETITIVE
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">10–48%</p>
                <p className="text-xs text-muted-foreground">below screen print</p>
                <p className="mt-2 text-xs">Default for most jobs · balanced savings/margin</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-xs font-bold tracking-wide text-amber-700 dark:text-amber-400">
                  TIER C · VOLUME
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">15–58%</p>
                <p className="text-xs text-muted-foreground">below screen print</p>
                <p className="mt-2 text-xs">Win competitive bids · high-volume · price-sensitive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
