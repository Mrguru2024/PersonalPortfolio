"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedReadAloudTts } from "@shared/readAloudTtsConfig";
import { READ_ALOUD_STATUS_REFRESH_EVENT } from "@/lib/readAloudRefresh";
import {
  DEFAULT_READ_ALOUD_PREFS,
  loadReadAloudPrefs,
  GEMINI_TTS_VOICES,
  OPENAI_TTS_VOICES,
  READING_STYLE_META,
  type ReadAloudPreferences,
  type ReadingStyleId,
  sortSpeechVoicesForAdmin,
  saveReadAloudPrefs,
  isLikelyNeuralBrowserVoice,
} from "@/lib/readAloudPreferences";

function prepareSpeechText(raw: string): string {
  return raw
    .replace(/https?:\/\/[^\s)]+/g, " link ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ReadAloudButtonProps {
  text: string;
  /** Visible label when idle */
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

/**
 * Read aloud: **browser** Web Speech API, **OpenAI** TTS, or **Gemini** preview TTS (admin-only APIs).
 * Voice and reading style persist in `localStorage`.
 */
export function ReadAloudButton({
  text,
  label = "Listen",
  className,
  size = "sm",
  variant = "outline",
}: ReadAloudButtonProps) {
  const [hasBrowserSpeech, setHasBrowserSpeech] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [prefs, setPrefs] = useState<ReadAloudPreferences>(DEFAULT_READ_ALOUD_PREFS);
  const [prefsReady, setPrefsReady] = useState(false);
  const [openaiTts, setOpenaiTts] = useState(false);
  const [geminiTts, setGeminiTts] = useState(false);
  const [ttsResolved, setTtsResolved] = useState<ResolvedReadAloudTts | null>(null);
  const [neuralStatusLoaded, setNeuralStatusLoaded] = useState(false);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  type NeuralSnapshot = {
    openaiTts: boolean;
    geminiTts: boolean;
    resolved: ResolvedReadAloudTts | null;
  };

  const fetchNeuralStatus = useCallback(async (): Promise<NeuralSnapshot> => {
    const empty: NeuralSnapshot = { openaiTts: false, geminiTts: false, resolved: null };
    try {
      const res = await fetch("/api/admin/read-aloud/status", { credentials: "include" });
      if (!res.ok) return empty;
      const data = (await res.json()) as {
        openaiTts?: boolean;
        geminiTts?: boolean;
        resolved?: ResolvedReadAloudTts;
      };
      const next: NeuralSnapshot = {
        openaiTts: data.openaiTts === true,
        geminiTts: data.geminiTts === true,
        resolved: data.resolved ?? null,
      };
      setOpenaiTts(next.openaiTts);
      setGeminiTts(next.geminiTts);
      if (next.resolved) setTtsResolved(next.resolved);
      setNeuralStatusLoaded(true);
      return next;
    } catch {
      setNeuralStatusLoaded(true);
      return empty;
    }
  }, []);

  useEffect(() => {
    setHasBrowserSpeech(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    setPrefs(loadReadAloudPrefs());
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!hasBrowserSpeech || typeof window === "undefined" || !window.speechSynthesis) return;
    const syn = window.speechSynthesis;
    const refresh = () => setVoices(sortSpeechVoicesForAdmin(syn.getVoices()));
    refresh();
    syn.addEventListener("voiceschanged", refresh);
    return () => {
      syn.removeEventListener("voiceschanged", refresh);
    };
  }, [hasBrowserSpeech]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/read-aloud/status", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          openaiTts?: boolean;
          geminiTts?: boolean;
          resolved?: ResolvedReadAloudTts;
        };
        if (!cancelled) {
          setOpenaiTts(data.openaiTts === true);
          setGeminiTts(data.geminiTts === true);
          if (data.resolved) setTtsResolved(data.resolved);
          setNeuralStatusLoaded(true);
        }
      } catch {
        /* non-admin page or offline */
        if (!cancelled) setNeuralStatusLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAiVoicesForPicker = ttsResolved?.openai.voices ?? OPENAI_TTS_VOICES;
  const geminiVoicesForPicker = ttsResolved?.gemini.voices ?? GEMINI_TTS_VOICES;

  useEffect(() => {
    if (!ttsResolved) return;
    const oa = ttsResolved.openai.voices;
    const gm = ttsResolved.gemini.voices;
    setPrefs((prev) => {
      let next = { ...prev };
      let changed = false;
      if (!oa.some((v) => v.id === prev.openaiVoice)) {
        next.openaiVoice = oa[0]?.id ?? DEFAULT_READ_ALOUD_PREFS.openaiVoice;
        changed = true;
      }
      if (!gm.some((v) => v.id === prev.geminiVoice)) {
        next.geminiVoice = gm[0]?.id ?? DEFAULT_READ_ALOUD_PREFS.geminiVoice;
        changed = true;
      }
      if (changed) saveReadAloudPrefs(next);
      return changed ? next : prev;
    });
  }, [ttsResolved]);

  const updatePrefs = useCallback((patch: Partial<ReadAloudPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveReadAloudPrefs(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speakBrowser = useCallback(() => {
    if (!text.trim() || typeof SpeechSynthesisUtterance === "undefined") return;
    window.speechSynthesis?.cancel();
    const utter = new SpeechSynthesisUtterance(prepareSpeechText(text));
    const style = READING_STYLE_META[prefs.readingStyle] ?? READING_STYLE_META.natural;
    utter.rate = style.rate;
    utter.pitch = style.pitch;
    if (prefs.browserVoiceUri) {
      const v = voices.find((x) => x.voiceURI === prefs.browserVoiceUri);
      if (v) utter.voice = v;
    }
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    setLastError(null);
    window.speechSynthesis?.speak(utter);
  }, [prefs.browserVoiceUri, prefs.readingStyle, text, voices]);

  const speakOpenAI = useCallback(async (availability?: boolean) => {
    const ok = availability !== undefined ? availability : openaiTts;
    if (!ok || !text.trim()) return;
    stop();
    setLastError(null);
    setSpeaking(true);
    try {
      const res = await fetch("/api/admin/read-aloud/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prepareSpeechText(text),
          voice: prefs.openaiVoice,
          provider: "openai",
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setLastError(err.error ?? `Request failed (${res.status})`);
        setSpeaking(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        setSpeaking(false);
      };
      audio.onerror = () => {
        setLastError("Could not play audio");
        stop();
      };
      await audio.play();
    } catch {
      setLastError("Could not load natural voice");
      setSpeaking(false);
    }
  }, [openaiTts, prefs.openaiVoice, text, stop]);

  const speakGemini = useCallback(async (availability?: boolean) => {
    const ok = availability !== undefined ? availability : geminiTts;
    if (!ok || !text.trim()) return;
    stop();
    setLastError(null);
    setSpeaking(true);
    try {
      const res = await fetch("/api/admin/read-aloud/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prepareSpeechText(text),
          voice: prefs.geminiVoice,
          provider: "gemini",
          readingStyle: prefs.readingStyle,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setLastError(err.error ?? `Request failed (${res.status})`);
        setSpeaking(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        setSpeaking(false);
      };
      audio.onerror = () => {
        setLastError("Could not play audio");
        stop();
      };
      await audio.play();
    } catch {
      setLastError("Could not load Gemini voice");
      setSpeaking(false);
    }
  }, [geminiTts, prefs.geminiVoice, prefs.readingStyle, text, stop]);

  const speak = useCallback(async () => {
    if (speaking) {
      stop();
      return;
    }
    if (prefs.engine === "openai" || prefs.engine === "gemini") {
      const s = await fetchNeuralStatus();
      if (prefs.engine === "openai") {
        if (!s.openaiTts) {
          setLastError("OpenAI voice isn’t set up on the server yet. Use “This device” or ask your admin to add an API key.");
          return;
        }
        await speakOpenAI(true);
        return;
      }
      if (prefs.engine === "gemini") {
        if (!s.geminiTts) {
          setLastError("Gemini voice isn’t set up on the server yet. Use “This device” or add Gemini in Settings.");
          return;
        }
        await speakGemini(true);
        return;
      }
    }
    speakBrowser();
  }, [
    speaking,
    stop,
    prefs.engine,
    fetchNeuralStatus,
    speakOpenAI,
    speakGemini,
    speakBrowser,
  ]);

  useEffect(() => () => stop(), [stop]);

  const utterlyUnavailable =
    prefsReady &&
    neuralStatusLoaded &&
    !hasBrowserSpeech &&
    !openaiTts &&
    !geminiTts;

  if (utterlyUnavailable) {
    return (
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        disabled
        title="No read-aloud backend: allow browser speech or set OPENAI_API_KEY / GEMINI_API_KEY on the server"
      >
        <Volume2 className="h-4 w-4 mr-1.5 opacity-50" aria-hidden />
        {label}
      </Button>
    );
  }

  const engineDisabled =
    (prefs.engine === "openai" && !openaiTts) ||
    (prefs.engine === "gemini" && !geminiTts) ||
    (prefs.engine === "browser" && !hasBrowserSpeech);

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className="gap-1.5"
        onClick={() => void speak()}
        aria-pressed={speaking}
        disabled={engineDisabled}
        title={
          engineDisabled
            ? "Enable OPENAI_API_KEY for natural voice, or switch to This device in settings"
            : speaking
              ? "Stop reading"
              : prefs.engine === "openai"
                ? "Play natural-voice read-aloud (OpenAI)"
                : prefs.engine === "gemini"
                  ? "Play natural-voice read-aloud (Gemini)"
                  : "Read this text aloud"
        }
      >
        {speaking ? <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        {speaking ? "Stop" : label}
      </Button>

      <Popover
        open={voicePanelOpen}
        onOpenChange={(open) => {
          setVoicePanelOpen(open);
          if (open) void fetchNeuralStatus();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            size={size}
            variant="outline"
            className="px-2"
            aria-label="Read-aloud voice and style"
            title="Voice & reading style"
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-4" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Voice output</Label>
              <RadioGroup
                value={prefs.engine}
                onValueChange={(v) =>
                  updatePrefs({
                    engine:
                      v === "openai" ? "openai" : v === "gemini" ? "gemini" : "browser",
                  })
                }
                className="grid gap-2"
              >
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border/80 p-2.5 text-sm hover:bg-muted/40">
                  <RadioGroupItem value="browser" id="ra-browser" className="mt-0.5" />
                  <div>
                    <span className="font-medium">This device</span>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      Browser voices; pick a neural / natural voice in the list when your OS exposes one.
                    </p>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border border-border/80 p-2.5 text-sm hover:bg-muted/40",
                    !openaiTts && "opacity-60",
                  )}
                >
                  <RadioGroupItem value="openai" id="ra-openai" disabled={!openaiTts} className="mt-0.5" />
                  <div>
                    <span className="font-medium">Natural voice (OpenAI)</span>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {openaiTts
                        ? "Human-like neural audio via your server (uses API quota)."
                        : "Requires OPENAI_API_KEY on the server."}
                    </p>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border border-border/80 p-2.5 text-sm hover:bg-muted/40",
                    !geminiTts && "opacity-60",
                  )}
                >
                  <RadioGroupItem value="gemini" id="ra-gemini" disabled={!geminiTts} className="mt-0.5" />
                  <div>
                    <span className="font-medium">Natural voice (Gemini)</span>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {geminiTts
                        ? "Preview TTS via your server (WAV). Voices follow Admin settings → Read-aloud."
                        : "Requires GEMINI_API_KEY on the server."}
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {prefs.engine === "browser" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ra-style" className="text-xs">
                    Reading style
                  </Label>
                  <Select
                    value={prefs.readingStyle}
                    onValueChange={(v) => updatePrefs({ readingStyle: v as ReadingStyleId })}
                  >
                    <SelectTrigger id="ra-style" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(READING_STYLE_META) as ReadingStyleId[]).map((id) => (
                        <SelectItem key={id} value={id}>
                          {READING_STYLE_META[id].label} — {READING_STYLE_META[id].description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ra-voice" className="text-xs">
                    Browser voice
                  </Label>
                  <Select
                    value={prefs.browserVoiceUri || "__default__"}
                    onValueChange={(v) =>
                      updatePrefs({ browserVoiceUri: v === "__default__" ? "" : v })
                    }
                  >
                    <SelectTrigger id="ra-voice" className="h-9">
                      <SelectValue placeholder="System default" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(240px,var(--radix-select-content-available-height))]">
                      <SelectItem value="__default__">System default</SelectItem>
                      {voices.map((v) => (
                        <SelectItem key={v.voiceURI} value={v.voiceURI}>
                          <span className="flex items-center gap-2 flex-wrap">
                            {v.name}
                            {isLikelyNeuralBrowserVoice(v) ? (
                              <span className="text-[10px] uppercase tracking-wide text-primary">Natural</span>
                            ) : null}
                            <span className="text-muted-foreground text-xs">({v.lang})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : prefs.engine === "openai" ? (
              <div className="space-y-1.5">
                <Label htmlFor="ra-oai-voice" className="text-xs">
                  OpenAI voice
                </Label>
                <Select value={prefs.openaiVoice} onValueChange={(v) => updatePrefs({ openaiVoice: v })}>
                  <SelectTrigger id="ra-oai-voice" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(280px,var(--radix-select-content-available-height))]">
                    {openAiVoicesForPicker.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label} — {v.hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : prefs.engine === "gemini" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ra-gem-style" className="text-xs">
                    Reading style
                  </Label>
                  <Select
                    value={prefs.readingStyle}
                    onValueChange={(v) => updatePrefs({ readingStyle: v as ReadingStyleId })}
                  >
                    <SelectTrigger id="ra-gem-style" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(READING_STYLE_META) as ReadingStyleId[]).map((id) => (
                        <SelectItem key={id} value={id}>
                          {READING_STYLE_META[id].label} — {READING_STYLE_META[id].description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ra-gem-voice" className="text-xs">
                    Gemini voice
                  </Label>
                  <Select value={prefs.geminiVoice} onValueChange={(v) => updatePrefs({ geminiVoice: v })}>
                    <SelectTrigger id="ra-gem-voice" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(280px,var(--radix-select-content-available-height))]">
                      {geminiVoicesForPicker.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.label} — {v.hint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {lastError ? <p className="text-xs text-destructive">{lastError}</p> : null}
            {!prefsReady ? <p className="text-xs text-muted-foreground">Loading preferences…</p> : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
