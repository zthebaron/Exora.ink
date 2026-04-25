/**
 * Real-ESRGAN upscaling via Replicate.
 *
 * When a generated image fails the effective-DPI check (or the user picked
 * an oversize print target), this lib upscales the image to a target size
 * that meets 300 DPI at the chosen print dimensions.
 *
 * Replicate model: nightmareai/real-esrgan
 * Docs: https://replicate.com/nightmareai/real-esrgan
 *
 * Cost: roughly $0.0019 per second of GPU. A 4K upscale typically completes
 * in a few seconds, so total cost is under $0.02 per image.
 */

import Replicate from "replicate";

// nightmareai/real-esrgan version pin (face_enhance available as input)
const REAL_ESRGAN_VERSION =
  "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa";

export interface UpscaleResult {
  /** URL to the upscaled image hosted by Replicate (valid for ~24h). */
  imageUrl: string;
  /** The scale factor that was applied (2x or 4x). */
  scale: 2 | 4;
  /** Approximate cost in USD. */
  costUsd: number;
}

function getClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      "Upscaling is not configured. Set REPLICATE_API_TOKEN in the environment."
    );
  }
  return new Replicate({ auth: token });
}

/**
 * Upscale an image to meet a target pixel size. Picks a Real-ESRGAN scale
 * factor (2 or 4) that gets us at least to the target. The function does NOT
 * crop or pad — the upscale ratio is uniform — but it returns the URL of an
 * image whose smallest dimension is >= the requested target.
 *
 * @param imageUrl     Public URL of the source image (or data: URI).
 * @param sourceWidth  Pixel width of source image.
 * @param sourceHeight Pixel height of source image.
 * @param targetMin    The smallest dimension we need at the destination.
 *                     Typically: max(targetW, targetH) * 300 / minDimInches.
 */
export async function upscaleImage(
  imageUrl: string,
  sourceWidth: number,
  sourceHeight: number,
  targetMin: number
): Promise<UpscaleResult> {
  const client = getClient();
  const sourceMin = Math.min(sourceWidth, sourceHeight);

  // Pick the smallest scale that meets or exceeds the target.
  let scale: 2 | 4 = 2;
  if (sourceMin * 2 < targetMin) scale = 4;

  // Real-ESRGAN's max useful scale is 4x. If even 4x doesn't get us there,
  // we still return the 4x result — the caller can either accept slightly
  // under target or chain another pass.

  const output = (await client.run(
    `nightmareai/real-esrgan:${REAL_ESRGAN_VERSION}`,
    {
      input: {
        image: imageUrl,
        scale,
        face_enhance: false,
      },
    }
  )) as unknown;

  // Replicate returns either a string URL or an array of URLs depending on the
  // model. nightmareai/real-esrgan returns a single string.
  const url =
    typeof output === "string"
      ? output
      : Array.isArray(output) && typeof output[0] === "string"
      ? (output[0] as string)
      : null;

  if (!url) {
    throw new Error("Real-ESRGAN returned no output URL");
  }

  // Rough cost estimate: ~3s GPU time at $0.0019/s for 2x, ~6s for 4x.
  const costUsd = scale === 4 ? 0.012 : 0.006;

  return { imageUrl: url, scale, costUsd };
}
