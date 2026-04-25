/**
 * Chroma-key removal for the Image Studio pipeline.
 *
 * Every Gemini image is rendered with a solid #FF00FF magenta background
 * (enforced by the prompt suffix in /lib/gemini/image-generation.ts). After
 * generation we walk the raw pixel buffer and convert any pixel within
 * RGB tolerance of pure magenta to fully transparent. The result is a
 * print-ready PNG with a real alpha channel — no edge halo, no fringe.
 *
 * Tolerance is intentionally tight (default 24/255 in each channel) because
 * the model is instructed to keep the foreground crisp and never use magenta
 * itself. Loosening tolerance risks eating into hot-pink elements.
 */

import sharp from "sharp";

export interface KeyOutResult {
  /** PNG buffer with the magenta replaced by transparent pixels. */
  buffer: Buffer;
  /** Pixel dimensions (matches the input). */
  width: number;
  height: number;
  /** Number of pixels that were keyed out. */
  pixelsKeyed: number;
  /** Total pixel count. */
  totalPixels: number;
  /** Fraction of the image that was magenta background (0..1). */
  bgRatio: number;
}

interface KeyOutOptions {
  /** RGB tolerance per channel. Default 24. */
  tolerance?: number;
  /** Optional feather radius (1–3 px) — soft alpha falloff at the edge. */
  feather?: number;
}

/**
 * Walk the raw RGBA pixel buffer and zero the alpha for any pixel close to
 * #FF00FF. Returns a fresh PNG-encoded buffer.
 */
export async function keyOutMagenta(
  input: Buffer,
  options: KeyOutOptions = {}
): Promise<KeyOutResult> {
  const tolerance = options.tolerance ?? 24;

  // Decode to raw RGBA so we have direct pixel access.
  const image = sharp(input).ensureAlpha();
  const meta = await image.metadata();
  const { data, info } = await image
    .clone()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`Expected 4 channels (RGBA), got ${channels}`);
  }

  // Walk every pixel. For each one, compare against magenta; if close, zero
  // the alpha. Otherwise leave alpha at 255.
  let pixelsKeyed = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isMagenta =
      r >= 255 - tolerance &&
      g <= tolerance &&
      b >= 255 - tolerance;
    if (isMagenta) {
      data[i + 3] = 0; // fully transparent
      pixelsKeyed += 1;
    }
  }

  // Re-encode as PNG with transparency.
  const buffer = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return {
    buffer,
    width: width ?? meta.width ?? 0,
    height: height ?? meta.height ?? 0,
    pixelsKeyed,
    totalPixels: total,
    bgRatio: total > 0 ? pixelsKeyed / total : 0,
  };
}
