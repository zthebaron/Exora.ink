"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolsNav } from "@/components/admin/tools-nav";
import { ToolFeedback } from "@/components/admin/tool-feedback";
import { buildAuthorizeUrl } from "@/lib/dropbox/oauth";

type Status =
  | { ready: true; mode: "refresh" | "access-token"; hotFolder: string; appKey: string | null; hasAppKey: boolean; hasAppSecret: boolean; missing: string[] }
  | { ready: false; mode: "none"; hotFolder: string; appKey: string | null; hasAppKey: boolean; hasAppSecret: boolean; missing: string[] };

export default function DropboxAuthPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [code, setCode] = useState("");
  const [exchanging, setExchanging] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const redirectUri = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/admin/dropbox-auth`;
  }, []);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/dropbox/auth/status", { cache: "no-store" });
      if (res.ok) setStatus((await res.json()) as Status);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // If Dropbox bounced us back with a code in the URL, capture it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const c = url.searchParams.get("code");
    const e = url.searchParams.get("error");
    if (e) {
      setError(`Dropbox returned an error: ${e}`);
      window.history.replaceState({}, "", url.pathname);
      return;
    }
    if (c) {
      setCode(c);
      // Clean the URL so refreshes don't try to re-exchange.
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  const exchange = async () => {
    if (!code) {
      setError("Paste an authorization code first, or click Connect Dropbox to get one.");
      return;
    }
    setError(null);
    setExchanging(true);
    try {
      const res = await fetch("/api/dropbox/auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Exchange failed (${res.status})`);
      }
      setRefreshToken(data.refreshToken);
      setAccountId(data.accountId ?? null);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exchange failed");
    } finally {
      setExchanging(false);
    }
  };

  const copyToken = async () => {
    if (!refreshToken) return;
    await navigator.clipboard.writeText(refreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStartAuth = !!status?.appKey;

  const authorizeUrl = useMemo(() => {
    if (!status?.appKey || !redirectUri) return "";
    return buildAuthorizeUrl(status.appKey, redirectUri);
  }, [status?.appKey, redirectUri]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ToolsNav currentTool="dropbox-auth" />

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Cloud className="h-3 w-3" />
            Dropbox Hot Folder
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Dropbox Authentication
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Connects the Image Studio &ldquo;Send to Hot Folder&rdquo; button to your Dropbox.
            One-time setup — produces a long-lived refresh token that automatically renews
            short-lived access tokens behind the scenes.
          </p>
        </div>

        {/* Connection status */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-base">Status</CardTitle>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Refresh status"
            >
              <RefreshCw className={cn("h-4 w-4", loadingStatus && "animate-spin")} />
            </button>
          </CardHeader>
          <CardContent>
            {!status ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : status.ready ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Connected ({status.mode === "refresh" ? "long-lived refresh token" : "short-lived access token"})
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Hot folder: <code className="rounded bg-muted px-1 py-0.5">{status.hotFolder}</code>
                  </p>
                  {status.mode === "access-token" && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⚠ Using a short-lived access token. It expires in 4 hours. Set up the
                      refresh-token flow below for permanent operation.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Not configured</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Missing env vars: <code className="rounded bg-muted px-1 py-0.5">{status.missing.join(", ") || "all"}</code>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 1: Set up the Dropbox app */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Step 1 — Create your Dropbox app</CardTitle>
            <CardDescription>One-time, takes about 2 minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                Open{" "}
                <a
                  href="https://www.dropbox.com/developers/apps/create"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                >
                  Dropbox developer app creation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Choose <strong>Scoped access</strong> → <strong>App folder</strong> → name it (e.g. <code className="rounded bg-muted px-1 py-0.5">Exora-RIP</code>).</li>
              <li>
                On the <strong>Permissions</strong> tab, check <code className="rounded bg-muted px-1 py-0.5">files.content.write</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">files.content.read</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">sharing.write</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">sharing.read</code> → <strong>Submit</strong>.
              </li>
              <li>
                On the <strong>Settings</strong> tab, find <strong>Redirect URIs</strong> and add:
                <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1.5 text-xs">{redirectUri}</pre>
              </li>
              <li>
                Copy the <strong>App key</strong> and <strong>App secret</strong> from the Settings page,
                add them to <code className="rounded bg-muted px-1 py-0.5">.env.local</code> (and Vercel Settings → Environment Variables):
                <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1.5 text-xs">{`DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret`}</pre>
              </li>
              <li>Restart the dev server (or redeploy on Vercel) so the env vars load.</li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 2: Authorize */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Step 2 — Authorize</CardTitle>
            <CardDescription>
              Click connect, log in to Dropbox, approve. You&apos;ll be redirected back here with a code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canStartAuth ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Set <code className="rounded bg-muted px-1 py-0.5">DROPBOX_APP_KEY</code> in your environment first (see Step 1).
                </span>
              </div>
            ) : (
              <a
                href={authorizeUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Cloud className="h-4 w-4" />
                Connect Dropbox
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            )}

            {code && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  ✓ Authorization code received. Click below to exchange it for a refresh token.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{code}</code>
                  <button
                    type="button"
                    onClick={exchange}
                    disabled={exchanging}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {exchanging ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Exchanging…
                      </>
                    ) : (
                      "Exchange for token"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manual code entry fallback */}
            {!code && !refreshToken && (
              <details className="rounded-lg border border-border bg-muted/30 p-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Got a code already? Paste it here.
                </summary>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    placeholder="Authorization code from Dropbox"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={exchange}
                    disabled={exchanging || !code}
                    className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Exchange
                  </button>
                </div>
              </details>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Refresh token */}
        {refreshToken && (
          <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Step 3 — Save the refresh token
              </CardTitle>
              <CardDescription>
                Add this value to <code className="rounded bg-muted px-1 py-0.5">.env.local</code> (and Vercel
                env vars) and restart the dev server. Refresh tokens don&apos;t expire — paste once, done forever.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  DROPBOX_REFRESH_TOKEN
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-2 py-1.5 font-mono text-xs">
                    {refreshToken}
                  </code>
                  <button
                    type="button"
                    onClick={copyToken}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                      copied
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              {accountId && (
                <p className="text-xs text-muted-foreground">
                  Connected account: <code className="rounded bg-muted px-1 py-0.5">{accountId}</code>
                </p>
              )}
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="font-medium text-foreground">Add to .env.local:</p>
                <pre className="mt-1 overflow-x-auto">{`DROPBOX_REFRESH_TOKEN=${refreshToken}`}</pre>
                <p className="mt-2 font-medium text-foreground">Add to Vercel:</p>
                <p className="mt-0.5 text-muted-foreground">
                  Project Settings → Environment Variables → add{" "}
                  <code className="rounded bg-background px-1">DROPBOX_REFRESH_TOKEN</code> with this
                  value, scope: Production + Preview + Development.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <ToolFeedback toolId="dropbox-auth" toolLabel="Dropbox Hot Folder" />
      </div>
    </div>
  );
}
