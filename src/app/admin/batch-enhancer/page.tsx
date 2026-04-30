"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Building,
  Camera,
  Check,
  Cloud,
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Home,
  Image as ImageIcon,
  Loader2,
  Package,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import { BeforeAfterSlider } from "@/components/admin/before-after-slider";
import { formatBytes } from "@/lib/image-metadata";
import { formatCurrency } from "@/lib/formatters";
import {
  BATCH_PRESETS,
  BATCH_TIER_COSTS,
  type BatchPreset,
  type BatchPresetId,
} from "@/lib/batch-enhance/presets";

const ICON_MAP = { Home, Package, Camera, Image: ImageIcon, Building };

const ACCENTS: Record<
  BatchPreset["accent"],
  { bg: string; text: string; border: string; ring: string }
> = {
  teal: {
    bg: "bg-teal-500/15",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-500/40",
    ring: "ring-teal-500/30",
  },
  amber: {
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/40",
    ring: "ring-amber-500/30",
  },
  sky: {
    bg: "bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/40",
    ring: "ring-sky-500/30",
  },
  rose: {
    bg: "bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/40",
    ring: "ring-rose-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/30",
  },
};

type JobStatus = "pending" | "processing" | "done" | "error" | "skipped";

type SourceKind = "upload" | "dropbox";

interface Job {
  id: string;
  status: JobStatus;
  source: SourceKind;
  /** Human label for the source (filename or dropbox path). */
  label: string;
  /** Bytes of the input. */
  bytes: number;
  /** Source data — File for upload, dropbox path for fetch-on-demand. */
  file?: File;
  dropboxPath?: string;
  /** Object URLs once we have them. */
  inputUrl?: string;
  outputUrl?: string;
  outputBlob?: Blob;
  /** Error message if status === error. */
  error?: string;
  /** Cost charged for this job. */
  costUsd?: number;
}

interface DropboxImageEntry {
  name: string;
  path: string;
  bytes: number;
  modified: string | null;
  oversize: boolean;
}

const MAX_CONCURRENT = 3;

export default function BatchEnhancerPage() {
  const [sourceMode, setSourceMode] = useState<"upload" | "dropbox" | "drive">("upload");
  const [tier, setTier] = useState<"preview" | "production">("preview");
  const [presetId, setPresetId] = useState<BatchPresetId>(BATCH_PRESETS[0].id);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [comparing, setComparing] = useState<Job | null>(null);

  // Dropbox tab state
  const [dropboxPath, setDropboxPath] = useState("/Apps/Exora-RIP/inbox");
  const [dropboxLoading, setDropboxLoading] = useState(false);
  const [dropboxEntries, setDropboxEntries] = useState<DropboxImageEntry[]>([]);
  const [dropboxError, setDropboxError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const preset = useMemo(
    () => BATCH_PRESETS.find((p) => p.id === presetId) ?? BATCH_PRESETS[0],
    [presetId]
  );

  // Cleanup object URLs on unmount.
  useEffect(() => {
    return () => {
      jobs.forEach((j) => {
        if (j.inputUrl) URL.revokeObjectURL(j.inputUrl);
        if (j.outputUrl) URL.revokeObjectURL(j.outputUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addUploadJobs = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => /^image\//.test(f.type));
    if (incoming.length === 0) return;
    const newJobs: Job[] = incoming.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      source: "upload",
      label: f.webkitRelativePath || f.name,
      bytes: f.size,
      file: f,
      inputUrl: URL.createObjectURL(f),
    }));
    setJobs((prev) => [...prev, ...newJobs]);
  }, []);

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const j = prev.find((x) => x.id === id);
      if (j?.inputUrl) URL.revokeObjectURL(j.inputUrl);
      if (j?.outputUrl) URL.revokeObjectURL(j.outputUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearJobs = () => {
    jobs.forEach((j) => {
      if (j.inputUrl) URL.revokeObjectURL(j.inputUrl);
      if (j.outputUrl) URL.revokeObjectURL(j.outputUrl);
    });
    setJobs([]);
  };

  const listDropbox = useCallback(async () => {
    setDropboxLoading(true);
    setDropboxError(null);
    try {
      const res = await fetch(`/api/dropbox/list?path=${encodeURIComponent(dropboxPath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `List failed (${res.status})`);
      setDropboxEntries(data.entries ?? []);
      if ((data.entries ?? []).length === 0) {
        setDropboxError("No images found in this folder.");
      }
    } catch (e) {
      setDropboxError(e instanceof Error ? e.message : "Failed to list Dropbox folder");
    } finally {
      setDropboxLoading(false);
    }
  }, [dropboxPath]);

  const queueDropboxEntries = (entries: DropboxImageEntry[]) => {
    const newJobs: Job[] = entries
      .filter((e) => !e.oversize)
      .map((e) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: "pending",
        source: "dropbox",
        label: e.path,
        bytes: e.bytes,
        dropboxPath: e.path,
      }));
    setJobs((prev) => [...prev, ...newJobs]);
  };

  // -------------------------------------------------------------------------
  // Process queue
  // -------------------------------------------------------------------------

  const processOne = useCallback(
    async (job: Job): Promise<Partial<Job>> => {
      // 1. Resolve the input as a Blob.
      let blob: Blob | null = null;
      // For Dropbox jobs, we also stash an inputUrl so the before/after
      // slider can show the original — the upload path already has one.
      let extraPatch: Partial<Job> = {};
      if (job.source === "upload" && job.file) {
        blob = job.file;
      } else if (job.source === "dropbox" && job.dropboxPath) {
        const res = await fetch("/api/dropbox/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: job.dropboxPath }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { status: "error", error: err.error || "Dropbox fetch failed" };
        }
        blob = await res.blob();
        extraPatch = { inputUrl: URL.createObjectURL(blob) };
      }
      if (!blob) {
        return { status: "error", error: "No source data" };
      }

      // 2. Submit to /api/image-studio in edit mode with chroma-key disabled.
      const form = new FormData();
      form.append("mode", "edit");
      form.append("tier", tier);
      form.append("prompt", preset.prompt);
      form.append("aspectRatio", "1:1");
      form.append("chromaKey", "none");
      form.append("image", blob, "input");

      const res = await fetch("/api/image-studio", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { status: "error", error: err.error || `Generation failed (${res.status})` };
      }

      const out = await res.blob();
      const costHeader = res.headers.get("X-Cost-Usd");
      const costUsd = costHeader ? parseFloat(costHeader) : BATCH_TIER_COSTS[tier];
      return {
        ...extraPatch,
        status: "done",
        outputBlob: out,
        outputUrl: URL.createObjectURL(out),
        costUsd,
      };
    },
    [preset.prompt, tier]
  );

  const runBatch = useCallback(async () => {
    if (running) return;
    // Capture the queue at run-start — workers iterate this snapshot
    // directly, no async state-peeking needed.
    const queueSnapshot = jobs.filter((j) => j.status === "pending");
    if (queueSnapshot.length === 0) return;
    setRunning(true);
    setGlobalError(null);

    let cursor = 0;

    const updateJob = (id: string, patch: Partial<Job>) => {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    };

    const worker = async () => {
      while (cursor < queueSnapshot.length) {
        const idx = cursor++;
        const job = queueSnapshot[idx];
        if (!job) continue;
        updateJob(job.id, { status: "processing" });
        try {
          const patch = await processOne(job);
          updateJob(job.id, patch);
        } catch (e) {
          updateJob(job.id, {
            status: "error",
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, queueSnapshot.length) }, () => worker())
    );

    setRunning(false);
  }, [jobs, processOne, running]);

  // -------------------------------------------------------------------------
  // Output / download helpers
  // -------------------------------------------------------------------------

  const downloadJob = (job: Job) => {
    if (!job.outputBlob) return;
    const baseName = job.label.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(job.outputBlob);
    a.download = `${baseName}-${preset.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const downloadAll = async () => {
    const done = jobs.filter((j) => j.status === "done" && j.outputBlob);
    for (const j of done) {
      downloadJob(j);
      // Stagger so the browser actually fires each download.
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const processing = jobs.filter((j) => j.status === "processing").length;
    const done = jobs.filter((j) => j.status === "done").length;
    const errored = jobs.filter((j) => j.status === "error").length;
    const totalCost = jobs.reduce((s, j) => s + (j.costUsd ?? 0), 0);
    const estCost = pending * BATCH_TIER_COSTS[tier];
    return { total, pending, processing, done, errored, totalCost, estCost };
  }, [jobs, tier]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="batch-enhancer" />

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3 w-3" />
            Batch · Nano Banana enhancements (not upscaling)
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Batch Image Enhancer
          </h1>
          <p className="mt-2 max-w-3xl text-base text-muted-foreground">
            Run a Gemini Nano Banana enhancement preset against many images at once. Drag in
            files, pick a folder from your desktop, or point at a Dropbox folder. Five
            production-tested presets — interior design, product, lifestyle, restoration,
            architectural.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* LEFT: source + preset + tier */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Pick source</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as typeof sourceMode)}>
                  <TabsList className="mb-3 grid w-full grid-cols-3">
                    <TabsTrigger value="upload" className="gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="dropbox" className="gap-1.5">
                      <Cloud className="h-3.5 w-3.5" />
                      Dropbox
                    </TabsTrigger>
                    <TabsTrigger value="drive" className="gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" />
                      Drive
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length > 0) addUploadJobs(e.dataTransfer.files);
                      }}
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-center transition-colors hover:border-primary/60 hover:bg-muted/40"
                    >
                      <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold">Drop images or click</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, HEIC</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Or pick a folder from your desktop
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && addUploadJobs(e.target.files)}
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      // @ts-expect-error -- non-standard but supported in Chromium/WebKit/Firefox
                      webkitdirectory=""
                      directory=""
                      onChange={(e) => e.target.files && addUploadJobs(e.target.files)}
                    />
                  </TabsContent>

                  <TabsContent value="dropbox" className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Dropbox folder path
                      </label>
                      <Input
                        value={dropboxPath}
                        onChange={(e) => setDropboxPath(e.target.value)}
                        placeholder="/Apps/Exora-RIP/inbox"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={listDropbox}
                      disabled={dropboxLoading || !dropboxPath.trim()}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {dropboxLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      List images
                    </button>
                    {dropboxError && (
                      <p className="text-xs text-destructive">{dropboxError}</p>
                    )}
                    {dropboxEntries.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {dropboxEntries.length} image{dropboxEntries.length === 1 ? "" : "s"} found
                          </span>
                          <button
                            type="button"
                            onClick={() => queueDropboxEntries(dropboxEntries)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            <Plus className="h-3 w-3" />
                            Queue all
                          </button>
                        </div>
                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-1">
                          {dropboxEntries.map((e) => (
                            <button
                              key={e.path}
                              type="button"
                              onClick={() => queueDropboxEntries([e])}
                              disabled={e.oversize}
                              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted disabled:opacity-50"
                              title={e.oversize ? "Skipped — over 12MB" : "Click to queue"}
                            >
                              <span className="truncate font-mono">{e.name}</span>
                              <span className="shrink-0 text-muted-foreground">
                                {formatBytes(e.bytes)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Need to set up Dropbox?{" "}
                      <a href="/admin/dropbox-auth" className="text-primary hover:underline">
                        Connect here
                      </a>
                      .
                    </p>
                  </TabsContent>

                  <TabsContent value="drive" className="space-y-3">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="text-xs text-foreground">
                          <p className="font-semibold text-amber-700 dark:text-amber-400">
                            Google Drive — Phase 2
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            Direct Drive integration needs a one-time OAuth flow (similar to the
                            Dropbox one). For now, the fastest path is:
                          </p>
                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                            <li>
                              In Google Drive, select your images → right-click → <strong>Download</strong>{" "}
                              (Drive zips them)
                            </li>
                            <li>Unzip locally</li>
                            <li>
                              Switch to the <strong>Upload</strong> tab → <strong>Pick a folder</strong> → choose the
                              unzipped folder
                            </li>
                          </ol>
                          <p className="mt-2 text-muted-foreground">
                            Or sync the folder via Dropbox and use the Dropbox tab instead.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Choose enhancement</CardTitle>
                <CardDescription>One preset applies to every image in the queue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {BATCH_PRESETS.map((p) => {
                  const accent = ACCENTS[p.accent];
                  const Icon = ICON_MAP[p.icon];
                  const active = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                        active
                          ? cn(accent.border, accent.bg)
                          : "border-border bg-card hover:bg-muted/40"
                      )}
                    >
                      <div className={cn("rounded-lg p-2", accent.bg, accent.text)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold", active && accent.text)}>
                          {p.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.blurb}</p>
                      </div>
                      {active && (
                        <Check className={cn("mt-1 h-4 w-4 shrink-0", accent.text)} />
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Tier</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTier("preview")}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-colors",
                    tier === "preview"
                      ? "border-teal-500/40 bg-teal-500/10"
                      : "border-border bg-card hover:bg-muted/40"
                  )}
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Zap className="h-3.5 w-3.5 text-teal-500" />
                    Preview
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    1K · {formatCurrency(BATCH_TIER_COSTS.preview)}/image · ~5–10s
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTier("production")}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-colors",
                    tier === "production"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-border bg-card hover:bg-muted/40"
                  )}
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Production
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    4K · {formatCurrency(BATCH_TIER_COSTS.production)}/image · ~30–60s
                  </p>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: queue + run + results */}
          <div className="space-y-4">
            {/* Stats + run */}
            <Card>
              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm">
                  <Stat label="Queued" value={String(stats.total)} />
                  <Stat label="Pending" value={String(stats.pending)} accent="amber" />
                  <Stat label="Done" value={String(stats.done)} accent="emerald" />
                  {stats.errored > 0 && (
                    <Stat label="Errors" value={String(stats.errored)} accent="rose" />
                  )}
                  <Stat
                    label="Est. cost"
                    value={formatCurrency(stats.estCost)}
                    accent="amber"
                  />
                  {stats.totalCost > 0 && (
                    <Stat
                      label="Spent"
                      value={formatCurrency(stats.totalCost)}
                      accent="emerald"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runBatch}
                    disabled={running || stats.pending === 0}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {running
                      ? `Processing ${stats.processing}/${stats.pending + stats.processing}…`
                      : `Run ${stats.pending}`}
                  </button>
                  {stats.done > 0 && (
                    <button
                      type="button"
                      onClick={downloadAll}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download all
                    </button>
                  )}
                  {jobs.length > 0 && !running && (
                    <button
                      type="button"
                      onClick={clearJobs}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Clear queue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {globalError && (
              <Card className="border-destructive/40 bg-destructive/10">
                <CardContent className="py-3 text-sm text-destructive">{globalError}</CardContent>
              </Card>
            )}

            {/* Queue */}
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <p>Queue is empty.</p>
                  <p className="text-xs">Add images from the source picker on the left.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onRemove={() => removeJob(job.id)}
                    onDownload={() => downloadJob(job)}
                    onCompare={() => setComparing(job)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ToolFeedback toolId="batch-enhancer" toolLabel="Batch Image Enhancer" />
      </div>

      {comparing && comparing.inputUrl && comparing.outputUrl && (
        <BeforeAfterSlider
          beforeUrl={comparing.inputUrl}
          afterUrl={comparing.outputUrl}
          title={`${preset.label} · ${tier} tier`}
          subtitle={comparing.label}
          onDownload={() => downloadJob(comparing)}
          onClose={() => setComparing(null)}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald" | "rose";
}) {
  const tone =
    accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "rose"
      ? "text-rose-600 dark:text-rose-400"
      : "text-foreground";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("font-semibold tabular-nums", tone)}>{value}</span>
    </div>
  );
}

function JobRow({
  job,
  onRemove,
  onDownload,
  onCompare,
}: {
  job: Job;
  onRemove: () => void;
  onDownload: () => void;
  onCompare: () => void;
}) {
  const canCompare = !!(job.inputUrl && job.outputUrl);
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        {/* Source thumbnail */}
        <button
          type="button"
          onClick={canCompare ? onCompare : undefined}
          disabled={!canCompare}
          title={canCompare ? "Click to compare before / after" : undefined}
          className={cn(
            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted",
            canCompare && "cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/40"
          )}
        >
          {job.inputUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.inputUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {job.source === "dropbox" ? (
                <Cloud className="h-5 w-5" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
          )}
        </button>

        {/* Arrow */}
        <div className="text-muted-foreground/50">→</div>

        {/* Output thumbnail */}
        <button
          type="button"
          onClick={canCompare ? onCompare : undefined}
          disabled={!canCompare}
          title={canCompare ? "Click to compare before / after" : undefined}
          className={cn(
            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted",
            canCompare && "cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/40"
          )}
        >
          {job.outputUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.outputUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {job.status === "processing" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : job.status === "error" ? (
                <X className="h-5 w-5 text-destructive" />
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </div>
          )}
        </button>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{job.label}</p>
          <p className="text-[11px] text-muted-foreground">
            <StatusBadge status={job.status} />
            <span className="ml-2">{formatBytes(job.bytes)}</span>
            {job.costUsd ? (
              <span className="ml-2 tabular-nums">· {formatCurrency(job.costUsd)}</span>
            ) : null}
          </p>
          {job.error && <p className="mt-1 text-xs text-destructive">{job.error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {job.status === "done" && (
            <button
              type="button"
              onClick={onDownload}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Download"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {job.outputUrl && (
            <a
              href={job.outputUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {job.status !== "processing" && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; cls: string }> = {
    pending: { label: "Queued", cls: "bg-muted text-muted-foreground" },
    processing: { label: "Processing", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    done: { label: "Done", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    error: { label: "Error", cls: "bg-destructive/15 text-destructive" },
    skipped: { label: "Skipped", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status];
  return <Badge className={cn("text-[10px] uppercase tracking-wide", m.cls)}>{m.label}</Badge>;
}
