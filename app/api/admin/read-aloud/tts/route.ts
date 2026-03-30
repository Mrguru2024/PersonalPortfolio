import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { synthesizeGeminiReadAloud } from "@server/services/geminiReadAloudTts";

export const dynamic = "force-dynamic";

const MAX_CHARS = 4096;

const OPENAI_VOICES = new Set([
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

const READING_STYLES = new Set(["natural", "calm", "clear", "expressive"]);

/**
 * Admin neural read-aloud: **OpenAI** (`provider: "openai"` or omitted) or **Gemini** TTS preview
 * (`provider: "gemini"` — requires `GEMINI_API_KEY`, uses `gemini-2.5-flash-preview-tts` by default).
 */
export async function POST(req: NextRequest) {
  const ok = await isAdmin(req);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    text?: unknown;
    voice?: unknown;
    provider?: unknown;
    readingStyle?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  const provider =
    typeof body.provider === "string" && body.provider.toLowerCase().trim() === "gemini"
      ? "gemini"
      : "openai";

  const readingStyleRaw = typeof body.readingStyle === "string" ? body.readingStyle.trim() : "natural";
  const readingStyle = READING_STYLES.has(readingStyleRaw) ? readingStyleRaw : "natural";

  if (provider === "gemini") {
    const voiceName = typeof body.voice === "string" ? body.voice.trim() : "Kore";
    const result = await synthesizeGeminiReadAloud({
      text: clipped,
      voiceName,
      readingStyle,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.slice(0, 400) || "Gemini TTS failed" },
        { status: result.error.includes("GEMINI_API_KEY") ? 503 : 502 },
      );
    }
    return new NextResponse(new Uint8Array(result.wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "OpenAI is not configured" }, { status: 503 });
  }

  const voiceRaw = typeof body.voice === "string" ? body.voice.toLowerCase().trim() : "nova";
  const voice = OPENAI_VOICES.has(voiceRaw) ? voiceRaw : "nova";
  const model = process.env.OPENAI_READ_ALOUD_MODEL?.trim() || "tts-1";

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
