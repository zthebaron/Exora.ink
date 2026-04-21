import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Background removal is not configured. Add REMOVE_BG_API_KEY to your environment." },
      { status: 500 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const image = incoming.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const maxBytes = 12 * 1024 * 1024;
  if (image.size > maxBytes) {
    return NextResponse.json({ error: "Image exceeds 12MB limit" }, { status: 413 });
  }

  const size = (incoming.get("size") as string) || "auto";
  const format = (incoming.get("format") as string) || "png";
  const type = (incoming.get("type") as string) || "auto";
  const bgColor = (incoming.get("bg_color") as string) || "";

  const outgoing = new FormData();
  outgoing.append("image_file", image, image.name || "upload");
  outgoing.append("size", size);
  outgoing.append("format", format);
  outgoing.append("type", type);
  if (bgColor) outgoing.append("bg_color", bgColor);

  const res = await fetch(REMOVE_BG_URL, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: outgoing,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `remove.bg error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.errors?.[0]?.title || message;
    } catch {}
    return NextResponse.json({ error: message }, { status: res.status });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const credits = res.headers.get("X-Credits-Charged");
  const width = res.headers.get("X-Width");
  const height = res.headers.get("X-Height");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": format === "jpg" ? "image/jpeg" : "image/png",
      "Cache-Control": "no-store",
      ...(credits ? { "X-Credits-Charged": credits } : {}),
      ...(width ? { "X-Width": width } : {}),
      ...(height ? { "X-Height": height } : {}),
    },
  });
}
