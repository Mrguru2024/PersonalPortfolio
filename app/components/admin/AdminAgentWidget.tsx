"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Loader2, Minimize2, ImagePlus, X } from "lucide-react";
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
  mediaInterpretation?: string;
  actionSummary?: string;
  requiresActionConfirmation?: boolean;
}

interface AgentBootstrap {
  greetingLine: string;
  mentorNudge: string | null;
  policyNotice: string;
}

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Runs a server-confirmed action and returns markdown for the chat transcript. */
async function runAgentAction(
  action: NonNullable<AgentResponse["action"]>,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<{ ok: boolean; markdown: string }> {
  if (action.type === "generate_reminders" && action.api === "POST /api/admin/reminders") {
    try {
      await apiRequest("POST", "/api/admin/reminders", {});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      return {
        ok: true,
        markdown:
          "## Action result\n\n- Reminder generator **completed**. Open [Reminders](/admin/reminders) to review tasks.",
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      return {
        ok: false,
        markdown: `## Action result\n\n- Reminder generator **failed**: ${msg}`,
      };
    }
  }
  if (typeof action.url === "string" && action.url.startsWith("/")) {
    router.push(action.url);
    return {
      ok: true,
      markdown: `## Action result\n\n- **Opened** [this screen](${action.url}).`,
    };
  }
  return {
    ok: false,
    markdown: "## Action result\n\n- No runnable action was recognized.",
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

export function AdminAgentWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageAttachments, setImageAttachments] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    action: NonNullable<AgentResponse["action"]>;
    summary: string;
  } | null>(null);
  const [actionExecuting, setActionExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.isAdmin === true && user?.adminApproved === true;
  const localFirstName =
    user?.full_name?.trim().split(/\s+/).filter(Boolean)[0] ??
    user?.username ??
    "there";

  const bootstrapQuery = useQuery({
    queryKey: ["/api/admin/agent", "bootstrap"],
    queryFn: async (): Promise<AgentBootstrap> => {
      const res = await fetch("/api/admin/agent", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Bootstrap failed");
      }
      return res.json() as Promise<AgentBootstrap>;
    },
    enabled: isAdmin && open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, pendingAction]);

  const sendMutation = useMutation({
    mutationFn: async (variables: {
      message: string;
      history: AgentMessage[];
      imageAttachments: string[];
    }) => {
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: variables.message,
          currentPath: pathname ?? undefined,
          history: variables.history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          imageAttachments: variables.imageAttachments.length > 0 ? variables.imageAttachments : undefined,
        }),
        credentials: "include",
      });
      const data = (await res.json()) as AgentResponse & { message?: string };
      if (!res.ok) throw new Error(data.reply || data.message || "Request failed");
      return data;
    },
    onSuccess: async (data, variables) => {
      setPendingAction(null);
      const userLabel =
        variables.message.trim() ||
        (variables.imageAttachments.length > 0 ? `(${variables.imageAttachments.length} image${variables.imageAttachments.length > 1 ? "s" : ""})` : "");
      let assistantText = data.reply;
      if (data.mediaInterpretation?.trim()) {
        assistantText += `\n\n## From your image\n\n${data.mediaInterpretation.trim()}`;
      }
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userLabel || "(empty)" },
        { role: "assistant", content: assistantText },
      ]);
      setImageAttachments([]);
      if (data.action) {
        if (data.requiresActionConfirmation) {
          setPendingAction({
            action: data.action,
            summary: data.actionSummary ?? "Run the suggested action?",
          });
        } else {
          setActionExecuting(true);
          try {
            const result = await runAgentAction(data.action, router, queryClient);
            setMessages((prev) => [...prev, { role: "assistant", content: result.markdown }]);
          } finally {
            setActionExecuting(false);
          }
        }
      }
    },
    onError: (err, variables) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content:
            variables.message.trim() ||
            (variables.imageAttachments.length ? `(${variables.imageAttachments.length} image(s))` : ""),
        },
        { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    },
  });

  const handleSubmit = () => {
    const text = input.trim();
    if ((!text && imageAttachments.length === 0) || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate({ message: text, history: messages, imageAttachments });
  };

  const onPickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: string[] = [...imageAttachments];
    for (let i = 0; i < files.length && next.length < MAX_IMAGES; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMAGE_BYTES) continue;
      try {
        const url = await readFileAsDataUrl(f);
        next.push(url);
      } catch {
        /* skip */
      }
    }
    setImageAttachments(next.slice(0, MAX_IMAGES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col w-[min(400px,calc(100vw-2rem))] h-[min(420px,calc(100vh-8rem))] max-h-[520px] rounded-xl border bg-card text-card-foreground shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <span className="font-medium text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Admin mentor and assistant
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-sm min-h-0">
            {messages.length === 0 && (
              <div className="text-muted-foreground text-center py-3 space-y-3 px-1">
                {bootstrapQuery.isPending && <p className="text-sm animate-pulse">Loading your greeting…</p>}
                {!bootstrapQuery.isPending && (
                  <>
                    <p className="text-foreground/95 font-medium text-sm leading-snug">
                      {bootstrapQuery.data?.greetingLine ??
                        `Hi, ${localFirstName} — I'm your admin mentor and assistant.`}
                    </p>
                    {bootstrapQuery.data?.mentorNudge ? (
                      <p className="text-sm border border-border/80 rounded-lg bg-muted/40 px-3 py-2 text-left">
                        <span className="text-foreground/80 font-medium">Nudge: </span>
                        {bootstrapQuery.data.mentorNudge}
                      </p>
                    ) : null}
                  </>
                )}
                <p className="text-sm leading-relaxed">
                  Ask where something lives, say “open …” for CRM or Content Studio, or attach screenshots (PNG, JPEG, WebP, GIF). Describe what you want done in text alongside images. With{" "}
                  <span className="text-foreground/90">Allow agent to perform actions</span> in Settings, I can run navigation and reminders; with{" "}
                  <span className="text-foreground/90">Confirm before running actions</span>, you approve each step and see an Action result line after it runs. Build optional notes in{" "}
                  <span className="text-foreground/90">Assistant knowledge</span> (Settings) for facts, research context, and message flows.
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground/90 border-t border-border/60 pt-2">
                  {bootstrapQuery.data?.policyNotice ??
                    "Conversation-derived insights are stored only on this site to personalize your assistant; they are not sold or shared with third parties."}
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}-${m.content.slice(0, 20)}`}
                className={m.role === "user" ? "ml-6 text-right" : "mr-6 text-left"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1.5"
                      : "inline-block rounded-lg bg-muted px-3.5 py-2.5 max-w-full text-left align-top"
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
          {pendingAction && (
            <div className="border-t border-border/80 bg-muted/40 px-3 py-2 space-y-2 shrink-0">
              <p className="text-xs font-semibold text-foreground">Confirm action</p>
              <div className="text-sm text-muted-foreground">
                <AdminAgentReplyText text={pendingAction.summary} />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8"
                  disabled={actionExecuting}
                  onClick={() => {
                    void (async () => {
                      setActionExecuting(true);
                      try {
                        const result = await runAgentAction(pendingAction.action, router, queryClient);
                        setMessages((prev) => [...prev, { role: "assistant", content: result.markdown }]);
                        setPendingAction(null);
                      } finally {
                        setActionExecuting(false);
                      }
                    })();
                  }}
                >
                  {actionExecuting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Running…
                    </>
                  ) : (
                    "Run action"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  disabled={actionExecuting}
                  onClick={() => setPendingAction(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          {imageAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-2 pt-1 border-t border-border/60">
              {imageAttachments.map((src, i) => (
                <div key={`${i}-${src.slice(0, 30)}`} className="relative h-12 w-12 rounded-md overflow-hidden border">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center bg-background/90 rounded-bl"
                    onClick={() => setImageAttachments((a) => a.filter((_, j) => j !== i))}
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="p-2 border-t flex gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              multiple
              className="sr-only"
              aria-label="Attach screenshot images for the assistant"
              title="Attach images"
              onChange={(e) => void onPickImages(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={sendMutation.isPending || imageAttachments.length >= MAX_IMAGES}
              aria-label="Attach image"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Message or describe an attached screenshot…"
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
              disabled={(!input.trim() && imageAttachments.length === 0) || sendMutation.isPending}
              aria-label="Send"
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close mentor and assistant" : "Open admin mentor and assistant"}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
}
