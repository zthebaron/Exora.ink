/**
 * Seed content for built-in SOPs. Used by POST /api/admin/sops/seed when the
 * row doesn't exist yet, so the user can edit it inline afterward.
 */

export interface SopSeed {
  slug: string;
  title: string;
  subtitle?: string;
  version?: string;
  owner?: string;
  effective?: string;
  contentMd: string;
}

export const SOP_SEEDS: SopSeed[] = [
  {
    slug: "dtf-nano-banana-pro",
    title: "AI-Generated Artwork for DTF Printing",
    subtitle: "Nano Banana Pro Workflow — Standard Prints Up to 13 Inches",
    version: "1.2",
    owner: "Digital Boutique AI",
    effective: "2026",
    contentMd: `## 1. Purpose & Scope

This SOP defines the standard workflow for generating print-ready artwork using **Google Nano Banana Pro (Gemini 3 Pro Image)** for Exora Ink DTF transfer production. In Version 1.2, post-generation file preparation and quality control are consolidated under a single **DBAi File Validation** step (Section 5).

**Scope:** Single-design prints with a final longest edge of **13 inches or less**. This covers the majority of standard Exora orders: left-chest, pocket, sleeve, youth tees, and standard adult front graphics. Oversized designs, hoodie backs, gang sheets, and all-over prints are out of scope for this document.

## 2. DTF Print Specification Requirements

All artwork must meet the following baseline specifications. These are the targets DBAi File Validation enforces in Section 5.

| Specification | Required Value |
|---|---|
| Resolution | 300 DPI at final print size (non-negotiable) |
| Color mode | RGB (DTF RIP converts to printer ink profile) |
| File format | PNG with true transparent background (alpha channel) |
| Minimum line weight | 0.025" (8 px / 0.6 mm / 1.8 pt) — thinner lines may not transfer |
| Edge quality | Hard edges required; no soft / faded / neon glow effects |
| Background | Fully transparent — no semi-transparent halo pixels |

### Pixel Requirements by Print Size

Nano Banana Pro outputs at **native 4K** (4096×4096 for square; ~3840 on long edge for other aspect ratios). This covers every size in this SOP with margin to spare:

| Print Application | Print Size | Pixels Needed @ 300 DPI |
|---|---|---|
| Left chest / pocket / sleeve | 4" × 4" | 1,200 × 1,200 |
| Youth tee front | 8" × 8" | 2,400 × 2,400 |
| Standard adult front | 11" × 11" | 3,300 × 3,300 |
| Large front graphic (max for this SOP) | 13" × 13" | 3,900 × 3,900 |

## 3. Nano Banana Pro — Capabilities & Limitations

### What It Does Well

- Native 4K output at 4096×4096 px — genuine pixels, not upscaled.
- Best-in-class in-image text rendering across multiple languages — critical for typographic designs.
- 5 aspect ratios supported: 1:1, 16:9, 9:16, 21:9, 4:5.
- Up to 8 reference images for style or brand consistency.
- Character consistency across generations for series work.
- ~$0.24 per 4K image via Google API; ~$0.12 via Batch API for non-urgent volume work.

### Hard Limitations

> **IN-MODEL EDITING DEGRADES RESOLUTION**
> Cropping, object insertion, or local edits performed inside Gemini after initial 4K generation can trigger internal downscaling. **Always export the 4K output immediately.** Do not iterate with in-model edits — regenerate from scratch with a refined prompt instead.

> **NO NATIVE TRANSPARENT BACKGROUND**
> Nano Banana Pro does not output native alpha-channel PNGs. Background removal is handled downstream by **DBAi File Validation** (Section 5).

- Outputs in sRGB color space only — forcing wider gamuts produces unpredictable color shifts.
- All images contain SynthID watermarks (imperceptible, does not affect print quality).
- Text accuracy is strong but not perfect — always spell-check rendered text before client approval.
- Soft gradients, drop shadows, neon glows, and fading edges will fight the DTF white underbase on dark garments regardless of input quality. These are design constraints, not tool constraints.

## 4. Standard Generation Workflow

### 4.1 Generation

1. Access Nano Banana Pro via Gemini API (model ID: \`gemini-3-pro-image-preview\`), Google AI Studio, or the Gemini app on a Pro tier.
2. Select aspect ratio matching the intended print: 1:1 for square graphics, 4:5 for typical tee fronts, 9:16 for vertical sleeve designs.
3. Set resolution to **4K** (not 1K or 2K). The additional cost is negligible compared to the downstream value of having native detail.
4. Use the appropriate prompt template from Section 6.
5. Generate. If the first result is usable, export immediately as PNG and submit to DBAi File Validation (Section 5). If not, refine the prompt and regenerate from scratch.

> **Note:** Steps 4.2–4.4 from Version 1.1 (background removal, resolution verification, export & delivery) and the standalone QC checklist have been consolidated into the DBAi File Validation process in Section 5.

## 5. DBAi File Validation

DBAi File Validation is the **single post-generation gate** every Nano Banana Pro export passes through before RIP submission. It absorbs the discrete background-removal, resolution-verification, export, and pre-production QC steps that previously lived in Sections 4.2 through 5 of Version 1.1.

Submit the raw 4K PNG export from Section 4.1 to DBAi. The process produces a print-ready, transparent-background, correctly named PNG ready for proofing and gang-sheet assembly.

### 5.1 What DBAi File Validation Performs

| Stage | What DBAi Handles |
|---|---|
| Background removal | Removes background and produces a true alpha-channel PNG. Includes automated halo / fringe inspection against high-contrast magenta and cyan layers; flags or cleans semi-transparent edge pixels that would print as a white halo on dark garments. |
| Resolution & size verification | Confirms file is ≥ 300 DPI at the work-order print size with resampling disabled. If the file has been downscaled anywhere in the pipeline, validation fails and the file is rejected back to Section 4.1 for regeneration from the original 4K export. |
| Specification check | Validates against every requirement in Section 2: PNG-24 with alpha, RGB color mode, hard edges, minimum 0.025" line weight, no semi-transparent fills, dimensions match the work order. |
| Text & content review | Spell-checks any in-image text and confirms it matches the client-approved copy. |
| Export & naming | Saves the validated file as PNG-24 with transparency preserved and applies the standard filename convention: \`[client]_[order#]_[design-name]_[print-size].png\` (e.g., \`acme_12845_logo-v2_11x11.png\`). |
| Delivery handoff | Routes the validated, named file to client proofing and, on written approval, to RIP / gang-sheet assembly. (Refer to current Exora delivery workflow for routing specifics; subject to update independent of this SOP.) |

### 5.2 Pass / Fail Outcome

- **PASS:** File is delivered with the standard filename, ready for client proofing and RIP submission.
- **FAIL:** DBAi returns the file with a flagged reason (e.g., resolution below 300 DPI, halo detected, line weight too thin, text mismatch). Address the flagged issue **at its source** — typically by regenerating from Section 4.1 with a refined prompt — then resubmit. Do not patch validation failures in-model.

> **NO MANUAL OVERRIDES**
> Files that fail DBAi File Validation **must not** be sent to RIP under any circumstance. If a genuine edge case appears to require an exception, escalate per Section 9 — do not bypass.

## 6. Prompt Templates

Use these as starting points. Tune the specifics but preserve the structural elements — style anchor, subject, DTF-friendly qualifiers.

### 6.1 Graphic / Illustrated Apparel Design

\`\`\`
[Style, e.g. "Bold vintage screen print illustration"], [Subject in detail],
centered composition, hard defined edges, flat color palette with maximum
5 colors, no gradients, no drop shadows, no soft glow, clean vector-style
line work, solid color fills, high contrast, isolated on white background.
Designed for apparel print transfer.
\`\`\`

### 6.2 Typography-Led Design

\`\`\`
Typographic t-shirt design, the text reads exactly: "[EXACT TEXT HERE]".
[Font style description, e.g. "bold condensed sans-serif, heavyweight,
slight distressed texture"]. [Layout, e.g. "stacked three lines, center
aligned"]. [Decorative elements if any]. Flat solid colors, no gradients,
hard edges, isolated on white background, print-ready vector aesthetic.
\`\`\`

### 6.3 Character / Mascot Design

\`\`\`
[Character description in detail], mascot illustration style, bold outline,
flat cel-shaded colors, limited palette, expressive pose, centered on white
background, no background elements, crisp edges, print-ready illustration
for DTF apparel transfer.
\`\`\`

### 6.4 Negative Prompt Add-Ons (append to any prompt)

\`\`\`
Avoid: neon glow effects, heavy drop shadows, soft gradients, fading edges,
transparent or semi-transparent elements, fine halftone patterns, text
thinner than 2 pt stroke, elements thinner than 1/40 inch.
\`\`\`

## 7. Cost & Timing Reference

| Activity | Cost | Time |
|---|---|---|
| Nano Banana Pro 4K generation (standard API) | $0.24 / image | 10–22 seconds |
| Nano Banana Pro 4K (Batch API, non-urgent) | $0.12 / image | up to 24 hours |
| DBAi File Validation (background removal + verification + export) | Per DBAi rate card | 1–3 min |
| Full workflow end to end | ~$0.24 + DBAi | 3–6 min |

## 8. Required Tools & Access

- **Nano Banana Pro:** Gemini API key (preferred for volume / automation) or Gemini Pro subscription for manual generation.
- **DBAi File Validation:** Active DBAi access for the Exora production account.
- **DTF RIP software:** Per existing Exora production pipeline.

## 9. Escalation & Exceptions

Escalate to the Exora production lead or DBAi when:

- The requested final print size exceeds 13 inches on the long edge — this falls outside the scope of this SOP.
- The client supplies existing low-resolution artwork rather than requesting a new generation — a separate upscaling workflow applies.
- Nano Banana Pro produces misspellings of client-approved text across 3+ regeneration attempts.
- DBAi File Validation flags the same failure on 2+ consecutive regenerations.
- RIP output preview shows color shifts inconsistent with the approved digital proof.
- The client requests design elements explicitly listed as incompatible with DTF (neon glow, soft fades, elements below minimum line weight).
`,
  },
];

