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
  Lock,
  LockOpen,
  Package,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import { BeforeAfterSlider } from "@/components/admin/before-after-slider";
import { applyWatermark } from "@/lib/watermark/watermark";
import {
  getImageDimensions,
  pickClosestAspectRatio,
  resizeToExact,
  SUPPORTED_RATIOS,
  type SupportedRatioId,
} from "@/lib/batch-enhance/output-sizing";
import { formatBytes } from "@/lib/image-metadata";
import { formatCurrency } from "@/lib/formatters";
import {
  BATCH_PRESETS,
  BATCH_TIER_COSTS,
  type BatchPreset,
  type BatchPresetId,
} from "@/lib/batch-enhance/presets";

const ICON_MAP = { Home, Package, Camera, Image: ImageIcon, Building, Sparkles, Wand2 } as const;
type IconKey = keyof typeof ICON_MAP;

const ACCENT_KEYS = ["teal", "amber", "sky", "rose", "emerald", "indigo"] as const;
type AccentKey = (typeof ACCENT_KEYS)[number];

interface SavedPrompt {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  accent: string;
  useCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type ActivePreset =
  | { kind: "builtin"; id: BatchPresetId }
  | { kind: "saved"; id: string }
  | { kind: "custom" };

const CUSTOM_DRAFT_KEY = "exora.batchEnhance.customDraft";

const ACCENTS: Record<
  AccentKey,
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
  indigo: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/40",
    ring: "ring-indigo-500/30",
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
  /** Watermarked output for display (always present after success). */
  outputUrl?: string;
  /** Watermarked Blob — download served from this when locked. */
  outputBlob?: Blob;
  /** Object URL for the unwatermarked clean image (only used when unlocked). */
  cleanUrl?: string;
  /** Unwatermarked Blob — download served from this when unlocked. */
  cleanBlob?: Blob;
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
  /** When true, output exactly matches the input image dimensions per-job.
   *  When false, all outputs use the explicit `outputRatio` selected below. */
  const [matchSourceSize, setMatchSourceSize] = useState(true);
  const [outputRatio, setOutputRatio] = useState<SupportedRatioId>("1:1");
  const [active, setActive] = useState<ActivePreset>({
    kind: "builtin",
    id: BATCH_PRESETS[0].id,
  });
  const [customPromptText, setCustomPromptText] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [saveDialog, setSaveDialog] = useState<{ label: string } | null>(null);
  const [editDialog, setEditDialog] = useState<SavedPrompt | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [comparing, setComparing] = useState<Job | null>(null);
  // Unlock state — when configured, outputs ship watermarked + non-downloadable
  // until the operator enters the password. unlocked persists for the page session only.
  const [lockConfigured, setLockConfigured] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState(false);

  // Dropbox tab state
  const [dropboxPath, setDropboxPath] = useState("/Apps/Exora-RIP/inbox");
  const [dropboxLoading, setDropboxLoading] = useState(false);
  const [dropboxEntries, setDropboxEntries] = useState<DropboxImageEntry[]>([]);
  const [dropboxError, setDropboxError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  /** Resolved prompt — drives processing + filename + UI labels. */
  const resolved = useMemo<{
    prompt: string;
    label: string;
    accent: AccentKey;
    slug: string;
    /** ID of the saved preset to bump useCount on, if applicable. */
    savedId?: string;
  }>(() => {
    if (active.kind === "builtin") {
      const p = BATCH_PRESETS.find((x) => x.id === active.id) ?? BATCH_PRESETS[0];
      return { prompt: p.prompt, label: p.label, accent: p.accent, slug: p.id };
    }
    if (active.kind === "saved") {
      const p = savedPrompts.find((x) => x.id === active.id);
      if (p) {
        return {
          prompt: p.prompt,
          label: p.label,
          accent: (ACCENT_KEYS as readonly string[]).includes(p.accent)
            ? (p.accent as AccentKey)
            : "amber",
          slug: `saved-${p.id.slice(0, 8)}`,
          savedId: p.id,
        };
      }
      // saved preset deleted — fall back to first built-in
      return {
        prompt: BATCH_PRESETS[0].prompt,
        label: BATCH_PRESETS[0].label,
        accent: BATCH_PRESETS[0].accent,
        slug: BATCH_PRESETS[0].id,
      };
    }
    // custom (free-form, unsaved)
    return {
      prompt: customPromptText,
      label: "Custom prompt",
      accent: "indigo",
      slug: "custom",
    };
  }, [active, savedPrompts, customPromptText]);

  /** Fetch saved prompts on mount + after mutations. */
  const fetchSavedPrompts = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/admin/batch-enhance-prompts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSavedPrompts(data.entries ?? []);
      }
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPrompts();
  }, [fetchSavedPrompts]);

  /** Probe the unlock-feature configuration on mount. */
  useEffect(() => {
    fetch("/api/admin/unlock", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLockConfigured(!!d.configured))
      .catch(() => setLockConfigured(false));
  }, []);

  /** Persist custom draft so it survives a refresh. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CUSTOM_DRAFT_KEY);
    if (stored) setCustomPromptText(stored);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (customPromptText) {
      localStorage.setItem(CUSTOM_DRAFT_KEY, customPromptText);
    } else {
      localStorage.removeItem(CUSTOM_DRAFT_KEY);
    }
  }, [customPromptText]);

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
      if (j?.cleanUrl) URL.revokeObjectURL(j.cleanUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearJobs = () => {
    jobs.forEach((j) => {
      if (j.inputUrl) URL.revokeObjectURL(j.inputUrl);
      if (j.outputUrl) URL.revokeObjectURL(j.outputUrl);
      if (j.cleanUrl) URL.revokeObjectURL(j.cleanUrl);
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

      // 2. Decide aspect ratio + target output dimensions.
      // - If "match source size" is on, measure the input and pick the
      //   closest Gemini-supported ratio + remember the input's exact
      //   pixel size so we can resize the result to match at the end.
      // - Otherwise use the operator-selected ratio and let Gemini decide
      //   the resolution.
      let aspectRatio: SupportedRatioId = outputRatio;
      let targetSize: { width: number; height: number } | null = null;
      if (matchSourceSize) {
        try {
          const dims = await getImageDimensions(blob);
          aspectRatio = pickClosestAspectRatio(dims.width, dims.height);
          targetSize = dims;
        } catch {
          // If we can't measure, fall back to the explicit ratio.
        }
      }

      // 3. Submit to /api/image-studio in edit mode with chroma-key disabled.
      const form = new FormData();
      form.append("mode", "edit");
      form.append("tier", tier);
      form.append("prompt", resolved.prompt);
      form.append("aspectRatio", aspectRatio);
      form.append("chromaKey", "none");
      form.append("image", blob, "input");

      const res = await fetch("/api/image-studio", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { status: "error", error: err.error || `Generation failed (${res.status})` };
      }

      const rawBlob = await res.blob();
      const costHeader = res.headers.get("X-Cost-Usd");
      const costUsd = costHeader ? parseFloat(costHeader) : BATCH_TIER_COSTS[tier];

      // 4. Resize to match source dimensions exactly (if enabled). The
      // model picks its own pixel resolution within the requested ratio,
      // so we always finish with a canvas pass to land on the precise
      // input WxH the operator started with.
      let cleanBlob = rawBlob;
      if (targetSize && matchSourceSize) {
        try {
          cleanBlob = await resizeToExact(
            rawBlob,
            targetSize.width,
            targetSize.height,
            "cover"
          );
        } catch (err) {
          console.error("Resize-to-source failed, using model output as-is:", err);
        }
      }

      // 5. Apply watermark only if the unlock feature is configured.
      let watermarkedBlob = cleanBlob;
      if (lockConfigured) {
        try {
          watermarkedBlob = await applyWatermark(cleanBlob);
        } catch (err) {
          // Watermark failure should NOT block the output — fall back to clean
          // (operators won't realize watermark is missing, but better than no result).
          console.error("Watermark failed:", err);
        }
      }

      return {
        ...extraPatch,
        status: "done",
        outputBlob: watermarkedBlob,
        outputUrl: URL.createObjectURL(watermarkedBlob),
        cleanBlob,
        cleanUrl: URL.createObjectURL(cleanBlob),
        costUsd,
      };
    },
    [resolved.prompt, tier, lockConfigured, matchSourceSize, outputRatio]
  );

  const runBatch = useCallback(async () => {
    if (running) return;
    // Guard: custom prompt mode needs a non-empty prompt.
    if (active.kind === "custom" && !customPromptText.trim()) {
      setGlobalError(
        "Type a custom prompt or pick a preset before running."
      );
      return;
    }
    // Capture the queue at run-start — workers iterate this snapshot
    // directly, no async state-peeking needed.
    const queueSnapshot = jobs.filter((j) => j.status === "pending");
    if (queueSnapshot.length === 0) return;
    setRunning(true);
    setGlobalError(null);

    // Bump useCount on the active saved preset (fire and forget).
    if (resolved.savedId) {
      fetch(`/api/admin/batch-enhance-prompts/${resolved.savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCount: "increment" }),
      }).catch(() => {});
    }

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
  }, [jobs, processOne, running, active, customPromptText, resolved.savedId]);

  // -------------------------------------------------------------------------
  // Output / download helpers
  // -------------------------------------------------------------------------

  const downloadJob = (job: Job) => {
    // Locked + watermarking active → block download. Pop the unlock dialog
    // so the operator can decide whether to authenticate or take the
    // watermarked draft anyway (we don't allow watermarked downloads — only
    // unlocked clean downloads).
    if (lockConfigured && !unlocked) {
      setUnlockDialog(true);
      return;
    }
    // Prefer the clean blob; fall back to whatever output we have
    // (covers the "lock not configured at all" path where outputBlob == cleanBlob).
    const blob = job.cleanBlob ?? job.outputBlob;
    if (!blob) return;
    const baseName = job.label.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}-${resolved.slug}.png`;
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
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">2. Choose enhancement</CardTitle>
                  <CardDescription>One preset applies to every image in the queue.</CardDescription>
                </div>
                <button
                  type="button"
                  onClick={fetchSavedPrompts}
                  disabled={savedLoading}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Refresh saved prompts"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-4 w-4", savedLoading && "animate-spin")} />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Built-in presets */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Built-in
                  </p>
                  {BATCH_PRESETS.map((p) => {
                    const accent = ACCENTS[p.accent];
                    const Icon = ICON_MAP[p.icon];
                    const isActive = active.kind === "builtin" && active.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActive({ kind: "builtin", id: p.id })}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                          isActive
                            ? cn(accent.border, accent.bg)
                            : "border-border bg-card hover:bg-muted/40"
                        )}
                      >
                        <div className={cn("rounded-lg p-2", accent.bg, accent.text)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-semibold", isActive && accent.text)}>
                            {p.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{p.blurb}</p>
                        </div>
                        {isActive && <Check className={cn("mt-1 h-4 w-4 shrink-0", accent.text)} />}
                      </button>
                    );
                  })}
                </div>

                {/* Saved presets */}
                {savedPrompts.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Your saved prompts ({savedPrompts.length})
                    </p>
                    {savedPrompts.map((sp) => {
                      const accentKey = (ACCENT_KEYS as readonly string[]).includes(sp.accent)
                        ? (sp.accent as AccentKey)
                        : "amber";
                      const accent = ACCENTS[accentKey];
                      const iconKey = (Object.keys(ICON_MAP) as IconKey[]).includes(
                        sp.icon as IconKey
                      )
                        ? (sp.icon as IconKey)
                        : "Sparkles";
                      const Icon = ICON_MAP[iconKey];
                      const isActive = active.kind === "saved" && active.id === sp.id;
                      return (
                        <div
                          key={sp.id}
                          className={cn(
                            "group relative flex items-start gap-3 rounded-lg border-2 p-3 transition-colors",
                            isActive
                              ? cn(accent.border, accent.bg)
                              : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setActive({ kind: "saved", id: sp.id })}
                            className="flex flex-1 items-start gap-3 text-left"
                          >
                            <div className={cn("rounded-lg p-2", accent.bg, accent.text)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-sm font-semibold", isActive && accent.text)}>
                                {sp.label}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {sp.prompt}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground/70">
                                {sp.useCount > 0 && `${sp.useCount} uses · `}
                                {new Date(sp.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            {isActive && (
                              <Check className={cn("mt-1 h-4 w-4 shrink-0", accent.text)} />
                            )}
                          </button>
                          {/* Hover actions */}
                          <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditDialog(sp);
                              }}
                              className="rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  !window.confirm(
                                    `Delete saved prompt "${sp.label}"?\nThis can't be undone.`
                                  )
                                )
                                  return;
                                await fetch(`/api/admin/batch-enhance-prompts/${sp.id}`, {
                                  method: "DELETE",
                                });
                                if (active.kind === "saved" && active.id === sp.id) {
                                  setActive({ kind: "builtin", id: BATCH_PRESETS[0].id });
                                }
                                fetchSavedPrompts();
                              }}
                              className="rounded p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom prompt */}
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Custom
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive({ kind: "custom" })}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                      active.kind === "custom"
                        ? cn(ACCENTS.indigo.border, ACCENTS.indigo.bg)
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("rounded-lg p-2", ACCENTS.indigo.bg, ACCENTS.indigo.text)}>
                      <Wand2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          active.kind === "custom" && ACCENTS.indigo.text
                        )}
                      >
                        Custom prompt
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Type your own enhancement instructions for this batch.
                      </p>
                    </div>
                    {active.kind === "custom" && (
                      <Check className={cn("mt-1 h-4 w-4 shrink-0", ACCENTS.indigo.text)} />
                    )}
                  </button>
                  {active.kind === "custom" && (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                      <textarea
                        value={customPromptText}
                        onChange={(e) => setCustomPromptText(e.target.value.slice(0, 4000))}
                        rows={5}
                        placeholder='e.g. "Re-render this photo with a moody, cinematic film grade. Deepen blacks, add subtle warm highlights, preserve subject and composition exactly."'
                        className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {customPromptText.length}/4000
                        </span>
                        <button
                          type="button"
                          onClick={() => setSaveDialog({ label: "" })}
                          disabled={!customPromptText.trim()}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          Save as preset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. Output size</CardTitle>
                <CardDescription>
                  By default, outputs are resized to match each input&apos;s exact pixel
                  dimensions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
                  <input
                    type="checkbox"
                    checked={matchSourceSize}
                    onChange={(e) => setMatchSourceSize(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      Match source size
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Each output is resized to its input&apos;s exact dimensions. Aspect
                      ratio is auto-detected per image.
                    </span>
                  </span>
                </label>
                {!matchSourceSize && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Force aspect ratio
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SUPPORTED_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setOutputRatio(r.id)}
                          className={cn(
                            "rounded-md border-2 px-2 py-1.5 text-xs font-medium tabular-nums transition-colors",
                            outputRatio === r.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Outputs will be at the model&apos;s native resolution for the
                      selected ratio (~1K Preview / ~4K Production).
                    </p>
                  </div>
                )}
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
                  {lockConfigured && (
                    <button
                      type="button"
                      onClick={() =>
                        unlocked ? setUnlocked(false) : setUnlockDialog(true)
                      }
                      title={
                        unlocked
                          ? "Re-lock outputs (re-applies watermark for new results)"
                          : "Outputs are watermarked. Click to enter the password and unlock."
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        unlocked
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400"
                      )}
                    >
                      {unlocked ? (
                        <>
                          <LockOpen className="h-3.5 w-3.5" />
                          Unlocked
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Watermarked
                        </>
                      )}
                    </button>
                  )}
                  {stats.done > 0 && (
                    <button
                      type="button"
                      onClick={downloadAll}
                      disabled={lockConfigured && !unlocked}
                      title={
                        lockConfigured && !unlocked
                          ? "Unlock to download clean files"
                          : undefined
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
                    locked={lockConfigured && !unlocked}
                    onRemove={() => removeJob(job.id)}
                    onDownload={() => downloadJob(job)}
                    onCompare={() => setComparing(job)}
                    onPadlockClick={() => setUnlockDialog(true)}
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
          afterUrl={
            unlocked && comparing.cleanUrl ? comparing.cleanUrl : comparing.outputUrl
          }
          title={`${resolved.label} · ${tier} tier${
            lockConfigured && !unlocked ? " · WATERMARKED" : ""
          }`}
          subtitle={comparing.label}
          onDownload={() => downloadJob(comparing)}
          onClose={() => setComparing(null)}
        />
      )}

      {unlockDialog && (
        <UnlockDialog
          onClose={() => setUnlockDialog(false)}
          onUnlocked={() => {
            setUnlocked(true);
            setUnlockDialog(false);
          }}
        />
      )}

      {saveDialog && (
        <SavePromptDialog
          initialLabel={saveDialog.label}
          prompt={customPromptText}
          onClose={() => setSaveDialog(null)}
          onSaved={(saved) => {
            setSaveDialog(null);
            // Switch to the newly-saved preset and clear the custom draft.
            setActive({ kind: "saved", id: saved.id });
            setCustomPromptText("");
            fetchSavedPrompts();
          }}
        />
      )}

      {editDialog && (
        <EditPromptDialog
          entry={editDialog}
          onClose={() => setEditDialog(null)}
          onSaved={() => {
            setEditDialog(null);
            fetchSavedPrompts();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save / edit dialogs
// ---------------------------------------------------------------------------

function SavePromptDialog({
  initialLabel,
  prompt,
  onClose,
  onSaved,
}: {
  initialLabel: string;
  prompt: string;
  onClose: () => void;
  onSaved: (saved: SavedPrompt) => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [accent, setAccent] = useState<AccentKey>("indigo");
  const [iconKey, setIconKey] = useState<IconKey>("Sparkles");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!label.trim()) {
      setError("Give it a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/batch-enhance-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), prompt, accent, icon: iconKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      onSaved(data.entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Save as preset" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, 80))}
            placeholder="e.g. Moody cinematic"
            autoFocus
          />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ICON_MAP) as IconKey[]).map((k) => {
              const Icon = ICON_MAP[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setIconKey(k)}
                  className={cn(
                    "rounded-md border-2 p-2",
                    iconKey === k
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                  title={k}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Accent color">
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAccent(k)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 capitalize transition-transform",
                  accent === k ? "scale-110 border-foreground" : "border-transparent"
                )}
                style={{
                  backgroundColor: {
                    teal: "#0d9488",
                    amber: "#f59e0b",
                    sky: "#0ea5e9",
                    rose: "#f43f5e",
                    emerald: "#10b981",
                    indigo: "#6366f1",
                  }[k],
                }}
                title={k}
                aria-label={k}
              />
            ))}
          </div>
        </Field>
        <Field label="Prompt preview">
          <p className="max-h-32 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-xs leading-relaxed text-muted-foreground">
            {prompt}
          </p>
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !label.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save preset
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditPromptDialog({
  entry,
  onClose,
  onSaved,
}: {
  entry: SavedPrompt;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(entry.label);
  const [prompt, setPrompt] = useState(entry.prompt);
  const [accent, setAccent] = useState<AccentKey>(
    (ACCENT_KEYS as readonly string[]).includes(entry.accent)
      ? (entry.accent as AccentKey)
      : "indigo"
  );
  const [iconKey, setIconKey] = useState<IconKey>(
    (Object.keys(ICON_MAP) as IconKey[]).includes(entry.icon as IconKey)
      ? (entry.icon as IconKey)
      : "Sparkles"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!label.trim() || !prompt.trim()) {
      setError("Name and prompt are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/batch-enhance-prompts/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), prompt: prompt.trim(), accent, icon: iconKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit "${entry.label}"`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <Input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 80))} />
        </Field>
        <Field label="Prompt">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
            rows={6}
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ICON_MAP) as IconKey[]).map((k) => {
              const Icon = ICON_MAP[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setIconKey(k)}
                  className={cn(
                    "rounded-md border-2 p-2",
                    iconKey === k
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Accent color">
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAccent(k)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 capitalize transition-transform",
                  accent === k ? "scale-110 border-foreground" : "border-transparent"
                )}
                style={{
                  backgroundColor: {
                    teal: "#0d9488",
                    amber: "#f59e0b",
                    sky: "#0ea5e9",
                    rose: "#f43f5e",
                    emerald: "#10b981",
                    indigo: "#6366f1",
                  }[k],
                }}
                aria-label={k}
              />
            ))}
          </div>
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UnlockDialog({
  onClose,
  onUnlocked,
}: {
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Wrong password");
      onUnlocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Unlock outputs" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Outputs are watermarked &amp; non-downloadable until you enter the unlock
          password. The unlock applies for the rest of this page session — refresh
          the page to re-lock.
        </p>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />}
            Unlock
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
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
  locked,
  onRemove,
  onDownload,
  onCompare,
  onPadlockClick,
}: {
  job: Job;
  locked: boolean;
  onRemove: () => void;
  onDownload: () => void;
  onCompare: () => void;
  onPadlockClick: () => void;
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
        <div className="relative h-16 w-16 shrink-0">
          <button
            type="button"
            onClick={canCompare ? onCompare : undefined}
            disabled={!canCompare}
            title={canCompare ? "Click to compare before / after" : undefined}
            className={cn(
              "h-full w-full overflow-hidden rounded-lg border border-border bg-muted",
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
          {/* Padlock overlay — visible only when an output exists and outputs are locked */}
          {locked && job.outputUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPadlockClick();
              }}
              title="Locked — click to unlock with password (removes watermark)"
              aria-label="Unlock"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/95 text-amber-950 shadow ring-1 ring-black/30 hover:bg-amber-400"
            >
              <Lock className="h-3 w-3" />
            </button>
          )}
        </div>

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
