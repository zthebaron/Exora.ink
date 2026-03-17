import { NextResponse } from "next/server";
import { getDefaultAssumptions, getScenarioPresets } from "@/lib/pricing-engine";

export async function GET() {
  const assumptions = getDefaultAssumptions();
  const scenarios = getScenarioPresets(assumptions);
  return NextResponse.json(scenarios);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
