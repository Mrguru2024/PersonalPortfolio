"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StrategyCallForm } from "@/components/funnel/StrategyCallForm";
import {
  COMPANY_ADDRESS,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_E164,
} from "@/lib/company";
import { cn } from "@/lib/utils";

const TOPIC_PRESETS = [
  {
    id: "brand",
    label: "Brand & messaging",
    text: "I want to sharpen our brand story, positioning, and messaging so our site and campaigns convert better.",
  },
  {
    id: "web",
    label: "Website / UX",
    text: "We need a clearer website structure, faster performance, and a better path from visitor to lead or sale.",
  },
  {
    id: "launch",
    label: "Launch / MVP",
    text: "We are launching (or relaunching) soon and need a coordinated brand, site, and first marketing push.",
  },
  {
    id: "marketing",
    label: "Marketing assets",
    text: "We need ongoing marketing assets and campaigns that match our brand and support our sales process.",
  },
  {
    id: "unsure",
    label: "Not sure yet",
    text: "I am not sure where to start—I would like help prioritizing brand, web, and marketing for our stage.",
  },
] as const;

const PREP_ITEMS = [
  {
    value: "objective",
    title: "Start with the outcome",
    body: "One concrete business outcome (leads, bookings, clarity, or launch date) helps us prepare questions and examples that match your stage.",
  },
  {
    value: "context",
    title: "Share current context",
    body: "A link to your site, socials, or deck—even rough—saves back-and-forth and keeps the call focused on decisions, not discovery.",
  },
  {
    value: "timeline",
    title: "Be honest about timing",
    body: "Whether you need something next month or next quarter, realistic timing lets us suggest a sensible sequence and scope.",
  },
  {
    value: "audit",
    title: "Prefer written clarity first?",
    body: "If direction still feels fuzzy, the free growth audit gives structured recommendations you can act on—or bring to the call.",
  },
] as const;

export function ContactBookingSection() {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const [injection, setInjection] = useState<{ id: number; text: string } | null>(
    null,
  );
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const applyTopic = useCallback((preset: (typeof TOPIC_PRESETS)[number]) => {
    setActiveTopic(preset.id);
    setInjection({ id: Date.now(), text: preset.text });
  }, []);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS.line)}`;

  const heroMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="relative isolate w-full min-w-0 max-w-full overflow-x-hidden py-10 fold:py-12 sm:py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-[28rem] overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -left-1/4 top-0 h-72 w-[120%] max-w-none rounded-full bg-primary/15 blur-3xl dark:bg-primary/20 motion-safe:animate-[ambient-float_18s_ease-in-out_infinite]"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute right-[-20%] top-24 h-64 w-[90%] rounded-full bg-secondary/40 blur-3xl dark:bg-secondary/25 motion-safe:animate-[ambient-float_22s_ease-in-out_infinite]"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 noise-texture opacity-40" />
      </div>

      <div className="container relative mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
          <motion.header
            className="mx-auto max-w-3xl text-center"
            {...heroMotion}
          >
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/15">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Free intro call
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ~20–30 minutes
              </span>
            </div>
            <h1
              id={headingId}
              className="mb-3 text-balance text-3xl font-bold tracking-tight text-foreground fold:text-[1.65rem] fold:leading-tight sm:text-4xl md:text-5xl"
            >
              <span className="cta-gradient-text cta-gradient-text-shimmer">
                Let&apos;s map your next move
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Tell us what you&apos;re building. We&apos;ll follow up with scheduling and
              a clear sense of whether Brand Growth is the right fit—no pressure.
            </p>
          </motion.header>

          <div className="grid grid-cols-1 gap-3 xs:grid-cols-3 sm:gap-4">
            <a
              href={`tel:${COMPANY_PHONE_E164}`}
              className={cn(
                "group flex min-h-[52px] min-w-0 flex-col justify-center rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-theme",
                "hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Call
              </span>
              <span className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {COMPANY_PHONE_DISPLAY}
              </span>
            </a>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex min-h-[52px] min-w-0 flex-col justify-center rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-theme",
                "hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Studio
              </span>
              <span className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {COMPANY_ADDRESS.city}, {COMPANY_ADDRESS.region}
              </span>
            </a>
            <div
              className="flex min-h-[52px] min-w-0 flex-col justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 shadow-sm dark:from-primary/15"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                Response
              </span>
              <span className="mt-1 text-sm font-semibold text-foreground">
                Typically 1–2 business days
              </span>
            </div>
          </div>

          <section
            className="rounded-2xl border border-border/70 bg-card/40 p-4 shadow-inner backdrop-blur-md dark:bg-card/30 sm:p-5"
            aria-labelledby="contact-topics-heading"
          >
            <h2
              id="contact-topics-heading"
              className="mb-3 text-center text-sm font-semibold text-foreground sm:text-left"
            >
              What should we focus on first?
            </h2>
            <p className="mb-4 text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
              Tap a topic—we&apos;ll prefill your primary goal. Edit freely before you send.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {TOPIC_PRESETS.map((preset) => {
                const selected = activeTopic === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyTopic(preset)}
                    className={cn(
                      "min-h-[44px] rounded-full border px-3.5 py-2 text-left text-sm font-medium transition-theme touch-manipulation",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border bg-background/80 text-foreground hover:border-primary/40 hover:bg-accent/50",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="min-w-0 space-y-5">
              <Card className="overflow-hidden border-border/80 bg-card/95 shadow-lg backdrop-blur-sm dark:border-border">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="mb-1 text-xl font-semibold text-foreground">
                    Get the most from your call
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Expand any row for a quick tip—interactive checklist, no extra noise.
                  </p>
                  <Accordion type="single" collapsible className="w-full min-w-0">
                    {PREP_ITEMS.map((item) => (
                      <AccordionItem key={item.value} value={item.value} className="border-border/80">
                        <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline sm:text-base">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {item.body}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <div className="mt-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 dark:bg-primary/10">
                    <p className="text-sm font-medium text-foreground">
                      Want diagnostic clarity first?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      The free audit delivers structured recommendations you can implement—or bring to this call.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 min-h-[44px] w-full border-primary/35 hover:bg-primary/10"
                    >
                      <Link href="/digital-growth-audit">
                        Get your free audit
                        <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0 lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+7rem)]">
              <StrategyCallForm
                cardClassName="overflow-hidden border-primary/25 bg-card/95 shadow-xl ring-1 ring-primary/10 backdrop-blur-md dark:border-primary/30 dark:ring-primary/15"
                goalInjection={injection}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
