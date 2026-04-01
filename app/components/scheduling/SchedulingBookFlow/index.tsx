"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { funnelThankYouUrl, THANK_YOU_SESSION } from "@/lib/funnelThankYou";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { cn } from "@/lib/utils";
import type { BookingPageTheme } from "@/lib/bookingPageTheme";
import {
  DEFAULT_BOOKING_PAGE_THEME,
  bookingPageThemeFromSettingsJson,
  heroGradientClass,
} from "@/lib/bookingPageTheme";
import { CTAReassuranceLine, WhatToExpectList } from "@/components/marketing/EmbeddedAssurance";
import {
  CTA_REASSURANCE_BOOKING_FLOW,
  WHAT_TO_EXPECT_BOOKING_ITEMS,
  WHAT_TO_EXPECT_BOOKING_TITLE,
} from "@/lib/embeddedAssuranceCopy";

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

function cardSurfaceClass(theme: BookingPageTheme): string {
  switch (theme.cardStyle) {
    case "minimal":
      return "rounded-2xl border border-border/50 bg-background/90 shadow-sm";
    case "default":
      return "rounded-2xl border border-border/70 bg-card shadow-lg";
    case "glass":
    default:
      return cn(
        "rounded-2xl border border-white/15 bg-background/55 dark:bg-background/35",
        "backdrop-blur-2xl shadow-2xl shadow-black/15 dark:shadow-black/40",
      );
  }
}

export interface SchedulingBookFlowProps {
  /** When set, loads `/api/public/scheduler/booking-page/:slug` and locks meeting type + funnel copy. */
  bookingPageSlug?: string;
}

export function SchedulingBookFlow({ bookingPageSlug }: SchedulingBookFlowProps) {
  const router = useRouter();
  const { getAttributionSnapshot, track } = useVisitorTracking();
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
  const [branding, setBranding] = useState<BookingPageTheme>(DEFAULT_BOOKING_PAGE_THEME);
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
          if (pdata.branding && typeof pdata.branding === "object") {
            setBranding(
              bookingPageThemeFromSettingsJson({ branding: pdata.branding as Record<string, unknown> }),
            );
          }
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
        setTypeId(t[0] ? t[0].id : null);
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

  useEffect(() => {
    if (!enabled || loading) return;
    track("page_view");
  }, [enabled, loading, track]);

  /** Keep selected meeting type valid when the types list changes (fixes empty / mismatched selector). */
  useEffect(() => {
    if (types.length === 0) return;
    if (typeId == null || !types.some((t) => t.id === typeId)) {
      setTypeId(types[0]!.id);
    }
  }, [types, typeId]);

  const theme = pagePayload ? branding : DEFAULT_BOOKING_PAGE_THEME;
  const accentVar = theme.accentColor ? { ["--booking-accent" as string]: theme.accentColor } : {};

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
  }, [date, typeId, hostUserId]);

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
      const attr = getAttributionSnapshot();
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
          ...(attr.visitorId ? { visitorId: attr.visitorId } : {}),
          ...(attr.sessionId ? { sessionId: attr.sessionId } : {}),
          ...("attributionSessionPublicId" in attr && attr.attributionSessionPublicId
            ? { attributionSessionPublicId: attr.attributionSessionPublicId }
            : {}),
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
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <Card className={cn(cardSurfaceClass(theme), "max-w-lg mx-auto")}>
        <CardHeader>
          <CardTitle>Online scheduling is off</CardTitle>
          <CardDescription>
            Ask your Ascendra contact for a time, or use the strategy call form.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const cardClass = cardSurfaceClass(theme);
  const slotRing =
    theme.accentColor != null
      ? "focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
      : "focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="space-y-8" style={{ ...accentVar }}>
      {pagePayload ? (
        <section
          className={cn(
            "relative overflow-hidden rounded-3xl border border-border/40 shadow-2xl",
            theme.heroGradient === "none" && !theme.heroImageUrl
              ? "bg-muted/40"
              : cn("bg-gradient-to-br", heroGradientClass(theme.heroGradient)),
          )}
        >
          {theme.heroImageUrl ? (
            <img
              src={theme.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40",
              theme.heroImageUrl && "from-background/95 via-background/75",
            )}
          />
          <div className="relative px-5 py-8 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Book a time
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl leading-tight"
              style={theme.accentColor ? { color: undefined } : undefined}
            >
              {pagePayload.title}
            </h1>
            {pagePayload.shortDescription ? (
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {pagePayload.shortDescription}
              </p>
            ) : null}
            {pagePayload.bestForBullets?.length ? (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2 max-w-2xl text-sm text-foreground/90">
                {pagePayload.bestForBullets.map((b) => (
                  <li key={b} className="flex gap-2 items-start">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-primary"
                      style={theme.accentColor ? { backgroundColor: theme.accentColor } : undefined}
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {bookingPageSlug ? (
        <WhatToExpectList
          title={WHAT_TO_EXPECT_BOOKING_TITLE}
          items={WHAT_TO_EXPECT_BOOKING_ITEMS}
          compact
          className="max-w-3xl mx-auto"
        />
      ) : null}

      <div className={cn("grid gap-8", aiOn ? "lg:grid-cols-3" : "max-w-3xl")}>
        <div className={cn("space-y-8", aiOn && "lg:col-span-2")}>
          <div className={cn(cardClass)}>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl p-2.5 shrink-0 bg-primary/15 text-primary">
                  <Calendar className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {pagePayload ? "Choose your time" : "Schedule a meeting"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      Times in <strong className="font-medium text-foreground">{timezone}</strong>
                    </span>
                    {selectedType ? (
                      <span className="text-muted-foreground">· {selectedType.durationMinutes} min</span>
                    ) : null}
                  </p>
                </div>
              </div>

              {pagePayload && selectedType ? (
                <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Meeting type
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{selectedType.name}</p>
                  {selectedType.description ? (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {selectedType.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {hosts.length > 1 && pagePayload?.hostMode !== "fixed" ? (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Who you&apos;re meeting with</Label>
                  <Select
                    value={hostUserId != null ? String(hostUserId) : undefined}
                    onValueChange={(v) => setHostUserId(Number(v))}
                  >
                    <SelectTrigger className="min-h-[48px] w-full rounded-xl text-base" aria-label="Select host">
                      <SelectValue placeholder={"Choose who you're meeting"} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {hosts.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {!pagePayload ? (
                <div className="space-y-2">
                  <Label className="text-base font-medium" htmlFor="meeting-type-select">
                    Meeting type
                  </Label>
                  <Select
                    value={typeId != null ? String(typeId) : undefined}
          onValueChange={(v) => setTypeId(Number(v))}
                    disabled={types.length === 0}
                  >
                    <SelectTrigger
                      id="meeting-type-select"
                      className="min-h-[48px] w-full rounded-xl text-base"
                    >
                      <SelectValue
                        placeholder={types.length ? "Select a meeting type" : "Loading types…"}
                      />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {types.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name} · {t.durationMinutes} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedType?.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedType.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-base font-medium" htmlFor="book-date">
                  Date
                </Label>
                <Input
                  id="book-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-[48px] rounded-xl text-base"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Available times</Label>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-5 w-5 animate-spin" /> Finding open slots…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
                    No open slots that day. Try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {slots.map((s) => (
                      <Button
                        key={s.startAt}
                        type="button"
                        size="lg"
                        variant={selectedStart === s.startAt ? "default" : "outline"}
                        className={cn(
                          "min-h-[52px] rounded-xl text-base font-medium transition-all",
                          selectedStart === s.startAt &&
                            theme.accentColor &&
                            "bg-[var(--booking-accent)] hover:bg-[var(--booking-accent)]/90 text-white border-transparent",
                          slotRing,
                        )}
                        onClick={() => setSelectedStart(s.startAt)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={cn(cardClass)}>
            <div className="p-6 sm:p-8 space-y-5">
              <h2 className="text-xl font-semibold tracking-tight">Your details</h2>
              <form onSubmit={onBook} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="g-name">Full name</Label>
                    <Input
                      id="g-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="min-h-[48px] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="g-email">Email</Label>
                    <Input
                      id="g-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="min-h-[48px] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="g-phone">Phone (optional)</Label>
                    <Input
                      id="g-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="min-h-[48px] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="g-company">Company (optional)</Label>
                    <Input
                      id="g-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="min-h-[48px] rounded-xl"
                    />
                  </div>
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
                        className="rounded-xl"
                      />
                    ) : (
                      <Input
                        id={`bf-${f.id}`}
                        value={extraFieldValues[f.id] ?? ""}
                        onChange={(e) => setExtraFieldValues((s) => ({ ...s, [f.id]: e.target.value }))}
                        required={!!f.required}
                        className="min-h-[48px] rounded-xl"
                      />
                    )}
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="g-notes">Notes (optional)</Label>
                  <Textarea
                    id="g-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
                {error ? <p className="text-sm text-destructive font-medium">{error}</p> : null}
                <CTAReassuranceLine dense className="text-left max-w-none sm:text-center">
                  {CTA_REASSURANCE_BOOKING_FLOW}
                </CTAReassuranceLine>
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedStart ||
                    (hosts.length > 1 && hostUserId == null && pagePayload?.hostMode !== "fixed")
                  }
                  size="lg"
                  className={cn(
                    "min-h-[54px] w-full sm:w-auto rounded-xl text-base px-8",
                    theme.accentColor && "bg-[var(--booking-accent)] hover:bg-[var(--booking-accent)]/90",
                  )}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm booking"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {aiOn ? (
          <div>
            <div className={cn(cardClass)}>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI assistant
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask which meeting type fits you—we won&apos;t pick a time for you.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 rounded-xl min-h-[44px]"
                  onClick={() => setAiOpen(!aiOpen)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {aiOpen ? "Hide chat" : "Open chat"}
                </Button>
                {aiOpen ? (
                  <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4 max-h-[320px] flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-2 text-sm">
                      {aiMessages.length === 0 ? (
                        <p className="text-muted-foreground">
                          e.g. &quot;I need a quick intro before a website project&quot;
                        </p>
                      ) : (
                        aiMessages.map((m, i) => (
                          <div key={i} className={m.role === "user" ? "text-foreground" : "text-muted-foreground"}>
                            <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}:</span>{" "}
                            {m.content}
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
                        className="rounded-xl"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), sendAi())}
                      />
                      <Button type="button" size="sm" className="rounded-xl shrink-0" onClick={sendAi} disabled={aiLoading}>
                        Send
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
