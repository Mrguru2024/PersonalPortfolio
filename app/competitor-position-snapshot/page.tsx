"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageSEO } from "@/components/SEO";
import { toast } from "@/hooks/use-toast";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  businessName: z.string().min(1, "Business name is required"),
  websiteUrl: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  city: z.string().min(1, "City or market is required"),
  mainService: z.string().min(1, "Main service is required"),
  competitor1: z.string().optional(),
  competitor2: z.string().optional(),
  competitor3: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SNAPSHOT_SECTIONS = [
  {
    title: "Brand position clarity",
    questions: [
      "Does your business appear clearly positioned?",
      "Is your core service obvious?",
      "Does your messaging feel specific or generic?",
    ],
  },
  {
    title: "Visual trust impression",
    questions: [
      "Does your site appear credible?",
      "Does the design feel current or dated?",
      "Is the presentation likely to build confidence?",
    ],
  },
  {
    title: "Website conversion readiness",
    questions: [
      "Is there a clear CTA?",
      "Is there a strong lead path?",
      "Is the site likely helping or hurting conversions?",
    ],
  },
  {
    title: "Market opportunity questions",
    questions: [
      "What likely makes competitors easier to choose?",
      "Where may your business be blending in?",
      "What should you improve first?",
    ],
  },
];

export default function CompetitorPositionSnapshotPage() {
  const [submitted, setSubmitted] = useState(false);
  const { track, getAttributionSnapshot } = useVisitorTracking();
  const formStartedRef = useRef(false);

  useEffect(() => {
    track("page_view", { pageVisited: "/competitor-position-snapshot" });
  }, [track]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      websiteUrl: "",
      industry: "",
      city: "",
      mainService: "",
      competitor1: "",
      competitor2: "",
      competitor3: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const attribution = getAttributionSnapshot();
      const res = await fetch("/api/competitor-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...attribution.current,
          first_touch: attribution.firstTouch,
          last_touch: attribution.lastTouch,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      track("form_completed", { pageVisited: "/competitor-position-snapshot", metadata: { form: "competitor_snapshot" } });
      setSubmitted(true);
      toast({
        title: "Snapshot request received",
        description: "We'll use your details to prepare a structured review and send it to you.",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Submission failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <PageSEO
        title="Competitor position snapshot | Free growth tool"
        description="Get a structured snapshot of how your online presence compares to competitors. Guided strategic review—brand clarity, visual trust, conversion readiness."
        canonicalPath="/competitor-position-snapshot"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                See how your business may be showing up compared to competitors.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                This snapshot helps identify how clearly your business is positioned online and where competitors may be gaining an advantage. It's a strategic review—not automated competitor scraping—covering brand clarity, presentation quality, website trust signals, and conversion readiness.
              </p>
              <div className="relative w-full max-w-3xl mx-auto aspect-[21/9] sm:aspect-[2/1] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mt-8">
                <Image
                  src="/stock images/Diversity_17.jpeg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-transparent" aria-hidden />
              </div>
            </section>

            {!submitted ? (
              <Card className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((values) => mutate(values))}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Full name"
                                  {...field}
                                  onFocus={() => {
                                    if (!formStartedRef.current) {
                                      formStartedRef.current = true;
                                      track("form_started", { pageVisited: "/competitor-position-snapshot", metadata: { form: "competitor_snapshot" } });
                                    }
                                  }}
                                />
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
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@business.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Company or business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL</FormLabel>
                            <FormControl>
                              <Input type="url" placeholder="https://yoursite.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Legal, Healthcare" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City / market *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Atlanta, Southeast" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="mainService"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Main service you want to be known for *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Family law, HVAC repair" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <FormLabel>Competitors (names or URLs, optional)</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="competitor1"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Competitor 1" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="competitor2"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Competitor 2" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="competitor3"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Competitor 3" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full sm:w-auto min-h-[44px]" disabled={isPending}>
                        {isPending ? "Submitting..." : "Get my snapshot"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-border bg-card">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-6">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          What your snapshot will cover
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          We'll use your details to prepare a structured competitor position snapshot. It reviews the areas below so you can see where you stand and what to improve first.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {SNAPSHOT_SECTIONS.map((section) => (
                        <div key={section.title}>
                          <h3 className="font-semibold text-foreground text-sm mb-2">
                            {section.title}
                          </h3>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {section.questions.map((q) => (
                              <li key={q}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    This is a guided strategic review based on the information you provide, not a guaranteed ranking or third-party analytics report. We use it to give you a clear, honest view of how your business may be showing up relative to others in your space.
                  </p>
                </div>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Next steps</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild size="lg" className="gap-2 min-h-[48px]">
                      <Link href="/digital-growth-audit">
                        Request Full Digital Growth Audit
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="min-h-[48px]">
                      <Link href="/services">See recommended growth system</Link>
                    </Button>
                  </div>
                </section>

                <RecommendedNextStep
                  offerSlug="brand-website"
                  ctaText="Request Full Digital Growth Audit"
                  ctaHref="/digital-growth-audit"
                  secondaryCtaText="See growth systems"
                  secondaryCtaHref="/services"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
