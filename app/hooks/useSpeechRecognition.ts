"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionEventMap {
  result: SpeechRecognitionEvent;
  end: Event;
  error: Event;
  start: Event;
  audiostart: Event;
  audioend: Event;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  // Event handler properties (Web Speech API supports both addEventListener and direct assignment)
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: Event) => void) | null;
  onstart: ((e: Event) => void) | null;
  onaudiostart: ((e: Event) => void) | null;
  onaudioend: ((e: Event) => void) | null;
  onsoundstart: ((e: Event) => void) | null;
  onsoundend: ((e: Event) => void) | null;
  onspeechstart: ((e: Event) => void) | null;
  onspeechend: ((e: Event) => void) | null;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (ev: SpeechRecognitionEventMap[K]) => void,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
) {
  const {
    onResult,
    onError,
    lang = typeof navigator !== "undefined" ? navigator.language : "en-US",
    continuous = true,
    interimResults = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!Recognition);
    if (!Recognition) return;

    const recognition = new Recognition() as ISpeechRecognition;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.resultIndex];
      const alternative = result[0];
      if (alternative?.transcript != null) {
        onResultRef.current?.(alternative.transcript, result.isFinal);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (e: Event) => {
      const err = e as ErrorEvent;
      const message =
        err.message ||
        (err.error ? (err.error as Error).message : "Speech recognition error");
      setError(message);
      setIsListening(false);
      onErrorRef.current?.(message);
    };

    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults]);

  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start";
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  return { isSupported, isListening, start, stop, error };
}
