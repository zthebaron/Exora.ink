/**
 * Client-side watermarking for the Batch Image Enhancer outputs.
 *
 * Default behavior: every enhanced image gets a diagonal "EXORA · PROOF"
 * watermark applied via canvas. Operators see this watermarked version
 * in the queue, the comparison slider, and the downloaded file.
 *
 * The unwatermarked original lives in memory (the original output blob).
 * It only gets exposed when the operator unlocks the session by entering
 * the password configured at BATCH_ENHANCE_UNLOCK_PASSWORD on the server.
 *
 * Security note: this is a UX guard, not real DRM. The unlocked blob
 * gets handed to the browser the moment the password is verified, so
 * a determined operator with devtools could find it. The point is to
 * prevent careless distribution of drafts to clients while still
 * letting the legitimate operator finish their work.
 */

export interface WatermarkOptions {
  /** Main watermark text. */
  text?: string;
  /** Subtext shown below. */
  subtext?: string;
  /** Opacity 0..1. Lower = more subtle, harder to ignore. */
  opacity?: number;
  /** Tile spacing in image-space pixels. */
  spacing?: number;
}

/**
 * Apply a diagonal repeating watermark to a Blob containing an image.
 * Returns a new PNG Blob.
 */
export async function applyWatermark(
  source: Blob,
  options: WatermarkOptions = {}
): Promise<Blob> {
  const {
    text = "EXORA · PROOF",
    subtext = "exora.ink",
    opacity = 0.32,
    spacing = 280,
  } = options;

  const url = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image decode failed"));
      i.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.drawImage(img, 0, 0);

    // Watermark layer
    const fontSize = Math.max(28, Math.round(canvas.width / 32));
    const subSize = Math.max(14, Math.round(fontSize * 0.42));
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6); // -30°

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = Math.max(1, fontSize / 16);
    ctx.font = `700 ${fontSize}px "ui-sans-serif", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

    // Cover the rotated bounding box generously.
    const reach = Math.hypot(canvas.width, canvas.height);
    const start = -reach / 2;
    const end = reach / 2;
    for (let y = start; y < end; y += spacing) {
      for (let x = start; x < end; x += spacing * 1.3) {
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        if (subtext) {
          ctx.font = `500 ${subSize}px "ui-monospace", SFMono-Regular, Menlo, monospace`;
          ctx.strokeText(subtext, x, y + fontSize * 0.85);
          ctx.fillText(subtext, x, y + fontSize * 0.85);
          ctx.font = `700 ${fontSize}px "ui-sans-serif", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
        }
      }
    }
    ctx.restore();

    // Subtle corner badge so even cropped exports show the mark.
    ctx.save();
    ctx.globalAlpha = Math.min(1, opacity * 1.6);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    const padX = Math.max(12, canvas.width / 80);
    const padY = Math.max(8, canvas.height / 120);
    const badgeFont = Math.max(12, Math.round(canvas.width / 80));
    ctx.font = `600 ${badgeFont}px "ui-monospace", SFMono-Regular, Menlo, monospace`;
    const badgeText = "PROOF · exora.ink";
    const metrics = ctx.measureText(badgeText);
    const badgeW = metrics.width + padX * 2;
    const badgeH = badgeFont + padY * 2;
    const bx = canvas.width - badgeW - 12;
    const by = canvas.height - badgeH - 12;
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(badgeText, bx + padX, by + padY);
    ctx.restore();

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
