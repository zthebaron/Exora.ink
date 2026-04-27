"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Check, Eye, Loader2, Pencil, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ToolsNav } from "@/components/admin/tools-nav";

interface Sop {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  version: string | null;
  owner: string | null;
  effective: string | null;
  contentMd: string;
  updatedAt: string;
}

type Mode = "view" | "edit";

export default function SopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sop, setSop] = useState<Sop | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("view");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Editable form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [version, setVersion] = useState("");
  const [owner, setOwner] = useState("");
  const [effective, setEffective] = useState("");
  const [contentMd, setContentMd] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sops/${slug}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      const s: Sop = data.sop;
      setSop(s);
      setTitle(s.title);
      setSubtitle(s.subtitle ?? "");
      setVersion(s.version ?? "");
      setOwner(s.owner ?? "");
      setEffective(s.effective ?? "");
      setContentMd(s.contentMd);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function save() {
    if (!sop) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sops/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          version: version || null,
          owner: owner || null,
          effective: effective || null,
          contentMd,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      const data = await res.json();
      setSop(data.sop);
      setSavedAt(Date.now());
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (!sop) return;
    setTitle(sop.title);
    setSubtitle(sop.subtitle ?? "");
    setVersion(sop.version ?? "");
    setOwner(sop.owner ?? "");
    setEffective(sop.effective ?? "");
    setContentMd(sop.contentMd);
    setMode("view");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/admin/sops" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All SOPs
        </Link>
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "SOP not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="sops" />

        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/admin/sops" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All SOPs
          </Link>
          <div className="flex items-center gap-2">
            {savedAt && Date.now() - savedAt < 4000 && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {mode === "view" ? (
              <button
                onClick={() => setMode("edit")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={cancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === "view" ? (
          <article>
            <header className="mb-6 border-b border-border pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Exora Ink &middot; Standard Operating Procedure
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {sop.title}
              </h1>
              {sop.subtitle && (
                <p className="mt-2 text-lg text-muted-foreground">{sop.subtitle}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {sop.version && <>Version {sop.version} &nbsp;&middot;&nbsp; </>}
                {sop.owner && <>Owner: {sop.owner} &nbsp;&middot;&nbsp; </>}
                {sop.effective && <>Effective: {sop.effective}</>}
              </p>
            </header>
            <div className="sop-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.contentMd}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Subtitle
                  </label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Version
                    </label>
                    <input
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Owner
                    </label>
                    <input
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Effective
                    </label>
                    <input
                      value={effective}
                      onChange={(e) => setEffective(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="border-b border-border lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Pencil className="h-3.5 w-3.5" /> Markdown
                    </div>
                    <textarea
                      value={contentMd}
                      onChange={(e) => setContentMd(e.target.value)}
                      spellCheck
                      className="block min-h-[600px] w-full resize-y bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" /> Live Preview
                    </div>
                    <div className="min-h-[600px] overflow-auto p-4">
                      <div className="sop-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMd}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
