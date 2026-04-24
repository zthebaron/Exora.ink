import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 30;

// Fast, cheap text model for prompt rewriting. Keep separate from the
// image model so we don't burn image credits on text refinement.
const MODEL = "gemini-2.5-flash";

const GENERATE_SYSTEM = `You are a prompt engineer specializing in text-to-image prompts for DTF (Direct-to-Film) printing artwork and mockups. Your job is to take a user's rough prompt and rewrite it as a tightly-crafted, specific prompt that will produce better results from Google's Gemini 2.5 Flash Image model.

Rules for your rewrite:
1. Preserve the user's core intent. Do not invent new subjects or radically change the concept.
2. Add specificity: material, texture, color descriptions, composition, lighting where relevant.
3. For DTF artwork, specify crisp hard edges, a sensible color count, and mention the target garment color context when it can be inferred.
4. Do NOT instruct about background color — a downstream system already enforces a #FF00FF chroma-key requirement.
5. Do NOT add negative instructions about halos, fringing, or anti-aliasing — that's also handled downstream.
6. Keep it under 150 words.
7. Return ONLY the rewritten prompt as plain text. No preamble, no explanation, no quotes, no markdown, no labels.`;

const EDIT_SYSTEM = `You are a prompt engineer for image editing using Gemini 2.5 Flash Image. Take the user's rough edit instruction and rewrite it to be precise and actionable for DTF (Direct-to-Film) printing workflows.

Rules for your rewrite:
1. Preserve the user's intent. Do not invent changes they didn't ask for.
2. Be explicit about what must be preserved from the source image (composition, subject, colors unless the user wants them changed).
3. Describe the target look in concrete terms — style, texture, palette.
4. For DTF work, prefer instructions that produce crisp edges and flat color areas.
5. Do NOT instruct about background color (#FF00FF magenta is enforced downstream).
6. Do NOT add negative instructions about halos or fringing — that's handled downstream.
7. Keep it under 120 words.
8. Return ONLY the rewritten instruction as plain text. No preamble, no explanation, no quotes, no markdown.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Prompt refinement is not configured. Add GEMINI_API_KEY to your environment." },
      { status: 500 }
    );
  }

  let body: { mode?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = body.mode === "edit" ? "edit" : "generate";
  const userPrompt = (body.prompt || "").trim();

  if (!userPrompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (userPrompt.length > 4000) {
    return NextResponse.json({ error: "Prompt is too long (4000 char max)" }, { status: 400 });
  }

  const systemInstruction = mode === "edit" ? EDIT_SYSTEM : GENERATE_SYSTEM;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 400,
      },
    });

    const refined = (response.text ?? "").trim().replace(/^["']|["']$/g, "");

    if (!refined) {
      return NextResponse.json(
        { error: "No refined prompt returned by Gemini" },
        { status: 502 }
      );
    }

    return NextResponse.json({ refinedPrompt: refined });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gemini error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
