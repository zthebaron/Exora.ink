"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Edit3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackEntry {
  id: string;
  toolId: string;
  author: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface ToolFeedbackProps {
  /** Stable tool identifier — matches AdminTool.id (e.g. "image-studio"). */
  toolId: string;
  /** Friendly tool label shown in the section header. */
  toolLabel?: string;
}

const AUTHOR_KEY = "exora.toolFeedback.author";

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ToolFeedback({ toolId, toolLabel }: ToolFeedbackProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  // Remember the operator's name across page loads so they don't retype.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthor(localStorage.getItem(AUTHOR_KEY) ?? "");
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/tool-feedback?tool=${encodeURIComponent(toolId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Persist author for next time.
      if (typeof window !== "undefined") {
        if (author.trim()) {
          localStorage.setItem(AUTHOR_KEY, author.trim());
        }
      }
      const res = await fetch("/api/admin/tool-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, author: author.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setBody("");
      setEntries((prev) => [data.entry, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post note");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (entry: FeedbackEntry) => {
    setEditingId(entry.id);
    setEditBody(entry.body);
    setEditAuthor(entry.author ?? "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
    setEditAuthor("");
  };

  const saveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/tool-feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: editAuthor.trim(), body: editBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                author: editAuthor.trim() || null,
                body: editBody.trim(),
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this note?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`/api/admin/tool-feedback/${id}`, { method: "DELETE" });
    } catch {
      fetchEntries();
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" />
              Notes & feedback
              {entries.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {entries.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Operator notes for {toolLabel ?? "this tool"} — workflows, gotchas, settings to
              remember. Visible to anyone with admin access.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={fetchEntries}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <form onSubmit={submit} className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name (optional, remembered)"
              className="h-8 max-w-[260px] text-xs"
            />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {body.length}/4000
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 4000))}
            rows={3}
            placeholder="Drop a note — gotcha, config tweak, lesson learned…"
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Post note
            </button>
          </div>
        </form>

        {/* Notes list */}
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            No notes yet. Be the first to leave one.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const isEditing = editingId === entry.id;
              const wasEdited =
                entry.updatedAt &&
                entry.createdAt &&
                new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000;
              return (
                <li
                  key={entry.id}
                  className="group rounded-lg border border-border bg-card p-3"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        placeholder="Author"
                        className="h-8 max-w-[260px] text-xs"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value.slice(0, 4000))}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(entry.id)}
                          disabled={!editBody.trim()}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Badge className="bg-muted text-foreground" variant="outline">
                            {entry.author?.trim() || "Anonymous"}
                          </Badge>
                          <span>·</span>
                          <span>{relativeTime(entry.createdAt)}</span>
                          {wasEdited && (
                            <span className="italic opacity-70">(edited)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="rounded p-1 text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(entry.id)}
                            className="rounded p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {entry.body}
                      </p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
