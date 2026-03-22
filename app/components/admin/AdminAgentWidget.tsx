"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Loader2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { AdminAgentReplyText } from "@/components/admin/AdminAgentReplyText";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentResponse {
  reply: string;
  action?: { type: string; url?: string; api?: string };
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
  if (typeof action.url === "string" && action.url.startsWith("/")) {
    router.push(action.url);
  }
}

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
    mutationFn: async (variables: { message: string; history: AgentMessage[] }) => {
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: variables.message,
          currentPath: pathname ?? undefined,
          history: variables.history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
        credentials: "include",
      });
      const data = (await res.json()) as AgentResponse;
      if (!res.ok) throw new Error(data.reply || "Request failed");
      return data;
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: variables.message },
        { role: "assistant", content: data.reply },
      ]);
      if (data.action) {
        executeAction(data.action, router, queryClient);
      }
    },
    onError: (err, variables) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: variables.message },
        { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    },
  });

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate({ message: text, history: messages });
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
                <p className="text-muted-foreground text-center py-4">
                  Ask where something lives (routes, APIs, npm scripts) or say “open …” for CRM, Content Studio, newsletters, Ascendra Intelligence, Growth OS, analytics, site directory, and more. With{" "}
                  <span className="text-foreground/90">Allow agent to perform actions</span> in Settings, I can navigate or run reminder generation. Context from this deployment refreshes every few minutes.
                </p>
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
                        : "inline-block rounded-lg bg-muted px-3 py-1.5 max-w-full"
                    }
                  >
                    {m.role === "assistant" ? (
                      <AdminAgentReplyText text={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
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
                placeholder="e.g. Where is lead intake? Open content studio."
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
