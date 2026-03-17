import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the Exora.ink AI Assistant — a knowledgeable, friendly expert on DTF (Direct-to-Film) printing technology. You help visitors understand DTF printing, gang sheets, pricing, equipment, and production techniques.

Key knowledge areas:
- DTF printing process (film → powder → cure → press)
- Gang sheet sizes: Standard 22" width and Wide 31.5" width (Mimaki TxF150-75)
- Pricing strategies: cost-based pricing, retail/wholesale/reseller tiers, volume discounts
- Equipment: Mimaki TxF150-75 DTF printer (31.5" wide, 1440 DPI, 35.5 sq ft/hr), Hotronix Dual Air Fusion ProPlace IQ heat press, CADlink Digital Factory RIP software
- Materials: PET film types (hot/cold/warm peel), adhesive powder (fine/medium/coarse), CMYK + white pigment inks
- Heat press settings by fabric type (cotton 300-325°F, polyester 270-285°F, blends 285-305°F)
- Color management, ICC profiles, white ink management
- Business topics: startup costs ($7K-60K+), margins (50-65% gross), break-even analysis

Site features you can point users to:
- /calculator — Profitability Calculator with 20+ adjustable assumptions
- /dashboard — Executive Dashboard with 8 interactive charts
- /scenarios — Scenario Analysis with 10 presets + custom builder
- /price-sheets — Customer-facing Price Sheet Generator
- /equipment — Equipment & Production specs and estimates
- /infographics — Internal and customer guide infographics
- /blog — 15 expert articles on DTF topics

Be concise, helpful, and professional. Use specific numbers and data when relevant. If asked about something outside DTF printing, politely redirect to DTF-related topics. Keep responses under 200 words unless the question requires more detail.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat is not configured. Please add ANTHROPIC_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
