"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolsNav } from "@/components/admin/tools-nav";
import { cn } from "@/lib/utils";

interface SopRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  version: string | null;
  owner: string | null;
  effective: string | null;
  updatedAt: string;
}

export default function SopsIndexPage() {
  const [rows, setRows] = useState<SopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sops");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows(data.sops || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function seed() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sops/seed", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Seed failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="sops" />

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
              <BookOpen className="h-8 w-8" />
              SOPs &amp; Internal Docs
            </h1>
            <p className="mt-2 text-muted-foreground">
              Editable standard operating procedures for the Exora production team.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={seed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              title="Insert built-in SOPs that don't already exist"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Seed Built-in SOPs
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No SOPs yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Click <strong>Seed Built-in SOPs</strong> to insert the Nano Banana Pro DTF
                workflow document. You can edit it inline afterward.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/admin/sops/${row.slug}`}
                className="group block"
              >
                <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2 text-lg">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>{row.title}</span>
                    </CardTitle>
                    {row.subtitle && <CardDescription>{row.subtitle}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {row.version && (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide">Version</dt>
                          <dd>{row.version}</dd>
                        </div>
                      )}
                      {row.owner && (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide">Owner</dt>
                          <dd>{row.owner}</dd>
                        </div>
                      )}
                      {row.effective && (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide">Effective</dt>
                          <dd>{row.effective}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Updated</dt>
                        <dd>{new Date(row.updatedAt).toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
