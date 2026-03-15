"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface AIAssistantProps {
  type: 'generate-ideas' | 'suggest-features' | 'clarify-requirements' | 'improve-description';
  context: string;
  currentAnswers?: Record<string, unknown>;
  /** When provided, single suggestion (e.g. improved text) can be applied to the form */
  onApplySuggestion?: (text: string) => void;
}

export function AIAssistant({ type, context, currentAnswers, onApplySuggestion }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setImprovedText(null);
    try {
      const response = await fetch("/api/assessment/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          context,
          currentAnswers,
        }),
      });
      const data = await response.json();
      if (data.improvedText) {
        setImprovedText(data.improvedText);
        setSuggestions([data.improvedText]);
      } else {
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      }
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching AI assistance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading || !context}
          className="h-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-2" />
              AI Help
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Suggestions
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {suggestions.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="p-2 bg-primary/5 rounded border border-primary/10 flex items-start justify-between gap-2">
                  <span className="flex-1 min-w-0">{suggestion}</span>
                  {onApplySuggestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        onApplySuggestion(suggestion);
                        setIsOpen(false);
                      }}
                    >
                      Use this
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No suggestions available. Try adding more context.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
