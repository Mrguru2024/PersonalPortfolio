import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import {
  isAllowedGeminiVoice,
  isAllowedOpenAiVoice,
  resolveReadAloudTts,
} from "@shared/readAloudTtsConfig";
import { synthesizeGeminiReadAloud } from "@server/services/geminiReadAloudTts";
import { getReadAloudTtsEnvDefaults } from "@server/services/readAloudTtsEnvDefaults";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const MAX_CHARS = 4096;

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

  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : null;
  const adminRow = userId != null ? await storage.getAdminSettings(userId) : undefined;
  const storedTts = adminRow?.ttsConfig ?? null;
  const resolved = resolveReadAloudTts(storedTts, getReadAloudTtsEnvDefaults());

  if (provider === "gemini") {
    const rawVoice = typeof body.voice === "string" ? body.voice.trim() : "Kore";
    const voiceName = isAllowedGeminiVoice(rawVoice, storedTts) ? rawVoice : "Kore";
    const result = await synthesizeGeminiReadAloud({
      text: clipped,
      voiceName,
      readingStyle,
      model: resolved.gemini.model,
      allowedGeminiVoices: new Set(resolved.gemini.voices.map((v) => v.id)),
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
  const voice = isAllowedOpenAiVoice(voiceRaw, storedTts) ? voiceRaw : "nova";
  const model = resolved.openai.model;

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
