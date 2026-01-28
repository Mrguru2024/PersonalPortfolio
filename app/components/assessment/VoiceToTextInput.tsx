"use client";

import React, { useState, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

type BaseInputProps = React.ComponentPropsWithoutRef<typeof Input>;
type BaseTextareaProps = React.ComponentPropsWithoutRef<typeof Textarea>;

type VoiceInputProps = BaseInputProps & {
  variant: "input";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

type VoiceTextareaProps = BaseTextareaProps & {
  variant: "textarea";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export type VoiceToTextInputProps = (VoiceInputProps | VoiceTextareaProps) & {
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export function VoiceToTextInput(props: VoiceToTextInputProps) {
  const {
    variant,
    value,
    onChange,
    onBlur,
    className,
    inputClassName,
    disabled = false,
    ...rest
  } = props;

  const [interimTranscript, setInterimTranscript] = useState("");

  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal) {
        const current = String(value ?? "").trim();
        const sep = current ? " " : "";
        onChange(current + sep + transcript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(transcript);
      }
    },
    [value, onChange],
  );

  const { isSupported, isListening, start, stop, error } = useSpeechRecognition(
    {
      onResult: handleResult,
      continuous: true,
      interimResults: true,
    },
  );

  const handleMicClick = () => {
    if (isListening) {
      stop();
      if (interimTranscript) {
        const current = String(value ?? "").trim();
        const sep = current ? " " : "";
        onChange(current + sep + interimTranscript);
        setInterimTranscript("");
      }
    } else {
      setInterimTranscript("");
      start();
    }
  };

  const displayValue =
    value + (interimTranscript ? " " + interimTranscript : "");

  const commonInputProps = {
    value: displayValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onBlur,
    disabled,
    className: cn("pr-12", inputClassName),
    ...rest,
  };

  return (
    <div className={cn("relative", className)}>
      {variant === "input" ? (
        <Input {...(commonInputProps as BaseInputProps)} value={displayValue} />
      ) : (
        <Textarea
          {...(commonInputProps as BaseTextareaProps)}
          value={displayValue}
        />
      )}
      {isSupported && (
        <div
          className={cn(
            "absolute right-2 flex items-center gap-1",
            variant === "input" ? "top-1/2 -translate-y-1/2" : "top-2",
          )}
        >
          {error && (
            <span
              className="text-xs text-destructive max-w-[80px] truncate"
              title={error}
            >
              Error
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 touch-target min-h-[44px] min-w-[44px] md:min-h-8 md:min-w-8",
              isListening && "bg-destructive/10 text-destructive",
            )}
            onClick={handleMicClick}
            disabled={disabled}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <Square className="h-4 w-4" aria-hidden />
            ) : (
              <Mic className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
