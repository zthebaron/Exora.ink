"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import {
  PLATFORMS,
  type SocialAccountDTO,
  type SocialPlatform,
  type SocialPostDTO,
} from "@/lib/social/types";

const PLATFORM_ICON_MAP = {
  Facebook,
  Instagram,
  Linkedin,
  Image: ImageIcon,
  Sparkles,
} as const;

const ACCENTS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  sky: { bg: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-400", border: "border-sky-500/40" },
  rose: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-400", border: "border-rose-500/40" },
  indigo: { bg: "bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-500/40" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/40" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/40" },
  teal: { bg: "bg-teal-500/15", text: "text-teal-700 dark:text-teal-400", border: "border-teal-500/40" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SocialPosterPage() {
  const [tab, setTab] = useState<"compose" | "drafts" | "scheduled" | "published" | "accounts">(
    "compose"
  );
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>([]);
  const [posts, setPosts] = useState<SocialPostDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Compose state
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledForLocal, setScheduledForLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/accounts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/posts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchPosts();
  }, [fetchAccounts, fetchPosts]);

  const accountsByPlatform = useMemo(() => {
    const map = new Map<SocialPlatform, SocialAccountDTO[]>();
    for (const acc of accounts) {
      const list = map.get(acc.platform) ?? [];
      list.push(acc);
      map.set(acc.platform, list);
    }
    return map;
  }, [accounts]);

  const targetedAccounts = useMemo(
    () => accounts.filter((a) => targetAccountIds.includes(a.id)),
    [accounts, targetAccountIds]
  );

  /** Lowest character cap among targeted platforms — surfaced in the editor. */
  const lowestCap = useMemo(() => {
    if (targetedAccounts.length === 0) return Infinity;
    let cap = Infinity;
    for (const a of targetedAccounts) {
      const p = PLATFORMS[a.platform];
      if (p && p.maxBodyChars < cap) cap = p.maxBodyChars;
    }
    return cap;
  }, [targetedAccounts]);

  /** Whether all targeted platforms require an image (and we lack one). */
  const missingImage = useMemo(() => {
    if (imageUrls.length > 0) return false;
    return targetedAccounts.some((a) => PLATFORMS[a.platform]?.imageRequired);
  }, [targetedAccounts, imageUrls]);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    // For Phase 1 we use object URLs (local preview). When Meta/LinkedIn
    // adapters land we'll upload to Cloudinary / Dropbox / our own bucket
    // and use those public URLs at publish-time.
    const next: string[] = [...imageUrls];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      next.push(URL.createObjectURL(f));
    }
    setImageUrls(next);
  };

  const removeImage = (i: number) => {
    setImageUrls((prev) => {
      const next = [...prev];
      const removed = next.splice(i, 1)[0];
      if (removed && removed.startsWith("blob:")) URL.revokeObjectURL(removed);
      return next;
    });
  };

  const toggleAccount = (id: string) => {
    setTargetAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setLabel("");
    setBody("");
    imageUrls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
    setImageUrls([]);
    setTargetAccountIds([]);
    setScheduleEnabled(false);
    setScheduledForLocal("");
    setError(null);
  };

  const saveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      const scheduledFor = scheduleEnabled && scheduledForLocal
        ? new Date(scheduledForLocal).toISOString()
        : null;
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || null,
          body,
          imageUrls,
          targetAccountIds,
          scheduledFor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      reset();
      fetchPosts();
      setTab(scheduledFor ? "scheduled" : "drafts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const drafts = posts.filter((p) => p.status === "draft");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => ["published", "failed"].includes(p.status));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="social-poster" />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              <Send className="h-3 w-3" />
              Social Poster · multi-platform
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Social Poster
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Compose once, publish to Facebook, Instagram, LinkedIn and Pinterest. Schedule for
              later or post now. Drafts are saved automatically.
            </p>
          </div>
          {accounts.length === 0 && (
            <a
              href="#accounts"
              onClick={(e) => {
                e.preventDefault();
                setTab("accounts");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plug className="h-4 w-4" />
              Connect an account
            </a>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts {drafts.length > 0 && <span className="ml-1 opacity-70">{drafts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled {scheduled.length > 0 && <span className="ml-1 opacity-70">{scheduled.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="published">Posted</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* Compose card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compose</CardTitle>
                  <CardDescription>Write once, target multiple platforms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Label (internal — drafts list)">
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Spring sale teaser"
                    />
                  </Field>

                  <Field label="Body / caption">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={8}
                      placeholder="Write your post… mention hashtags, links, and a call to action."
                      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="tabular-nums">
                        {body.length}
                        {Number.isFinite(lowestCap) && ` / ${lowestCap}`}
                      </span>
                      {Number.isFinite(lowestCap) && body.length > lowestCap && (
                        <span className="font-semibold text-destructive">
                          Over the cap for one of your targeted platforms.
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Images */}
                  <Field label={`Images${missingImage ? " · required" : ""}`}>
                    <div className="space-y-2">
                      {imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {imageUrls.map((u, i) => (
                            <div
                              key={i}
                              className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white hover:bg-black"
                                aria-label="Remove"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40"
                      >
                        <Upload className="h-4 w-4" />
                        Add image{imageUrls.length > 0 ? "s" : ""}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onFiles(e.target.files)}
                      />
                      {missingImage && (
                        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Instagram and Pinterest require an image.
                        </p>
                      )}
                    </div>
                  </Field>

                  {/* Schedule */}
                  <Field label="Schedule">
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={scheduleEnabled}
                          onChange={(e) => setScheduleEnabled(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Schedule for later
                      </label>
                      {scheduleEnabled && (
                        <Input
                          type="datetime-local"
                          value={scheduledForLocal}
                          onChange={(e) => setScheduledForLocal(e.target.value)}
                        />
                      )}
                    </div>
                  </Field>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={saving || !body.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {scheduleEnabled ? "Save & schedule" : "Save draft"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Targets sidebar */}
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Target accounts</CardTitle>
                    <CardDescription>
                      Which connected accounts to publish to.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {accounts.length === 0 ? (
                      <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                        No accounts connected.
                        <br />
                        Switch to the <strong>Accounts</strong> tab to connect.
                      </p>
                    ) : (
                      accounts.map((acc) => {
                        const platformInfo = PLATFORMS[acc.platform];
                        const Icon = platformInfo
                          ? PLATFORM_ICON_MAP[platformInfo.icon] ?? Sparkles
                          : Sparkles;
                        const accent = ACCENTS[platformInfo?.accent ?? "indigo"];
                        const checked = targetAccountIds.includes(acc.id);
                        return (
                          <label
                            key={acc.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-2.5",
                              checked ? cn(accent.border, accent.bg) : "border-border bg-card hover:bg-muted/40"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAccount(acc.id)}
                              className="h-4 w-4 accent-primary"
                            />
                            <div className={cn("rounded-md p-1.5", accent.bg, accent.text)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">{acc.displayName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {platformInfo?.label ?? acc.platform}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drafts">
            <PostList posts={drafts} accounts={accounts} onChange={fetchPosts} emptyLabel="No drafts yet." />
          </TabsContent>
          <TabsContent value="scheduled">
            <PostList posts={scheduled} accounts={accounts} onChange={fetchPosts} emptyLabel="No scheduled posts." />
          </TabsContent>
          <TabsContent value="published">
            <PostList posts={published} accounts={accounts} onChange={fetchPosts} emptyLabel="Nothing posted yet." />
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">Connected accounts</CardTitle>
                  <CardDescription>
                    Connect each platform once. OAuth tokens auto-refresh where supported.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={fetchAccounts}
                  disabled={loading}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Refresh"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["facebook", "instagram", "linkedin", "pinterest"] as SocialPlatform[]).map(
                  (platformId) => {
                    const platform = PLATFORMS[platformId];
                    const connected = accountsByPlatform.get(platformId) ?? [];
                    const Icon = PLATFORM_ICON_MAP[platform.icon];
                    const accent = ACCENTS[platform.accent];
                    return (
                      <div
                        key={platformId}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <div className={cn("rounded-lg p-2", accent.bg, accent.text)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{platform.label}</p>
                            {!platform.available && (
                              <Badge className="bg-amber-500/15 text-amber-700 text-[10px] uppercase dark:text-amber-400" variant="outline">
                                Coming soon
                              </Badge>
                            )}
                            {connected.length > 0 && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 text-[10px] uppercase dark:text-emerald-400" variant="outline">
                                {connected.length} connected
                              </Badge>
                            )}
                          </div>
                          {connected.map((acc) => (
                            <div
                              key={acc.id}
                              className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                            >
                              <div>
                                <p className="text-xs font-medium">{acc.displayName}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  Connected {relativeTime(acc.createdAt)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Disconnect ${acc.displayName}?`)) return;
                                  await fetch(`/api/social/accounts/${acc.id}`, {
                                    method: "DELETE",
                                  });
                                  fetchAccounts();
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Disconnect"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {platform.available ? (
                              <a
                                href={`/admin/social-auth/${platformId}`}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                              >
                                <Plug className="h-3 w-3" />
                                Connect{connected.length > 0 ? " another" : ""}
                              </a>
                            ) : (
                              <span className="rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                                OAuth setup coming next
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ToolFeedback toolId="social-poster" toolLabel="Social Poster" />
      </div>
    </div>
  );
}

function PostList({
  posts,
  accounts,
  onChange,
  emptyLabel,
}: {
  posts: SocialPostDTO[];
  accounts: SocialAccountDTO[];
  onChange: () => void;
  emptyLabel: string;
}) {
  const accById = useMemo(() => {
    const m = new Map<string, SocialAccountDTO>();
    for (const a of accounts) m.set(a.id, a);
    return m;
  }, [accounts]);

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <Card key={p.id}>
          <CardContent className="space-y-2 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{p.label || "(unlabeled)"}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Delete this post?")) return;
                  await fetch(`/api/social/posts/${p.id}`, { method: "DELETE" });
                  onChange();
                }}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Badge className="bg-muted text-muted-foreground" variant="outline">
                {p.status}
              </Badge>
              {p.scheduledFor && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {fmtDate(p.scheduledFor)}
                </span>
              )}
              {p.targetAccountIds.length > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Send className="h-3 w-3" />
                  {p.targetAccountIds
                    .map((id) => accById.get(id)?.displayName ?? "?")
                    .join(", ")}
                </span>
              )}
              {p.imageUrls.length > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  {p.imageUrls.length}
                </span>
              )}
            </div>
            {p.results && p.results.length > 0 && (
              <div className="space-y-1 border-t border-border pt-2">
                {p.results.map((r) => {
                  const acc = accById.get(r.accountId);
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate">
                        <Badge
                          className={cn(
                            "mr-1 text-[10px]",
                            r.status === "ok"
                              ? "bg-emerald-500/15 text-emerald-700"
                              : r.status === "error"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          )}
                          variant="outline"
                        >
                          {r.status}
                        </Badge>
                        {acc?.displayName ?? "?"}
                      </span>
                      {r.permalink && (
                        <a
                          href={r.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {r.error && <span className="text-destructive">{r.error}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
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
