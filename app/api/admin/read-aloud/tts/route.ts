import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const MAX_CHARS = 4096;

const ALLOWED_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
]);

/**
 * OpenAI text-to-speech for admin read-aloud (natural / human-like quality).
 * Requires approved admin session + OPENAI_API_KEY.
 */
export async function POST(req: NextRequest) {
  const ok = await isAdmin(req);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "OpenAI is not configured" }, { status: 503 });
  }

  let body: { text?: unknown; voice?: unknown };
  try {
    body = (await req.json()) as { text?: unknown; voice?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  const voiceRaw = typeof body.voice === "string" ? body.voice.toLowerCase().trim() : "nova";
  const voice = ALLOWED_VOICES.has(voiceRaw) ? voiceRaw : "nova";

  const model = process.env.OPENAI_READ_ALOUD_MODEL?.trim() || "tts-1-hd";

  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        input: clipped,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[read-aloud tts] OpenAI error", res.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: "Voice generation failed. Check API key and model access." },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[read-aloud tts]", e);
    return NextResponse.json({ error: "Voice request failed" }, { status: 500 });
  }
}
