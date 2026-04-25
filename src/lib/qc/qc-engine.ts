/**
 * Server-side QC engine.
 *
 * Runs the full set of checks on a generated image buffer using sharp +
 * exifr. Returns a structured QCResult that the client renders into the
 * <ImageQCPanel />.
 *
 * Checks performed:
 *   1. Pixel dimensions
 *   2. Effective DPI at target print size  (the real gate)
 *   3. Metadata DPI (cosmetic / informational)
 *   4. Transparency (alpha channel present)
 *   5. Color mode (RGB vs CMYK)
 *   6. Edge bleed (foreground touching canvas edge)
 *   7. File size (RIP software cap)
 */

import sharp from "sharp";
import exifr from "exifr";
import type { QCCheck, QCResult, QCStatus, PrintTarget } from "./types";

const MIN_DPI = 300;
const MAX_FILE_MB = 50;

const HELP_TEXT = {
  dimensions:
    "The raw pixel size of the image. DTF print quality is anchored to dimensions, not stated DPI.",
  effectiveDpi:
    "The actual DPI you'll get at the selected print size: min(width, height) ÷ min(printWidth, printHeight). 300+ is the DTF gate.",
  metadataDpi:
    "DPI tag stored inside the image file. Cosmetic only — most modern image generators leave this at 72 even when the pixel resolution is excellent. Use Effective DPI as the real gate.",
  transparency:
    "DTF transfers expect either a transparent PNG or a #FF00FF chroma-key background so the RIP can isolate the foreground.",
  colorMode:
    "DTF RIP software requires RGB. CMYK files must be converted before printing.",
  edgeBleed:
    "Foreground content touching the canvas edge will be cut off by the transfer film margin. DTF needs at least a few pixels of clear background on every side.",
  fileSize:
    "RIP software can stall or run out of memory on files over 50 MB. Down-sample or re-export if you exceed this.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(
  id: string,
  label: string,
  value: string,
  help: string,
  detail?: string
): QCCheck {
  return { id, label, value, status: "pass", detail, help };
}

function warn(
  id: string,
  label: string,
  value: string,
  detail: string,
  help: string
): QCCheck {
  return { id, label, value, status: "warn", detail, help };
}

function fail(
  id: string,
  label: string,
  value: string,
  detail: string,
  help: string
): QCCheck {
  return { id, label, value, status: "fail", detail, help };
}

function info(
  id: string,
  label: string,
  value: string,
  help: string
): QCCheck {
  return { id, label, value, status: "info", help };
}

// ---------------------------------------------------------------------------
// Edge bleed detection
// ---------------------------------------------------------------------------

/**
 * Sample edge pixels and determine whether non-background content reaches
 * the canvas edge. "Background" means either fully transparent (alpha = 0)
 * or chroma-key magenta (#FF00FF within tolerance).
 *
 * Returns true if bleed is detected.
 */
async function detectEdgeBleed(image: sharp.Sharp): Promise<boolean> {
  const { data, info: meta } = await image
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = meta;
  const tol = 16; // RGB tolerance for magenta detection
  const sampleEvery = Math.max(1, Math.round(Math.min(width, height) / 200));

  function isBg(idx: number): boolean {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = channels >= 4 ? data[idx + 3] : 255;
    if (a < 8) return true; // fully transparent
    // magenta: R≈255, G≈0, B≈255
    if (r >= 255 - tol && g <= tol && b >= 255 - tol) return true;
    return false;
  }

  // Top + bottom rows
  for (let x = 0; x < width; x += sampleEvery) {
    if (!isBg((0 * width + x) * channels)) return true;
    if (!isBg(((height - 1) * width + x) * channels)) return true;
  }
  // Left + right columns
  for (let y = 0; y < height; y += sampleEvery) {
    if (!isBg((y * width + 0) * channels)) return true;
    if (!isBg((y * width + (width - 1)) * channels)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function runQC(
  buffer: Buffer,
  printTarget: PrintTarget
): Promise<QCResult> {
  const checks: QCCheck[] = [];
  const image = sharp(buffer);
  const meta = await image.metadata();

  const widthPx = meta.width ?? 0;
  const heightPx = meta.height ?? 0;
  const bytes = buffer.byteLength;
  const hasAlpha = !!meta.hasAlpha;
  const colorSpace = (meta.space ?? "unknown").toLowerCase();
  const channels = meta.channels ?? 0;

  // 1. Pixel dimensions
  const minPxNeeded =
    Math.min(printTarget.widthIn, printTarget.heightIn) * MIN_DPI;
  const minPxActual = Math.min(widthPx, heightPx);
  const dimsValue = `${widthPx.toLocaleString()} × ${heightPx.toLocaleString()} px`;
  if (minPxActual >= minPxNeeded) {
    checks.push(ok("dimensions", "Pixel dimensions", dimsValue, HELP_TEXT.dimensions));
  } else {
    checks.push(
      fail(
        "dimensions",
        "Pixel dimensions",
        dimsValue,
        `Need at least ${minPxNeeded.toLocaleString()} px on the shortest side for ${printTarget.label} at ${MIN_DPI} DPI.`,
        HELP_TEXT.dimensions
      )
    );
  }

  // 2. Effective DPI
  const minPrintIn = Math.min(printTarget.widthIn, printTarget.heightIn);
  const effectiveDpi = Math.floor(minPxActual / minPrintIn);
  const maxPrintIn = (minPxActual / MIN_DPI).toFixed(2);
  const effValue = `${effectiveDpi} DPI @ ${printTarget.widthIn}" × ${printTarget.heightIn}"`;
  if (effectiveDpi >= MIN_DPI) {
    checks.push(
      ok(
        "effective-dpi",
        "Effective DPI",
        effValue,
        HELP_TEXT.effectiveDpi
      )
    );
  } else {
    checks.push(
      fail(
        "effective-dpi",
        "Effective DPI",
        effValue,
        `Below ${MIN_DPI} DPI. Max recommended print size at this resolution: ${maxPrintIn}" × ${maxPrintIn}". Upscale to print larger.`,
        HELP_TEXT.effectiveDpi
      )
    );
  }

  // 3. Metadata DPI (cosmetic)
  let metadataDpi = "—";
  try {
    const exif = await exifr.parse(buffer, ["XResolution", "YResolution"]).catch(() => null);
    if (exif?.XResolution && exif?.YResolution) {
      const x = typeof exif.XResolution === "number" ? exif.XResolution : Number(exif.XResolution);
      const y = typeof exif.YResolution === "number" ? exif.YResolution : Number(exif.YResolution);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        metadataDpi = x === y ? `${Math.round(x)} DPI` : `${Math.round(x)} × ${Math.round(y)} DPI`;
      }
    } else if (meta.density) {
      metadataDpi = `${meta.density} DPI`;
    }
  } catch {
    // ignore — exifr can throw on unusual files
  }
  checks.push(
    info("metadata-dpi", "Metadata DPI (cosmetic)", metadataDpi, HELP_TEXT.metadataDpi)
  );

  // 4. Transparency
  if (hasAlpha) {
    checks.push(
      ok("transparency", "Transparency", "Alpha channel present", HELP_TEXT.transparency)
    );
  } else {
    checks.push(
      warn(
        "transparency",
        "Transparency",
        "Solid background",
        "No alpha channel — assuming #FF00FF chroma-key. Use the keying step before sending to RIP.",
        HELP_TEXT.transparency
      )
    );
  }

  // 5. Color mode
  let colorMode = "unknown";
  let colorStatus: QCStatus = "info";
  if (colorSpace.includes("rgb")) {
    colorMode = hasAlpha || channels >= 4 ? "rgba" : "rgb";
    colorStatus = "pass";
  } else if (colorSpace.includes("cmyk")) {
    colorMode = "cmyk";
    colorStatus = "fail";
  } else if (colorSpace.includes("gray") || colorSpace.includes("b-w")) {
    colorMode = "gray";
    colorStatus = "info";
  }
  if (colorStatus === "pass") {
    checks.push(ok("color-mode", "Color mode", colorMode.toUpperCase(), HELP_TEXT.colorMode));
  } else if (colorStatus === "fail") {
    checks.push(
      fail(
        "color-mode",
        "Color mode",
        colorMode.toUpperCase(),
        "Convert to RGB before sending to your DTF RIP — CMYK images render incorrectly.",
        HELP_TEXT.colorMode
      )
    );
  } else {
    checks.push(info("color-mode", "Color mode", colorMode.toUpperCase(), HELP_TEXT.colorMode));
  }

  // 6. Edge bleed
  let edgeBleed = false;
  try {
    edgeBleed = await detectEdgeBleed(image);
  } catch {
    // skip silently if sharp can't decode
  }
  if (edgeBleed) {
    checks.push(
      warn(
        "edge-bleed",
        "Edge clearance",
        "Foreground touches canvas edge",
        "Re-generate with explicit padding instructions or crop the artwork before printing.",
        HELP_TEXT.edgeBleed
      )
    );
  } else {
    checks.push(ok("edge-bleed", "Edge clearance", "Clear", HELP_TEXT.edgeBleed));
  }

  // 7. File size
  const mb = bytes / (1024 * 1024);
  const sizeValue = `${mb.toFixed(2)} MB`;
  if (mb <= MAX_FILE_MB) {
    checks.push(ok("file-size", "File size", sizeValue, HELP_TEXT.fileSize));
  } else {
    checks.push(
      warn(
        "file-size",
        "File size",
        sizeValue,
        `Over ${MAX_FILE_MB} MB — RIP software may stall.`,
        HELP_TEXT.fileSize
      )
    );
  }

  const pass = checks.every((c) => c.status === "pass" || c.status === "info");

  return {
    checks,
    pass,
    effectiveDpi,
    widthPx,
    heightPx,
    bytes,
    printTarget: {
      widthIn: printTarget.widthIn,
      heightIn: printTarget.heightIn,
      label: printTarget.label,
    },
    hasAlpha,
    colorMode,
    edgeBleed,
  };
}
