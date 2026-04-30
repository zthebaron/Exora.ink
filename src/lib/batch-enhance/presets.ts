/**
 * Batch image enhancement presets.
 *
 * Each preset is a fully-formed Gemini edit prompt that, given a source
 * image, asks the model to produce an enhanced version. They're tuned for
 * common real-world cleanup jobs an operator runs in bulk: real estate
 * shots, product photos, customer-supplied lifestyle imagery, faded
 * archival photos, architectural reference shots.
 *
 * IMPORTANT: these prompts intentionally do NOT include the magenta
 * chroma-key requirement. The chroma-key is only enforced for DTF
 * artwork generation (where the output goes through the Hot Folder).
 * Photo enhancement preserves the source as a fully-rendered photograph.
 */

export type BatchPresetId =
  | "interior-design"
  | "product-photo"
  | "lifestyle-boost"
  | "photo-restore"
  | "architectural";

export interface BatchPreset {
  id: BatchPresetId;
  label: string;
  blurb: string;
  /** Lucide icon name (looked up at render time). */
  icon: "Home" | "Package" | "Camera" | "Image" | "Building";
  /** The full edit prompt sent to Gemini. */
  prompt: string;
  /** Tailwind accent color stem. */
  accent: "teal" | "amber" | "sky" | "rose" | "emerald";
}

export const BATCH_PRESETS: BatchPreset[] = [
  {
    id: "interior-design",
    label: "Interior Design Polish",
    blurb:
      "Real-estate / Airbnb-grade interiors. Stages the space, evens lighting, deepens contrast, removes minor clutter.",
    icon: "Home",
    accent: "amber",
    prompt:
      "Enhance this interior photograph for a high-end real-estate or Airbnb listing. " +
      "Even out the lighting (lift shadows in dark corners, gently roll off blown highlights), " +
      "warm the color temperature slightly, increase global contrast and clarity. " +
      "Make the space look professionally staged: tidy any visible clutter, straighten any " +
      "obviously crooked items, but do NOT add or remove furniture. Preserve the architecture, " +
      "geometry, and view through windows exactly as shot. Keep the result photorealistic; " +
      "do not over-saturate, do not introduce HDR halos, do not add a watermark.",
  },
  {
    id: "product-photo",
    label: "Product Photography",
    blurb:
      "Clean studio look. Crisp edges, true-to-life color, professional even lighting.",
    icon: "Package",
    accent: "teal",
    prompt:
      "Re-render this product photograph in a clean professional studio style. " +
      "Place the product on a soft neutral light-grey to off-white background with " +
      "a subtle gradient (lighter at top, slightly darker at bottom). Use even diffused " +
      "studio lighting from the upper-left, with a soft fill from the right and a faint " +
      "natural ground shadow. Sharpen the product's edges and bring out fine surface " +
      "detail and material texture. Keep the product itself absolutely identical in shape, " +
      "color, branding, and proportions — do not stylize, do not add reflections that " +
      "weren't there, do not add text or watermarks.",
  },
  {
    id: "lifestyle-boost",
    label: "Lifestyle Boost",
    blurb:
      "Casual phone photo → editorial lifestyle shot. Better light, mood, and color grade.",
    icon: "Camera",
    accent: "sky",
    prompt:
      "Re-grade this casual phone photograph as if it were shot for an editorial brand " +
      "lifestyle campaign. Apply a warm cinematic color grade with rich shadows and a " +
      "subtle film highlight roll-off. Lift midtones gently, deepen blacks just slightly, " +
      "warm the skin tones, and add the kind of soft natural bokeh that a fast prime lens " +
      "would produce on the background — without modifying the subject's face, body, " +
      "clothing, or pose. Preserve the composition exactly. Do not add or remove people, " +
      "objects, or text. Keep it photorealistic, no over-saturation, no posterization.",
  },
  {
    id: "photo-restore",
    label: "Photo Restoration",
    blurb:
      "Dull, faded, or underexposed photos. Restores color, contrast, and detail without changing content.",
    icon: "Image",
    accent: "rose",
    prompt:
      "Restore this photograph that has faded color, low contrast, or poor exposure. " +
      "Rebalance the white point and black point, recover any lost color saturation in a " +
      "natural way (don't over-saturate), increase clarity and micro-contrast to bring " +
      "back fine detail, gently denoise without smearing texture, and correct any obvious " +
      "color cast. Repair small visible damage like minor scratches, dust spots, or color " +
      "fringing if you can do so cleanly. Do NOT add elements that weren't in the original, " +
      "do not change the composition, do not change facial features. The output should " +
      "look like the same photo as it would have appeared on day one.",
  },
  {
    id: "architectural",
    label: "Architectural Cleanup",
    blurb:
      "Building / facade / streetscape shots. Straightens verticals, evens light, removes minor distractions.",
    icon: "Building",
    accent: "emerald",
    prompt:
      "Polish this architectural / building photograph. Correct any keystone distortion " +
      "so vertical lines (walls, windows, columns) are truly vertical and parallel. " +
      "Even out the dynamic range so the sky retains color and the shadowed sides of " +
      "the building still show material detail. Increase clarity and structural detail in " +
      "the facade. Remove minor distracting clutter that's clearly not part of the " +
      "architecture (loose litter, overhead wires that fragment the composition) but " +
      "DO keep the surrounding context (trees, neighboring buildings, foreground people). " +
      "Preserve the architecture's geometry, materials, signage, and color exactly. " +
      "Output a photorealistic result; no painterly stylization.",
  },
];

export function getPresetById(id: string): BatchPreset | null {
  return BATCH_PRESETS.find((p) => p.id === id) ?? null;
}

/** Estimated per-image cost in USD by tier. Mirrors the Image Studio costs. */
export const BATCH_TIER_COSTS = {
  preview: 0.04,
  production: 0.24,
} as const;
