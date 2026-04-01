"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Lock, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { TIMELINE_OPTIONS } from "@/lib/funnel-content";
import { marketScoreFunnelBodySchema, type MarketScoreFunnelBody } from "@/lib/market-score/requestSchema";
import { BOOK_CALL_HREF } from "@/lib/funnelCtas";
import { MARKETING_CTA_BOOK_STRATEGY_CALL } from "@shared/marketingCtaCopy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const PERSONA_PRESETS = [
  { value: "Marcus — urgency / mobile-first owner", label: "Urgency / mobile-first owner" },
  { value: "Tasha — ops / booking automation", label: "Ops / booking automation" },
  { value: "Devon — validation / MVP buyer", label: "Validation / MVP buyer" },
  { value: "Andre — authority / strategic buyer", label: "Authority / strategic buyer" },
] as const;

const REVENUE_BANDS = [
  "Pre-revenue / under $10k/mo",
  "$10k–$50k/mo",
  "$50k–$200k/mo",
  "$200k+/mo",
] as const;

const UNSET_SELECT = "__unset__";

function fireAdsConversion() {
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_MARKET_SCORE_SEND_TO?.trim();
  if (!sendTo || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { send_to: sendTo });
}

export type MarketScorePreview = {
  demand: { label: string; score: number };
  competition: { label: string; score: number };
  purchasePower: { label: string; score: number };
};

function MarketScoreSnapshotCard({
  preview,
  onScoreAnother,
}: {
  preview: MarketScorePreview;
  onScoreAnother: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Estimates are directional and combine search, competition, and local economics signals. Full narrative, funnel,
        and channel guidance is prepared on our side—unlocked on a strategy call.
      </p>
      <ul className="space-y-4">
        <li className="rounded-lg border border-border bg-muted/30 px-5 py-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Demand</p>
          <p className="text-lg font-semibold text-foreground">{preview.demand.label}</p>
          <p className="text-xs text-muted-foreground">Index {preview.demand.score}/100</p>
        </li>
        <li className="rounded-lg border border-border bg-muted/30 px-5 py-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Competition</p>
          <p className="text-lg font-semibold text-foreground">{preview.competition.label}</p>
          <p className="text-xs text-muted-foreground">Index {preview.competition.score}/100</p>
        </li>
        <li className="rounded-lg border border-border bg-muted/30 px-5 py-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Purchase power</p>
          <p className="text-lg font-semibold text-foreground">{preview.purchasePower.label}</p>
          <p className="text-xs text-muted-foreground">Index {preview.purchasePower.score}/100</p>
        </li>
      </ul>

      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-6 py-6 sm:px-8 text-center space-y-3">
        <Lock className="h-8 w-8 text-primary mx-auto opacity-90" aria-hidden />
        <p className="font-semibold text-foreground">Unlock the full report by booking a strategy call</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We map these scores to your offer, operations, and growth timeline—plus positioning, funnel, and paid media
          notes you can use on calls and campaigns.
        </p>
        <Button asChild size="lg" className="min-h-[48px] w-full sm:w-auto">
          <Link href={BOOK_CALL_HREF}>{MARKETING_CTA_BOOK_STRATEGY_CALL}</Link>
        </Button>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onScoreAnother}>
        Score another market
      </Button>
    </div>
  );
}

export function MarketScoreFunnelClient() {
  const { getVisitorId } = useVisitorTracking();
  const [result, setResult] = useState<MarketScorePreview | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const wasResultsDialogOpen = useRef(false);

  const defaultPersona = PERSONA_PRESETS[0].value;

  const formDefaults: MarketScoreFunnelBody = {
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    serviceType: "",
    location: "",
    persona: defaultPersona,
    monthlyRevenue: UNSET_SELECT,
    timeline: UNSET_SELECT,
    goal: "",
    websiteUrl: "",
    visitorId: "",
    attribution: undefined,
  };

  const form = useForm<MarketScoreFunnelBody>({
    resolver: zodResolver(marketScoreFunnelBodySchema),
    defaultValues: formDefaults,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const body: MarketScoreFunnelBody = {
        ...values,
        phone: values.phone?.trim() || null,
        company: values.company?.trim() || null,
        monthlyRevenue:
          !values.monthlyRevenue || values.monthlyRevenue === UNSET_SELECT ? null : values.monthlyRevenue.trim(),
        timeline: !values.timeline || values.timeline === UNSET_SELECT ? null : values.timeline.trim(),
        goal: values.goal?.trim() || null,
        websiteUrl: values.websiteUrl?.trim() || null,
        visitorId: getVisitorId() || null,
        attribution: {
          utm_source: params?.get("utm_source") || null,
          utm_medium: params?.get("utm_medium") || null,
          utm_campaign: params?.get("utm_campaign") || null,
          utm_term: params?.get("utm_term") || null,
          utm_content: params?.get("utm_content") || null,
          gclid: params?.get("gclid") || null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          landing_page:
            typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/market-score",
        },
      };

      const res = await fetch("/api/funnel/market-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Something went wrong");
      }
      if (!json.preview) throw new Error("Invalid response");

      setResult(json.preview);
      setResultsOpen(true);
      fireAdsConversion();
      if (json.emailSent === false) {
        toast({
          title: "Market Score ready",
          description:
            "Your scores are below. We couldn’t send the email copy—please check spam or contact us if you need it resent.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Market Score ready",
          description: "Check your email for a copy of the snapshot—we’ll follow up with context over the next few days.",
        });
      }
    } catch (e) {
      toast({
        title: "Could not run score",
        description: e instanceof Error ? e.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  });

  const heroCta = useMemo(
    () => (
      <Button type="button" size="lg" className="min-h-[48px] gap-2" asChild>
        <a href="#market-input">Run free Market Score</a>
      </Button>
    ),
    [],
  );

  const scoreAnother = () => {
    setResultsOpen(false);
    setResult(null);
    form.reset(formDefaults);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const closedFromDialog = wasResultsDialogOpen.current && !resultsOpen && !!result;
    wasResultsDialogOpen.current = resultsOpen;
    if (closedFromDialog) {
      document.getElementById("market-score-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultsOpen, result]);

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
          <Radar className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Market Score — demand, competition, and buying power in one pass
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Powered by Ascendra&apos;s market intelligence engine. Tell us who you serve and where—we return a clear
          snapshot and store the full analysis in your lead record for follow-up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center pt-2">
          {heroCta}
          <Button type="button" size="lg" variant="outline" className="min-h-[48px] bg-background/60" asChild>
            <Link href="/free-growth-tools">More free tools</Link>
          </Button>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
        {[
          {
            title: "Faster than guessing",
            body: "See how demand, crowding, and economics stack for your service in a specific market—without a long research project.",
          },
          {
            title: "Tied to Ascendra OS",
            body: "Submission creates or updates your CRM lead, applies tags and scoring, and saves the full AMIE report for your team.",
          },
          {
            title: "Email sequence",
            body: "Instant snapshot email plus two short follow-ups at 24h and 72h—each with a path to unlock the full breakdown.",
          },
          {
            title: "Built for calls & campaigns",
            body: "UTM and click IDs land on the lead for attribution. Pair with Google Ads conversion tracking when you promote the tool.",
          },
        ].map((b) => (
          <Card key={b.title} className="border-border/80 bg-card/80">
            <CardContent className="px-6 py-6 sm:px-8 sm:py-7">
              <h2 className="text-sm font-semibold text-foreground mb-3">{b.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="market-input" className="max-w-xl mx-auto scroll-mt-28">
        <Card className="border-border shadow-md">
          <CardContent className="px-6 py-7 sm:px-9 sm:py-9">
            <h2 className="text-lg font-semibold text-foreground mb-1">Market input</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We’ll email your snapshot and attach the deep report to your lead for internal use.
            </p>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} value={field.value ?? ""} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Home services, B2B SaaS" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service or offer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Emergency HVAC, fractional CMO" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market / location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, metro, or region" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="persona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer persona (pick closest)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PERSONA_PRESETS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approx. monthly revenue</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || UNSET_SELECT}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UNSET_SELECT}>Prefer not to say</SelectItem>
                            {REVENUE_BANDS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline to act</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || UNSET_SELECT}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UNSET_SELECT}>Prefer not to say</SelectItem>
                            {TIMELINE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Growth goal (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="What outcome are you trying to drive in this market?"
                          className="bg-background resize-y min-h-[80px]"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                  {...form.register("websiteUrl")}
                />
                <Button type="submit" className="w-full min-h-[48px] gap-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Running analysis…
                    </>
                  ) : (
                    <>Run Market Score</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {result && !resultsOpen ? (
        <section
          id="market-score-results"
          className="max-w-xl mx-auto scroll-mt-28 space-y-4"
          aria-live="polite"
        >
          <Card className="border-primary/25 shadow-lg bg-card">
            <CardContent className="px-6 py-7 sm:px-9 sm:py-8 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Radar className="h-6 w-6 shrink-0" aria-hidden />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Your Market Score snapshot</h2>
              </div>
              <MarketScoreSnapshotCard preview={result} onScoreAnother={scoreAnother} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Dialog
        open={resultsOpen}
        onOpenChange={(open) => {
          setResultsOpen(open);
        }}
      >
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[min(90dvh,720px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-left text-xl font-semibold">
              <Radar className="h-6 w-6 shrink-0" aria-hidden />
              Your Market Score snapshot
            </DialogTitle>
            <DialogDescription>
              Demand, competition, and purchase power for the market you submitted. Check your email for the same
              snapshot.
            </DialogDescription>
          </DialogHeader>
          {result ? <MarketScoreSnapshotCard preview={result} onScoreAnother={scoreAnother} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
