/**
 * Friendly error formatter for upstream API failures.
 *
 * Google Gemini and Replicate both throw verbose JSON when quota or auth
 * issues hit. This util translates the raw text into a short, actionable
 * message and an HTTP status the client can branch on.
 */

export interface FormattedApiError {
  /** Operator-facing message ready to show in the UI. */
  message: string;
  /** HTTP status to return to the client. */
  status: number;
  /** Seconds to wait before retrying (parsed from upstream when available). */
  retryAfterSec?: number;
  /** Coarse error category for analytics or branching. */
  kind: "quota" | "auth" | "rate_limit" | "billing" | "config" | "upstream" | "unknown";
}

/**
 * Best-effort translation of an unknown error from a Google/Replicate call
 * into a clean status + message.
 */
export function formatUpstreamError(err: unknown): FormattedApiError {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  // Try to pull a JSON blob out of the message — both Gemini and Replicate
  // pass the upstream JSON body inside the error string.
  let parsed: { error?: { code?: number; status?: string; message?: string; details?: unknown[] } } | null = null;
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      parsed = JSON.parse(raw.slice(jsonStart));
    } catch {
      parsed = null;
    }
  }

  const upstreamCode = parsed?.error?.code;
  const upstreamStatus = parsed?.error?.status?.toUpperCase() ?? "";
  const upstreamMessage = parsed?.error?.message ?? raw;

  // Pull retryDelay (e.g. "56s") from Gemini's RetryInfo block.
  let retryAfterSec: number | undefined;
  const details = (parsed?.error?.details ?? []) as Array<Record<string, unknown>>;
  for (const d of details) {
    const delay = typeof d?.retryDelay === "string" ? d.retryDelay : null;
    if (delay) {
      const m = delay.match(/(\d+(?:\.\d+)?)/);
      if (m) {
        retryAfterSec = Math.ceil(parseFloat(m[1]));
        break;
      }
    }
  }
  // Fallback: scan the message text for "retry in 56s"
  if (!retryAfterSec) {
    const m = upstreamMessage.match(/retry\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
    if (m) retryAfterSec = Math.ceil(parseFloat(m[1]));
  }

  // Classify
  if (upstreamStatus === "RESOURCE_EXHAUSTED" || upstreamCode === 429 || lower.includes("quota")) {
    const billing = lower.includes("free_tier") || lower.includes("billing");
    const wait = retryAfterSec ? ` Wait ${retryAfterSec}s and try again` : " Try again shortly";
    return {
      message: billing
        ? `Gemini quota exceeded on the free tier — image generation needs paid billing enabled on your Google Cloud project.${wait}.`
        : `Gemini rate limit hit.${wait}.`,
      status: 429,
      retryAfterSec,
      kind: billing ? "billing" : "quota",
    };
  }

  if (upstreamCode === 401 || upstreamCode === 403 || lower.includes("api key not valid") || lower.includes("permission_denied") || upstreamStatus === "UNAUTHENTICATED") {
    return {
      message: "Authentication failed — check that GEMINI_API_KEY is set correctly and the key has access to the image model.",
      status: 401,
      kind: "auth",
    };
  }

  if (lower.includes("not configured") || lower.includes("is not set")) {
    return {
      message: raw,
      status: 500,
      kind: "config",
    };
  }

  if (upstreamCode && upstreamCode >= 500) {
    return {
      message: "The image service is having trouble right now. Try again in a moment.",
      status: 502,
      kind: "upstream",
    };
  }

  // Default: pass through the cleanest message we have, but cap length.
  const trimmed = upstreamMessage.length > 240 ? upstreamMessage.slice(0, 240) + "…" : upstreamMessage;
  return {
    message: trimmed,
    status: typeof upstreamCode === "number" ? upstreamCode : 500,
    kind: "unknown",
  };
}
