import { NextResponse } from "next/server";
import { getDefaultAssumptions } from "@/lib/pricing-engine";

export async function GET() {
  // In production, fetch from database
  // For now, return defaults
  const assumptions = getDefaultAssumptions();
  return NextResponse.json(assumptions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In production, validate with Zod and save to database
    // For now, echo back
    return NextResponse.json({ success: true, data: body });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
