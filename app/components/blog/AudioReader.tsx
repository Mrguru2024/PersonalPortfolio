"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Play, Pause, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

interface AudioReaderProps {
  readonly content: string;
  readonly title?: string;
}

export function AudioReader({ content, title }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<typeof window.speechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = globalThis.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Try to find a good default voice (prefer English)
        const preferredVoice = availableVoices.find(
          (v) => v.lang.startsWith("en") && v.localService
        ) || availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0];
        
        if (preferredVoice) {
          setVoice(preferredVoice);
        }
      };
      
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (globalThis.speechSynthesis.onvoiceschanged !== undefined) {
        globalThis.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      // Cleanup on unmount
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Extract text from HTML content
  const extractText = (html: string): string => {
    if (typeof document === "undefined") return html;
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll("script, style");
    scripts.forEach((el) => el.remove());
    
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handlePlay = () => {
    if (!synthRef.current) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    const text = extractText(content);
    if (!text.trim()) {
      alert("No text content available to read.");
      return;
    }

    // If already speaking, resume
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (title) {
      utterance.text = `${title}. ${text}`;
    }
    
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (synthRef.current) {
      if (synthRef.current.speaking && !synthRef.current.paused) {
        synthRef.current.pause();
        setIsPaused(true);
      } else if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPaused(false);
      }
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  };

  const handleRateChange = (newRate: number[]) => {
    const newRateValue = newRate[0];
    setRate(newRateValue);
    
    // Update current utterance if speaking
    if (utteranceRef.current && synthRef.current?.speaking) {
      synthRef.current.cancel();
      utteranceRef.current.rate = newRateValue;
      synthRef.current.speak(utteranceRef.current);
    }
  };

  // Check if browser supports speech synthesis
  if (typeof globalThis === "undefined" || !("speechSynthesis" in globalThis)) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Listen to Article</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {!isPlaying && !isPaused && (
                <Button
                  onClick={handlePlay}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
              )}
              
              {isPlaying && !isPaused && (
                <Button onClick={handlePause} size="sm" variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {isPaused && (
                <Button onClick={handlePlay} size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              
              {(isPlaying || isPaused) && (
                <Button onClick={handleStop} size="sm" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 flex-1 sm:flex-initial min-w-[200px]">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Speed:
              </span>
              <Slider
                value={[rate]}
                onValueChange={handleRateChange}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8 text-right">
                {rate.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
        
        {voices.length > 0 && (
          <div className="mt-4">
            <label htmlFor="voice-select" className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              Voice:
            </label>
            <select
              id="voice-select"
              value={voice?.name || ""}
              onChange={(e) => {
                const selectedVoice = voices.find((v) => v.name === e.target.value);
                if (selectedVoice) {
                  setVoice(selectedVoice);
                  // Update current utterance if speaking
                  if (utteranceRef.current && synthRef.current?.speaking) {
                    synthRef.current.cancel();
                    utteranceRef.current.voice = selectedVoice;
                    synthRef.current.speak(utteranceRef.current);
                  }
                }
              }}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              aria-label="Select voice for text-to-speech"
            >
              {voices
                .filter((v) => v.lang.startsWith("en"))
                .map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
