import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 120;

// "Nano Banana" — Gemini 2.5 Flash Image model for text-to-image generation
// and image editing.
const MODEL = "gemini-2.5-flash-image";

/**
 * Mandatory chroma-key requirement appended to every prompt.
 *
 * DTF production rule: the background must be pure magenta (#FF00FF) and
 * the foreground artwork must never contain that exact color. This lets the
 * downstream workflow key out the magenta cleanly without halo artifacts.
 * True "transparent" PNGs from image generators often have anti-aliased
 * alpha fringing that causes white halos when printed on dark garments.
 */
const CHROMA_KEY_SUFFIX = `

MANDATORY OUTPUT REQUIREMENTS (DTF print production):
- The background MUST be a solid flat magenta fill at exactly #FF00FF (rgb 255, 0, 255). No gradient, no vignette, no shadow, no texture — pure uniform magenta.
- The foreground artwork MUST NOT contain any pixel of #FF00FF or any magenta/fuchsia shade close to it. If the design calls for pink, use a different hue (e.g. #FF69B4 hot pink or #FF1493 deep pink), never pure magenta.
- Keep edges hard and crisp against the magenta background. Do not anti-alias into magenta, do not leave a semi-transparent fringe, glow, or halo. Every pixel should be either fully opaque foreground or fully #FF00FF background.
- Output a flat rectangular image — do not return a transparent PNG. The magenta is the background.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Image Studio is not configured. Add GEMINI_API_KEY to your environment." },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const mode = (form.get("mode") as string) || "generate";
  const prompt = (form.get("prompt") as string) || "";

  if (!prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "Prompt is too long (4000 char max)" }, { status: 400 });
  }

  // Build content parts. Edit mode attaches the source image(s).
  // Chroma-key suffix is appended server-side so the rule is always enforced.
  const fullPrompt = `${prompt.trim()}${CHROMA_KEY_SUFFIX}`;
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: fullPrompt }];

  if (mode === "edit") {
    const images = form.getAll("image").filter((v): v is File => v instanceof File);
    if (images.length === 0) {
      return NextResponse.json({ error: "At least one image is required for edit mode" }, { status: 400 });
    }
    const maxBytes = 12 * 1024 * 1024;
    for (const img of images) {
      if (img.size > maxBytes) {
        return NextResponse.json({ error: `Image "${img.name}" exceeds 12MB` }, { status: 413 });
      }
      if (!/^image\/(png|jpeg|jpg|webp)$/.test(img.type)) {
        return NextResponse.json({ error: `Unsupported image type: ${img.type}` }, { status: 400 });
      }
      const buffer = await img.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      parts.push({
        inlineData: {
          mimeType: img.type === "image/jpg" ? "image/jpeg" : img.type,
          data: base64,
        },
      });
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidates = response.candidates ?? [];
    let imageBytes: string | null = null;
    let imageMime = "image/png";
    let textResponse = "";

    for (const candidate of candidates) {
      for (const part of candidate.content?.parts ?? []) {
        if ("inlineData" in part && part.inlineData?.data) {
          imageBytes = part.inlineData.data;
          imageMime = part.inlineData.mimeType || "image/png";
        } else if ("text" in part && part.text) {
          textResponse += part.text;
        }
      }
    }

    if (!imageBytes) {
      return NextResponse.json(
        {
          error: "No image returned by Gemini",
          detail: textResponse || "The model may have refused this request.",
        },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(imageBytes, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": imageMime,
        "Cache-Control": "no-store",
        ...(textResponse ? { "X-Model-Text": encodeURIComponent(textResponse) } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gemini error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
