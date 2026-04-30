/**
 * Match the batch enhancer's output dimensions to the source image.
 *
 * Gemini only accepts a small fixed set of aspect ratios. The model also
 * decides its own output resolution within that ratio (~1K for Preview,
 * ~4K for Production). To deliver "same size as input", the pipeline:
 *
 *   1. Measures the source image's pixel dimensions.
 *   2. Picks the closest Gemini-supported aspect ratio so the model
 *      composes the enhancement near the right shape.
 *   3. Resizes the model's output back to the exact source dimensions
 *      via canvas (after enhancement, before watermarking).
 *
 * The "preserveSize" flag in the UI defaults to true. Operators who want
 * a different output shape can toggle it off and pick an explicit ratio.
 */

/** Aspect ratios accepted by gemini-2.5-flash-image and gemini-3-pro-image. */
export const SUPPORTED_RATIOS = [
  { id: "1:1", w: 1, h: 1 },
  { id: "3:4", w: 3, h: 4 },
  { id: "4:3", w: 4, h: 3 },
  { id: "9:16", w: 9, h: 16 },
  { id: "16:9", w: 16, h: 9 },
] as const;

export type SupportedRatioId = (typeof SUPPORTED_RATIOS)[number]["id"];

export function pickClosestAspectRatio(
  width: number,
  height: number
): SupportedRatioId {
  if (!width || !height) return "1:1";
  const sourceRatio = width / height;
  let bestId: SupportedRatioId = "1:1";
  let bestDiff = Infinity;
  for (const r of SUPPORTED_RATIOS) {
    const diff = Math.abs(sourceRatio - r.w / r.h);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestId = r.id;
    }
  }
  return bestId;
}

/** Read natural pixel dimensions from a Blob/File. */
export function getImageDimensions(
  source: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

/**
 * Resize a PNG/JPEG Blob to exact target dimensions via canvas. Uses
 * "cover" fit by default — fills the target frame and crops symmetrically
 * if the aspect ratios drift. Pass mode="contain" to letterbox instead.
 */
export async function resizeToExact(
  source: Blob,
  targetWidth: number,
  targetHeight: number,
  mode: "cover" | "contain" = "cover"
): Promise<Blob> {
  if (!targetWidth || !targetHeight) return source;
  const url = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image decode failed"));
      i.src = url;
    });

    if (img.naturalWidth === targetWidth && img.naturalHeight === targetHeight) {
      return source;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");

    // High-quality resampling.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const sourceRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = targetWidth / targetHeight;

    if (mode === "contain") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      let drawW: number;
      let drawH: number;
      if (sourceRatio > targetRatio) {
        drawW = targetWidth;
        drawH = drawW / sourceRatio;
      } else {
        drawH = targetHeight;
        drawW = drawH * sourceRatio;
      }
      const x = (targetWidth - drawW) / 2;
      const y = (targetHeight - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    } else {
      // cover: scale to fill, crop the overflow symmetrically.
      let srcW: number;
      let srcH: number;
      let srcX: number;
      let srcY: number;
      if (sourceRatio > targetRatio) {
        // source is wider — crop sides
        srcH = img.naturalHeight;
        srcW = srcH * targetRatio;
        srcX = (img.naturalWidth - srcW) / 2;
        srcY = 0;
      } else {
        // source is taller — crop top/bottom
        srcW = img.naturalWidth;
        srcH = srcW / targetRatio;
        srcX = 0;
        srcY = (img.naturalHeight - srcH) / 2;
      }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/png"
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
