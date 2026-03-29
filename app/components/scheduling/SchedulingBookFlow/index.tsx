"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { funnelThankYouUrl, THANK_YOU_SESSION } from "@/lib/funnelThankYou";

type MeetingType = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  description: string | null;
};

type Host = { id: number; username: string; displayName: string };

type Slot = { startAt: string; endAt: string; label: string };

type BookingPagePayload = {
  slug: string;
  title: string;
  shortDescription: string | null;
  bestForBullets: string[];
  hostMode: string;
  fixedHostUserId: number | null;
  formFieldsJson: Array<{ id: string; label: string; type: "text" | "textarea"; required?: boolean }>;
  redirectUrl: string | null;
  bookingTypeId: number;
};

export interface SchedulingBookFlowProps {
  /** When set, loads `/api/public/scheduler/booking-page/:slug` and locks meeting type + funnel copy. */
  bookingPageSlug?: string;
}

export function SchedulingBookFlow({ bookingPageSlug }: SchedulingBookFlowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [aiOn, setAiOn] = useState(false);
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostUserId, setHostUserId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pagePayload, setPagePayload] = useState<BookingPagePayload | null>(null);
  const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({});
  const [company, setCompany] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (bookingPageSlug) {
          const pres = await fetch(`/api/public/scheduler/booking-page/${encodeURIComponent(bookingPageSlug)}`);
          const pdata = await pres.json();
          if (cancelled) return;
          if (!pres.ok) {
            setEnabled(false);
            return;
          }
          setEnabled(!!pdata.enabled);
          setTimezone(pdata.timezone || "America/New_York");
          setAiOn(!!pdata.aiAssistantEnabled);
          const p = pdata.page as BookingPagePayload;
          const bt = pdata.bookingType as MeetingType;
          setPagePayload(p);
          setTypes([bt]);
          setTypeId(bt.id);
          const h = (pdata.hosts || []) as Host[];
          setHosts(h);
          if (p.hostMode === "fixed" && p.fixedHostUserId != null) {
            setHostUserId(p.fixedHostUserId);
          } else if (h.length === 1) {
            setHostUserId(h[0]!.id);
          } else {
            setHostUserId(null);
          }
          return;
        }

        const res = await fetch("/api/public/scheduling/types");
        const data = await res.json();
        if (cancelled) return;
        setEnabled(!!data.enabled);
        setTimezone(data.timezone || "America/New_York");
        setAiOn(!!data.aiAssistantEnabled);
        const t = (data.types || []) as MeetingType[];
        setTypes(t);
        if (t[0]) setTypeId(t[0].id);
        const h = (data.hosts || []) as Host[];
        setHosts(h);
        if (h.length === 1) setHostUserId(h[0]!.id);
        else setHostUserId(null);
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingPageSlug]);

  const loadSlots = useCallback(async () => {
    if (!typeId || !date) return;
    setSlotsLoading(true);
    setSelectedStart(null);
    setError(null);
    try {
      const hostQs = hostUserId != null ? `&hostUserId=${hostUserId}` : "";
      const res = await fetch(
        `/api/public/scheduling/slots?date=${encodeURIComponent(date)}&typeId=${typeId}${hostQs}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load times");
      setSlots(data.slots || []);
    } catch (e) {
      setSlots([]);
      setError(e instanceof Error ? e.message : "Could not load times");
    } finally {
      setSlotsLoading(false);
    }
  }, [date, typeId, hosts.length, hostUserId]);

  useEffect(() => {
    if (typeId) void loadSlots();
  }, [typeId, date, loadSlots]);

  const selectedType = useMemo(() => types.find((t) => t.id === typeId), [types, typeId]);

  async function onBook(e: React.FormEvent) {
    e.preventDefault();
    if (!typeId || !selectedStart || !name.trim() || !email.trim()) {
      setError("Pick a time and enter your name and email.");
      return;
    }
    if (pagePayload?.formFieldsJson?.length) {
      for (const f of pagePayload.formFieldsJson) {
        if (f.required && !(extraFieldValues[f.id] || "").trim()) {
          setError(`Please complete: ${f.label}`);
          return;
        }
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const formAnswers: Record<string, unknown> = { ...extraFieldValues };
      const res = await fetch("/api/public/scheduling/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingTypeId: typeId,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim() || undefined,
          guestCompany: company.trim() || undefined,
          startAt: selectedStart,
          guestNotes: notes.trim() || undefined,
          ...(hostUserId != null ? { hostUserId } : {}),
          ...(bookingPageSlug ? { bookingPageSlug, formAnswers, bookingSource: `page:${bookingPageSlug}` } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      const token = data.guestToken as string;
      const emailSent = data.confirmationEmailSent as boolean | undefined;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(THANK_YOU_SESSION.bookingManageHref, `/book/manage/${token}`);
        sessionStorage.setItem(THANK_YOU_SESSION.bookingEmailSent, String(emailSent !== false));
      }
      if (pagePayload?.redirectUrl) {
        router.push(pagePayload.redirectUrl);
      } else {
        router.push(funnelThankYouUrl("native_booking"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendAi() {
    const q = aiInput.trim();
    if (!q) return;
    setAiLoading(true);
    setAiInput("");
    const next = [...aiMessages, { role: "user" as const, content: q }];
    setAiMessages(next);
    try {
      const res = await fetch("/api/public/scheduling/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assistant unavailable");
      setAiMessages([...next, { role: "assistant", content: data.reply || "—" }]);
    } catch {
      setAiMessages([
        ...next,
        { role: "assistant", content: "Assistant is unavailable. Please pick a meeting type and time above." },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online scheduling is off</CardTitle>
          <CardDescription>Ask your Ascendra contact for a time, or use the strategy call form.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{pagePayload?.title ?? "Pick a meeting"}</CardTitle>
            <CardDescription className="space-y-2">
              <span>
                Times shown in <span className="text-foreground font-medium">{timezone}</span>
                {selectedType ? ` · ${selectedType.durationMinutes} minutes` : null}
              </span>
              {pagePayload?.shortDescription ? (
                <span className="block text-muted-foreground">{pagePayload.shortDescription}</span>
              ) : null}
              {pagePayload?.bestForBullets?.length ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {pagePayload.bestForBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hosts.length > 1 && pagePayload?.hostMode !== "fixed" ? (
              <div className="space-y-2">
                <Label>Who you&apos;re meeting with</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={hostUserId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHostUserId(v === "" ? null : Number(v));
                  }}
                >
                  <option value="">Select…</option>
                  {hosts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {!pagePayload ? (
              <div className="space-y-2">
                <Label>Meeting type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={typeId ?? ""}
                  onChange={(e) => setTypeId(Number(e.target.value))}
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedType?.description ? (
                  <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                ) : null}
              </div>
            ) : selectedType?.description ? (
              <p className="text-sm text-muted-foreground">{selectedType.description}</p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="book-date">Date</Label>
              <Input id="book-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Available times</Label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open slots that day. Try another date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <Button
                      key={s.startAt}
                      type="button"
                      size="sm"
                      variant={selectedStart === s.startAt ? "default" : "outline"}
                      onClick={() => setSelectedStart(s.startAt)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onBook} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="g-name">Name</Label>
                <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-email">Email</Label>
                <Input id="g-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-phone">Phone (optional)</Label>
                <Input id="g-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {pagePayload?.formFieldsJson?.map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={`bf-${f.id}`}>
                    {f.label}
                    {f.required ? " *" : ""}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`bf-${f.id}`}
                      value={extraFieldValues[f.id] ?? ""}
                      onChange={(e) => setExtraFieldValues((s) => ({ ...s, [f.id]: e.target.value }))}
                      rows={3}
                      required={!!f.required}
                    />
                  ) : (
                    <Input
                      id={`bf-${f.id}`}
                      value={extraFieldValues[f.id] ?? ""}
                      onChange={(e) => setExtraFieldValues((s) => ({ ...s, [f.id]: e.target.value }))}
                      required={!!f.required}
                    />
                  )}
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="g-notes">Notes (optional)</Label>
                <Textarea id="g-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button
                type="submit"
                disabled={submitting || !selectedStart || (hosts.length > 1 && hostUserId == null)}
                className="min-h-[48px]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm booking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {aiOn ? (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                AI assistant
              </CardTitle>
              <CardDescription>Ask which meeting type fits you—we won&apos;t pick a time for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => setAiOpen(!aiOpen)}>
                <MessageCircle className="h-4 w-4" />
                {aiOpen ? "Hide chat" : "Open chat"}
              </Button>
              {aiOpen ? (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3 max-h-[320px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 text-sm">
                    {aiMessages.length === 0 ? (
                      <p className="text-muted-foreground">e.g. &quot;I need a quick intro before a website project&quot;</p>
                    ) : (
                      aiMessages.map((m, i) => (
                        <div key={i} className={m.role === "user" ? "text-foreground" : "text-muted-foreground"}>
                          <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}:</span> {m.content}
                        </div>
                      ))
                    )}
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask a question…"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), sendAi())}
                    />
                    <Button type="button" size="sm" onClick={sendAi} disabled={aiLoading}>
                      Send
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
