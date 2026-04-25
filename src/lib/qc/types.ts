/**
 * QC (Quality Control) types — shared between the server-side engine
 * (sharp + exifr based) and the client-side <ImageQCPanel /> component.
 *
 * Each check returns a status, a label, a numeric or string value, and an
 * optional warning explaining what to do about it.
 */

export type QCStatus = "pass" | "warn" | "fail" | "info";

export interface QCCheck {
  id: string;
  label: string;
  /** Short value string shown next to the label, e.g. "4096 × 4096 px". */
  value: string;
  status: QCStatus;
  /** Operator-facing explanation of why this status fired. */
  detail?: string;
  /** Tooltip / helper text explaining what this check means for DTF. */
  help: string;
}

export interface QCResult {
  /** All checks ran, regardless of outcome. */
  checks: QCCheck[];
  /** True if every gate-level check passed. Warnings don't block. */
  pass: boolean;
  /** Effective DPI at the requested print size. */
  effectiveDpi: number;
  /** Pixel dimensions extracted from the image. */
  widthPx: number;
  heightPx: number;
  /** Byte size of the image. */
  bytes: number;
  /** Print target in inches (width × height). */
  printTarget: { widthIn: number; heightIn: number; label: string };
  /** Whether the image has an alpha channel. */
  hasAlpha: boolean;
  /** Color mode: "rgb" | "rgba" | "cmyk" | "gray" | "unknown". */
  colorMode: string;
  /** Whether non-#FF00FF / non-transparent content touches a canvas edge. */
  edgeBleed: boolean;
}

export interface PrintTarget {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
}

/**
 * Standard DTF print sizes. Selected target drives the effective-DPI check.
 */
export const PRINT_TARGETS: PrintTarget[] = [
  { id: "left-chest", label: 'Left Chest (4" × 4")', widthIn: 4, heightIn: 4 },
  { id: "adult-front", label: 'Standard Adult Front (12" × 14")', widthIn: 12, heightIn: 14 },
  { id: "oversized-front", label: 'Oversized Front (15" × 18")', widthIn: 15, heightIn: 18 },
  { id: "full-back", label: 'Full Back (14" × 16")', widthIn: 14, heightIn: 16 },
];
