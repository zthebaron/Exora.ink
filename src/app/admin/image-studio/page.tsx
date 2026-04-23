"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, ImageIcon, Loader2, Sparkles, Trash2, Upload, Wand2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getImageMetadata,
  formatBytes,
  formatDpi,
  formatPrintSize,
  type ImageMetadata,
} from "@/lib/image-metadata";
import { ToolsNav } from "@/components/admin/tools-nav";

type Mode = "generate" | "edit";

interface PresetGroup {
  label: string;
  presets: { label: string; prompt: string }[];
}

const GENERATE_PRESETS: PresetGroup[] = [
  {
    label: "DTF Artwork",
    presets: [
      {
        label: "DTF transfer on dark garment",
        prompt:
          "A DTF transfer-ready artwork designed to print on a dark garment: bold colors with high contrast, crisp edges, a solid white underbase layer built into the design, and a fully solid #FF00FF magenta background (PNG). The design should read clearly at roughly 10 inches wide. Flat illustration style, vector-like, no photo realism, no drop shadow, no bounding box.",
      },
      {
        label: "Vintage distressed logo",
        prompt:
          "A vintage-style distressed logo with halftone dots and a hand-drawn screen-print texture. Bold sans-serif wordmark, 2–3 colors, solid #FF00FF magenta background, suitable for a DTF chest or back print.",
      },
      {
        label: "Mascot for back print",
        prompt:
          "A cartoon mascot (bulldog, eagle, or lion — pick one) in full color, suitable for a 10-inch full-back DTF print. Bold outlines, flat shading, solid #FF00FF magenta background, no text.",
      },
      {
        label: "Left chest wordmark (3 inch)",
        prompt:
          "A clean, minimal wordmark designed for a 3-inch left chest DTF print. Two colors max, strong geometry, legible at small size, solid #FF00FF magenta background.",
      },
      {
        label: "Sleeve hit design",
        prompt:
          "A narrow vertical design suitable for a 3\" × 12\" sleeve hit DTF transfer. Stylized text and a small decorative motif, reads top-to-bottom, solid #FF00FF magenta background.",
      },
    ],
  },
  {
    label: "Mockups & Marketing",
    presets: [
      {
        label: "Photo mockup of customer shirt",
        prompt:
          "A photorealistic product shot of a navy crewneck t-shirt laid flat on a neutral concrete surface, soft daylight from the upper left, a 3-inch left-chest logo and a 10-inch center back print visible. Commercial apparel catalog style.",
      },
      {
        label: "Hanger mockup (dark shirt)",
        prompt:
          "A photorealistic mockup of a black heavyweight t-shirt on a wooden hanger against a clean off-white wall. A bold white DTF logo is printed on the chest. Studio lighting, shallow depth of field, apparel brand photography.",
      },
      {
        label: "Athletic fabric mockup",
        prompt:
          "A photorealistic athletic performance shirt (Under Armour style) in midnight navy, front view, showing a subtle left-chest logo printed via DTF. Moisture-wicking texture visible, sport catalog lighting.",
      },
      {
        label: "Blog hero — DTF process",
        prompt:
          "A wide cinematic hero image of a DTF printer mid-print: white ink being laid down on dark transfer film, vivid teal accent light, shallow depth of field, editorial magazine quality. 16:9 composition.",
      },
      {
        label: "Hoodie back print mockup",
        prompt:
          "A photorealistic heather grey pullover hoodie hanging on a wall, shot from behind to show a 12-inch full-color DTF back print. Editorial apparel photography, soft natural light.",
      },
    ],
  },
  {
    label: "Patterns & Backgrounds",
    presets: [
      {
        label: "Seamless halftone pattern",
        prompt:
          "A seamless repeating halftone dot pattern in two colors (navy and white), perfectly tileable, subtle gradient variance, suitable as a background for a DTF design.",
      },
      {
        label: "DTF shop landing hero",
        prompt:
          "A clean modern hero background for a DTF print shop website: subtle gradient from deep teal to near-black, soft bokeh of ink droplets on the right third, minimal, professional. 1920x1080.",
      },
    ],
  },
];

const EDIT_PRESETS: PresetGroup[] = [
  {
    label: "DTF Prep",
    presets: [
      { label: "Replace background with magenta", prompt: "Replace the background completely with solid pure magenta #FF00FF. Preserve the foreground artwork edges exactly. Do not change foreground colors. Do not add a drop shadow. Ensure no edge fringe, glow, or semi-transparent halo against the magenta." },
      { label: "Add white underbase", prompt: "Prepare this artwork for DTF printing on a dark garment by adding a solid white underbase layer behind all colored elements, slightly inset by 1px so it doesn't show around the edges. Keep the foreground artwork identical. Output PNG with transparency." },
      { label: "Convert to 2-color", prompt: "Reduce this design to exactly 2 flat colors (black and white), preserving shapes and key details. Remove gradients, halftones, and soft shading. Output as a flat magenta-backgrounded image ready for 2-color DTF." },
      { label: "Vectorize look", prompt: "Redraw this raster image in a clean flat vector style: hard edges, solid fills, no noise, no gradients. Preserve the composition and colors. Output as a flat magenta-backgrounded image suitable for DTF transfer." },
      { label: "Sharpen & upscale", prompt: "Upscale and sharpen this artwork to look crisp at 10 inches wide at 300 DPI. Preserve the original colors and composition exactly. Remove any noise or JPEG artifacts." },
    ],
  },
  {
    label: "Color & Style",
    presets: [
      { label: "Swap shirt color", prompt: "Change the shirt color in this image to burgundy. Keep the artwork printed on it identical in every other way. Keep the fabric texture and lighting natural." },
      { label: "Add vintage texture", prompt: "Apply a subtle vintage distressed texture to the artwork, like a well-worn screen-printed tee. Do not change the shapes or colors significantly — just age the surface." },
      { label: "Recolor to brand palette", prompt: "Recolor this design using only these three colors: teal (#0D9488), amber (#F59E0B), and off-white (#F8FAFC). Preserve the composition exactly." },
    ],
  },
  {
    label: "Composition",
    presets: [
      { label: "Place logo on shirt", prompt: "Take the logo from the first uploaded image and place it as a 3-inch left-chest print on the shirt in the second uploaded image. Preserve the garment color and lighting. Output a photorealistic mockup." },
      { label: "Isolate the graphic", prompt: "Isolate just the graphic element from this image — remove the text and any background. Output the graphic on a flat magenta-backgrounded image." },
      { label: "Add subtle brand mark", prompt: "Add a small, subtle brand wordmark reading 'EXORA' at the bottom-right corner of the artwork. Use a matching color that complements the existing palette. Keep it understated." },
    ],
  },
];

export default function ImageStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [sourceMetas, setSourceMetas] = useState<(ImageMetadata | null)[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultMeta, setResultMeta] = useState<ImageMetadata | null>(null);
  const [modelText, setModelText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [haloInspected, setHaloInspected] = useState(false);

  const accept = useMemo(() => "image/png,image/jpeg,image/webp", []);

  const revokeAll = useCallback(() => {
    sourceUrls.forEach((u) => URL.revokeObjectURL(u));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [sourceUrls, resultUrl]);

  const reset = useCallback(() => {
    revokeAll();
    setPrompt("");
    setSourceFiles([]);
    setSourceUrls([]);
    setSourceMetas([]);
    setResultUrl(null);
    setResultBlob(null);
    setResultMeta(null);
    setModelText("");
    setError(null);
    setHaloInspected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [revokeAll]);

  const addFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!files) return;
      const incoming = Array.from(files);
      const accepted: File[] = [];
      for (const f of incoming) {
        if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
          setError(`"${f.name}" is not a supported image type.`);
          continue;
        }
        if (f.size > 12 * 1024 * 1024) {
          setError(`"${f.name}" is larger than 12MB.`);
          continue;
        }
        accepted.push(f);
      }
      if (accepted.length === 0) return;
      setError(null);
      const urls = accepted.map((f) => URL.createObjectURL(f));
      setSourceFiles((prev) => [...prev, ...accepted]);
      setSourceUrls((prev) => [...prev, ...urls]);
      setSourceMetas((prev) => [...prev, ...accepted.map(() => null)]);
      // Fetch metadata for each
      accepted.forEach((f, i) => {
        const insertIndex = sourceFiles.length + i;
        getImageMetadata(f)
          .then((meta) => {
            setSourceMetas((prev) => {
              const next = [...prev];
              next[insertIndex] = meta;
              return next;
            });
          })
          .catch(() => {});
      });
    },
    [sourceFiles.length]
  );

  const removeSource = useCallback(
    (index: number) => {
      setSourceUrls((prev) => {
        const url = prev[index];
        if (url) URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
      setSourceFiles((prev) => prev.filter((_, i) => i !== index));
      setSourceMetas((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  const generate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Enter a prompt first.");
      return;
    }
    if (mode === "edit" && sourceFiles.length === 0) {
      setError("Upload at least one source image for edit mode.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("mode", mode);
      body.append("prompt", prompt);
      if (mode === "edit") {
        sourceFiles.forEach((f) => body.append("image", f));
      }

      const res = await fetch("/api/image-studio", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setResultMeta(null);
      setHaloInspected(false); // fresh result — operator must re-inspect
      getImageMetadata(blob)
        .then(setResultMeta)
        .catch(() => setResultMeta(null));
      const encodedText = res.headers.get("X-Model-Text");
      setModelText(encodedText ? decodeURIComponent(encodedText) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  }, [mode, prompt, sourceFiles, resultUrl]);

  const download = useCallback(() => {
    if (!resultBlob) return;
    if (!haloInspected) {
      setError("Confirm the halo inspection checkbox before downloading.");
      return;
    }
    const baseName =
      mode === "edit" && sourceFiles[0]
        ? sourceFiles[0].name.replace(/\.[^.]+$/, "") + "-edited"
        : "nanobanana-" + Date.now();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(resultBlob);
    a.download = `${baseName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, [resultBlob, mode, sourceFiles, haloInspected]);

  const presetGroups = mode === "generate" ? GENERATE_PRESETS : EDIT_PRESETS;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="image-studio" />

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              Nano Banana · Gemini 2.5 Flash Image
            </div>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Image Studio
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Generate new artwork from prompts or edit existing images with Google&apos;s Gemini image model.
            Ideal for mocking up DTF transfers, iterating on customer concepts, and producing blog hero images.
          </p>
        </div>

        <Tabs
          defaultValue="generate"
          onValueChange={(v) => {
            setMode(v as Mode);
            setError(null);
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="edit">Edit / Remix</TabsTrigger>
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Controls */}
            <div className="space-y-6">
              <TabsContent value="edit" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Source Image(s)</CardTitle>
                    <CardDescription>Upload one or more images to edit or combine.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sourceFiles.length === 0 ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          addFiles(e.dataTransfer.files);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
                          dragOver
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/60 hover:bg-muted/50"
                        )}
                      >
                        <div className="rounded-full bg-primary/10 p-3 text-primary">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Drop image(s) or click
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — 12MB each</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-2">
                          {sourceFiles.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sourceUrls[i]}
                                alt={f.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-foreground">
                                  {f.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {sourceMetas[i]
                                    ? `${sourceMetas[i]!.width}×${sourceMetas[i]!.height} · ${formatBytes(f.size)}`
                                    : formatBytes(f.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSource(i)}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Remove"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          + Add another image
                        </button>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={accept}
                      multiple
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <Card>
                <CardHeader>
                  <CardTitle>Prompt</CardTitle>
                  <CardDescription>
                    {mode === "generate"
                      ? "Describe the image you want Nano Banana to create."
                      : "Describe the changes you want made to the source image(s)."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    placeholder={
                      mode === "generate"
                        ? "A bold vintage-style 'DTF NATION' text logo with halftone dots..."
                        : "Replace the background with solid #FF00FF magenta and keep the logo identical..."
                    }
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{prompt.length}/4000</span>
                    {prompt && (
                      <button
                        type="button"
                        onClick={() => setPrompt("")}
                        className="hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Presets</p>
                    {presetGroups.map((group) => (
                      <details key={group.label} className="group rounded-md border border-border bg-card" open>
                        <summary className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-foreground">
                          <span>{group.label}</span>
                          <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                        </summary>
                        <div className="space-y-1 border-t border-border p-1.5">
                          {group.presets.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setPrompt(p.prompt)}
                              title={p.prompt}
                              className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-2 p-4">
                  <button
                    onClick={generate}
                    disabled={loading || !prompt.trim() || (mode === "edit" && sourceFiles.length === 0)}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        {mode === "generate" ? "Generate Image" : "Apply Edit"}
                      </>
                    )}
                  </button>

                  {resultBlob && (
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors",
                        haloInspected
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-amber-500/40 bg-amber-500/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={haloInspected}
                        onChange={(e) => setHaloInspected(e.target.checked)}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600"
                      />
                      <span className="flex-1 leading-snug">
                        <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          HALO INSPECTION REQUIRED
                        </span>
                        <span className="mt-0.5 block text-muted-foreground">
                          I have inspected the result at full zoom. Any visible fringe, glow, or
                          semi-transparent pixels around the edges will create a white halo artifact
                          when printed on dark garments.
                        </span>
                      </span>
                    </label>
                  )}

                  <button
                    onClick={download}
                    disabled={!resultBlob || !haloInspected}
                    title={
                      !resultBlob
                        ? "Generate an image first"
                        : !haloInspected
                        ? "Confirm halo inspection before downloading"
                        : undefined
                    }
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors",
                      "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <Download className="h-4 w-4" />
                    Download Result
                  </button>

                  <button
                    onClick={reset}
                    disabled={!prompt && sourceFiles.length === 0 && !resultUrl}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
                      "hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Everything
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="checkerboard relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-lg border border-border">
                    {resultUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultUrl}
                        alt="Generated"
                        className="max-h-[620px] max-w-full object-contain"
                      />
                    ) : loading ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Nano Banana is working…</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-sm">
                          {mode === "generate"
                            ? "Enter a prompt and click Generate"
                            : "Upload a source image and enter a prompt"}
                        </span>
                      </div>
                    )}
                  </div>

                  {resultMeta && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-4">
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <dt className="text-muted-foreground">Resolution</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {resultMeta.width} × {resultMeta.height}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <dt className="text-muted-foreground">Size</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {formatBytes(resultMeta.bytes)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <dt className="text-muted-foreground">DPI</dt>
                        <dd
                          className={cn(
                            "font-medium tabular-nums",
                            resultMeta.dpiAssumed ? "text-amber-500" : "text-foreground"
                          )}
                          title={resultMeta.dpiAssumed ? "No embedded DPI — assumed 72" : undefined}
                        >
                          {formatDpi(resultMeta)}
                          {resultMeta.dpiAssumed ? " *" : ""}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <dt className="text-muted-foreground">Print Size</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {formatPrintSize(resultMeta)}
                        </dd>
                      </div>
                    </dl>
                  )}

                  {modelText && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Model note:</span> {modelText}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • <strong>Chroma-key is enforced server-side</strong>: every request asks for a
                    solid #FF00FF magenta background and forbids that color in the foreground. Keys
                    out cleanly, no halos.
                  </p>
                  <p>
                    • Inspect at full zoom before downloading. Any edge fringe, glow, or
                    semi-transparent pixel against the magenta will print as a white halo on dark
                    garments.
                  </p>
                  <p>
                    • Describe <strong>size intent</strong> — e.g. &ldquo;10-inch back print&rdquo;
                    or &ldquo;3-inch left chest&rdquo; — so the model sizes the composition
                    appropriately.
                  </p>
                  <p>
                    • Edit mode lets you pass multiple source images to combine (e.g. &ldquo;place
                    this logo on this shirt&rdquo;).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
