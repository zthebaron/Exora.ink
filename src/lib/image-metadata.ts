/**
 * Image metadata extraction for PNG and JPEG files.
 *
 * Extracts:
 *   - pixel dimensions (width × height)
 *   - DPI (dots per inch) from pHYs chunk (PNG) or JFIF header (JPEG)
 *   - byte size
 *
 * WebP and images without embedded DPI fall back to 72 DPI (web standard),
 * flagged with `dpiAssumed: true` so the UI can indicate the fallback.
 */

export interface ImageMetadata {
  width: number;
  height: number;
  dpiX: number;
  dpiY: number;
  dpiAssumed: boolean;
  bytes: number;
  mimeType: string;
}

const DEFAULT_DPI = 72;

/**
 * Extract metadata from a File or Blob. Uses a hybrid approach:
 *  1. Pixel dimensions come from an HTMLImageElement (reliable for all formats).
 *  2. DPI comes from parsing the binary header (PNG pHYs / JPEG JFIF).
 */
export async function getImageMetadata(file: File | Blob): Promise<ImageMetadata> {
  const [dimensions, dpi] = await Promise.all([
    getPixelDimensions(file),
    getDpiFromBinary(file),
  ]);

  return {
    width: dimensions.width,
    height: dimensions.height,
    dpiX: dpi.x,
    dpiY: dpi.y,
    dpiAssumed: dpi.assumed,
    bytes: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

function getPixelDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
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

async function getDpiFromBinary(
  file: File | Blob
): Promise<{ x: number; y: number; assumed: boolean }> {
  // Read just enough of the file to find the DPI marker. 64KB covers PNG pHYs
  // (near the start) and JPEG JFIF/EXIF (usually in first few KB).
  const slice = file.slice(0, 64 * 1024);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return parsePngPhys(bytes);
  }

  // JPEG signature: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return parseJpegDpi(bytes);
  }

  return { x: DEFAULT_DPI, y: DEFAULT_DPI, assumed: true };
}

/**
 * Parse PNG pHYs chunk.
 * Layout: 4-byte length, 4-byte type, data, 4-byte CRC.
 * pHYs data: 4 bytes pxPerUnitX, 4 bytes pxPerUnitY, 1 byte unit (0=unknown, 1=meter).
 */
function parsePngPhys(bytes: Uint8Array): { x: number; y: number; assumed: boolean } {
  let offset = 8; // skip signature
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset + 8 < bytes.length) {
    const length = view.getUint32(offset, false); // big-endian
    const type = String.fromCharCode(
      bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]
    );
    const dataStart = offset + 8;

    if (type === "pHYs" && length >= 9) {
      const pxPerUnitX = view.getUint32(dataStart, false);
      const pxPerUnitY = view.getUint32(dataStart + 4, false);
      const unit = bytes[dataStart + 8];
      if (unit === 1) {
        // meters → DPI (1 inch = 0.0254 m)
        return {
          x: Math.round(pxPerUnitX * 0.0254),
          y: Math.round(pxPerUnitY * 0.0254),
          assumed: false,
        };
      }
      // unit=0 means aspect ratio only; no DPI info
      return { x: DEFAULT_DPI, y: DEFAULT_DPI, assumed: true };
    }

    if (type === "IDAT" || type === "IEND") break; // pHYs must come before IDAT
    offset = dataStart + length + 4; // skip data + CRC
  }

  return { x: DEFAULT_DPI, y: DEFAULT_DPI, assumed: true };
}

/**
 * Parse JPEG DPI from JFIF (APP0) or EXIF (APP1) header.
 * JFIF layout (APP0, 0xFFE0):
 *   "JFIF\0" (5 bytes), version (2), units (1: 0=none, 1=dpi, 2=dpcm),
 *   Xdensity (2), Ydensity (2).
 */
function parseJpegDpi(bytes: Uint8Array): { x: number; y: number; assumed: boolean } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2; // skip FFD8 SOI

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) break; // SOI/EOI
    if (marker === 0xda) break; // SOS — past headers
    const segLen = view.getUint16(offset + 2, false);

    // APP0 (JFIF)
    if (marker === 0xe0 && segLen >= 14) {
      const id =
        String.fromCharCode(bytes[offset + 4]) +
        String.fromCharCode(bytes[offset + 5]) +
        String.fromCharCode(bytes[offset + 6]) +
        String.fromCharCode(bytes[offset + 7]);
      if (id === "JFIF") {
        const units = bytes[offset + 11];
        const xDensity = view.getUint16(offset + 12, false);
        const yDensity = view.getUint16(offset + 14, false);
        if (units === 1 && xDensity > 0) {
          // pixels per inch
          return { x: xDensity, y: yDensity, assumed: false };
        }
        if (units === 2 && xDensity > 0) {
          // pixels per cm → DPI
          return {
            x: Math.round(xDensity * 2.54),
            y: Math.round(yDensity * 2.54),
            assumed: false,
          };
        }
      }
    }

    // APP1 (EXIF) — basic XResolution/YResolution parse
    if (marker === 0xe1 && segLen >= 14) {
      const id =
        String.fromCharCode(bytes[offset + 4]) +
        String.fromCharCode(bytes[offset + 5]) +
        String.fromCharCode(bytes[offset + 6]) +
        String.fromCharCode(bytes[offset + 7]);
      if (id === "Exif") {
        const exifDpi = parseExifResolution(bytes, offset + 10, segLen - 8);
        if (exifDpi) return { ...exifDpi, assumed: false };
      }
    }

    offset += 2 + segLen;
  }

  return { x: DEFAULT_DPI, y: DEFAULT_DPI, assumed: true };
}

/** Parse EXIF XResolution (0x011A), YResolution (0x011B), ResolutionUnit (0x0128). */
function parseExifResolution(
  bytes: Uint8Array,
  tiffStart: number,
  tiffLen: number
): { x: number; y: number } | null {
  if (tiffStart + 8 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Byte order: II (little) or MM (big)
  const le = bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
  const get16 = (o: number) => view.getUint16(o, le);
  const get32 = (o: number) => view.getUint32(o, le);

  if (get16(tiffStart + 2) !== 0x002a) return null; // magic 42
  const ifd0Offset = get32(tiffStart + 4);
  const ifd0Start = tiffStart + ifd0Offset;
  if (ifd0Start + 2 > bytes.length) return null;

  const numEntries = get16(ifd0Start);
  let xRes: number | null = null;
  let yRes: number | null = null;
  let unit = 2; // default DPI

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Start + 2 + i * 12;
    if (entryOffset + 12 > tiffStart + tiffLen) break;
    const tag = get16(entryOffset);
    const valueOffset = get32(entryOffset + 8);

    if (tag === 0x011a || tag === 0x011b) {
      // RATIONAL: 8 bytes at tiffStart + valueOffset (numerator/denominator)
      const ratStart = tiffStart + valueOffset;
      if (ratStart + 8 > bytes.length) continue;
      const num = get32(ratStart);
      const den = get32(ratStart + 4);
      const val = den ? num / den : 0;
      if (tag === 0x011a) xRes = val;
      else yRes = val;
    } else if (tag === 0x0128) {
      unit = get16(entryOffset + 8);
    }
  }

  if (xRes && yRes) {
    if (unit === 3) {
      // cm → inch
      return { x: Math.round(xRes * 2.54), y: Math.round(yRes * 2.54) };
    }
    return { x: Math.round(xRes), y: Math.round(yRes) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** Format byte count as "1.2 MB" / "456 KB" / "789 B". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Format DPI — show single value if x/y match, otherwise "300 × 300". */
export function formatDpi(meta: Pick<ImageMetadata, "dpiX" | "dpiY">): string {
  if (meta.dpiX === meta.dpiY) return `${meta.dpiX} DPI`;
  return `${meta.dpiX} × ${meta.dpiY} DPI`;
}

/** Format physical print size in inches at the image's DPI. */
export function formatPrintSize(meta: ImageMetadata): string {
  const widthIn = meta.width / meta.dpiX;
  const heightIn = meta.height / meta.dpiY;
  return `${widthIn.toFixed(2)}" × ${heightIn.toFixed(2)}"`;
}
