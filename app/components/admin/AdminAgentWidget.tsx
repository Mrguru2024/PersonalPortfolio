"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Loader2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface AgentResponse {
  reply: string;
  action?: { type: string; url?: string; api?: string };
  suggestions?: string[];
}

function executeAction(
  action: NonNullable<AgentResponse["action"]>,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (action.type === "generate_reminders" && action.api === "POST /api/admin/reminders") {
    apiRequest("POST", "/api/admin/reminders", {})
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      })
      .catch(() => {});
    return;
  }
  if (action.url) {
    router.push(action.url);
    return;
  }
}

const STARTER_COMMANDS = [
  "Open dashboard",
  "Open CRM pipeline",
  "Open content studio",
  "Generate reminders",
  "What is new?",
  "/help",
];

export function AdminAgentWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.isAdmin === true && user?.adminApproved === true;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, currentPath: pathname ?? undefined }),
        credentials: "include",
      });
      const data = (await res.json()) as AgentResponse;
      if (!res.ok) throw new Error(data.reply || "Request failed");
      return data;
    },
    onSuccess: (data, message) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: data.reply, suggestions: data.suggestions },
      ]);
      if (data.action) {
        executeAction(data.action, router, queryClient);
      }
    },
    onError: (err, message) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    },
  });

  const sendText = (value: string) => {
    const text = value.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(text);
  };

  const handleSubmit = () => {
    sendText(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
          <div className="flex flex-col w-[min(400px,calc(100vw-2rem))] h-[420px] rounded-xl border bg-card text-card-foreground shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
              <span className="font-medium text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Admin assistant
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 text-sm"
            >
              {messages.length === 0 && (
                <div className="space-y-3 py-2">
                  <p className="text-muted-foreground text-center">
                    Ask actions, questions, or commands. Try navigation prompts, feature questions, or slash commands.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STARTER_COMMANDS.map((command) => (
                      <Button
                        key={command}
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => sendText(command)}
                        disabled={sendMutation.isPending}
                      >
                        {command}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}-${m.content.slice(0, 20)}`}
                  className={
                    m.role === "user"
                      ? "ml-6 text-right"
                      : "mr-6 text-left"
                  }
                >
                  <div
                    className={
                      m.role === "user"
                        ? "inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1.5"
                        : "inline-block rounded-lg bg-muted px-3 py-1.5"
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.suggestions.slice(0, 6).map((suggestion) => (
                        <Button
                          key={`${i}-${suggestion}`}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => sendText(suggestion)}
                          disabled={sendMutation.isPending}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking…</span>
                </div>
              )}
            </div>
            <div className="p-2 border-t flex gap-2">
              <Textarea
                placeholder="Ask to go to reminders, CRM…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={1}
                className="min-h-[40px] resize-none"
                disabled={sendMutation.isPending}
              />
              <Button
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={handleSubmit}
                disabled={!input.trim() || sendMutation.isPending}
                aria-label="Send"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close assistant" : "Open admin assistant"}
        >
          <Bot className="h-6 w-6" />
        </Button>
    </div>
  );
}
