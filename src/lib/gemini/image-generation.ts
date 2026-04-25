/**
 * Gemini image generation library — two tiers:
 *
 *   • Preview  (gemini-2.5-flash-image)        — fast 1K iteration, ~$0.04
 *   • Production (gemini-3-pro-image-preview)  — 4K final, ~$0.24
 *
 * Both functions accept the user's prompt and an optional list of reference
 * images (base64) for edit/remix mode. The chroma-key DTF suffix is appended
 * server-side here so it cannot be bypassed from the client.
 */

import { GoogleGenAI, Modality } from "@google/genai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenerationTier = "preview" | "production";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ImageReference {
  /** Image MIME type (image/png, image/jpeg, image/webp). */
  mimeType: string;
  /** Base64-encoded image bytes (no data: prefix). */
  data: string;
}

export interface GenerationResult {
  /** Raw image bytes. */
  buffer: Buffer;
  /** MIME type of the returned image (usually image/png). */
  mimeType: string;
  /** Any text the model returned alongside the image (rare). */
  text: string;
  /** Model id actually used. */
  model: string;
  /** Resolution label for cost tracking ('1K' | '2K' | '4K'). */
  resolution: "1K" | "2K" | "4K";
  /** USD cost estimate for this generation. */
  costUsd: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PREVIEW_MODEL = "gemini-2.5-flash-image";
export const PRODUCTION_MODEL = "gemini-3-pro-image-preview";

export const PREVIEW_COST_USD = 0.04;
export const PRODUCTION_COST_USD = 0.24;

/**
 * Mandatory chroma-key + DTF crispness requirements appended to every prompt.
 * Magenta (#FF00FF) is used because it's almost never present in real artwork
 * and keys out cleanly in downstream RIP workflows without the alpha-fringe
 * halo problem of "transparent PNG" outputs.
 */
const CHROMA_KEY_SUFFIX = `

MANDATORY OUTPUT REQUIREMENTS (DTF print production):
- The background MUST be a solid flat magenta fill at exactly #FF00FF (rgb 255, 0, 255). No gradient, no vignette, no shadow, no texture — pure uniform magenta.
- The foreground artwork MUST NOT contain any pixel of #FF00FF or any magenta/fuchsia shade close to it. If the design calls for pink, use a different hue (e.g. #FF69B4 hot pink or #FF1493 deep pink), never pure magenta.
- Keep edges hard and crisp against the magenta background. Do not anti-alias into magenta, do not leave a semi-transparent fringe, glow, or halo. Every pixel should be either fully opaque foreground or fully #FF00FF background.
- Output a flat rectangular image — do not return a transparent PNG. The magenta is the background.`;

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Image Studio is not configured. Set GEMINI_API_KEY in the environment."
    );
  }
  return new GoogleGenAI({ apiKey });
}

function buildParts(
  prompt: string,
  refs?: ImageReference[]
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: `${prompt.trim()}${CHROMA_KEY_SUFFIX}` }];
  if (refs && refs.length > 0) {
    for (const ref of refs) {
      parts.push({
        inlineData: { mimeType: ref.mimeType, data: ref.data },
      });
    }
  }
  return parts;
}

interface GenContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<
        | { text?: string }
        | { inlineData?: { mimeType?: string; data?: string } }
      >;
    };
  }>;
}

function extractImage(
  response: GenContentResponse
): { buffer: Buffer; mimeType: string; text: string } | null {
  const candidates = response.candidates ?? [];
  let imageBytes: string | null = null;
  let imageMime = "image/png";
  let text = "";

  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if ("inlineData" in part && part.inlineData?.data) {
        imageBytes = part.inlineData.data;
        imageMime = part.inlineData.mimeType ?? "image/png";
      } else if ("text" in part && part.text) {
        text += part.text;
      }
    }
  }

  if (!imageBytes) return null;

  return {
    buffer: Buffer.from(imageBytes, "base64"),
    mimeType: imageMime,
    text,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a fast 1K preview using gemini-2.5-flash-image (Nano Banana).
 * Used for rapid iteration on prompt, composition, style.
 */
export async function generatePreview(
  prompt: string,
  refs?: ImageReference[],
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const ai = getClient();
  const parts = buildParts(prompt, refs);

  const response = (await ai.models.generateContent({
    model: PREVIEW_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      // 2.5-flash-image accepts an aspectRatio hint via imageConfig.
      imageConfig: { aspectRatio },
    },
  })) as GenContentResponse;

  const extracted = extractImage(response);
  if (!extracted) {
    throw new Error(
      "Preview model returned no image. The request may have been refused."
    );
  }

  return {
    ...extracted,
    model: PREVIEW_MODEL,
    resolution: "1K",
    costUsd: PREVIEW_COST_USD,
  };
}

/**
 * Generate a 4K production-quality image using gemini-3-pro-image-preview
 * (Nano Banana Pro). Always opt-in — never auto-call this from a preview.
 */
export async function generateProduction(
  prompt: string,
  refs?: ImageReference[],
  aspectRatio: AspectRatio = "1:1"
): Promise<GenerationResult> {
  const ai = getClient();
  const parts = buildParts(prompt, refs);

  const response = (await ai.models.generateContent({
    model: PRODUCTION_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: {
        aspectRatio,
        imageSize: "4K", // Per Gemini 3 Pro Image docs.
      },
    },
  })) as GenContentResponse;

  const extracted = extractImage(response);
  if (!extracted) {
    throw new Error(
      "Production model returned no image. The request may have been refused."
    );
  }

  return {
    ...extracted,
    model: PRODUCTION_MODEL,
    resolution: "4K",
    costUsd: PRODUCTION_COST_USD,
  };
}
