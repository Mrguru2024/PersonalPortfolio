"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { funnelThankYouUrl } from "@/lib/funnelThankYou";

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

export default function CompetitorPositionSnapshotPage() {
  const router = useRouter();
  const { track } = useVisitorTracking();
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
      const res = await fetch("/api/competitor-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      track("form_completed", { pageVisited: "/competitor-position-snapshot", metadata: { form: "competitor_snapshot" } });
      toast({
        title: "Snapshot request received",
        description: "We'll use your details to prepare a structured review and send it to you.",
      });
      router.replace(funnelThankYouUrl("competitor_snapshot"));
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
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                See how your business may be showing up compared to competitors.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
                This snapshot helps identify how clearly your business is positioned online and where competitors may be gaining an advantage. It's a strategic review—not automated competitor scraping—covering brand clarity, presentation quality, website trust signals, and conversion readiness.
              </p>
              <FunnelHeroMedia
                src="/stock images/Diversity_17.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
                gradientClassName="from-background/65 via-transparent to-transparent"
              />
            </section>

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

            <RecommendedNextStep
              offerSlug="brand-website"
              ctaText="Request Full Digital Growth Audit"
              ctaHref="/digital-growth-audit"
              secondaryCtaText="See growth systems"
              secondaryCtaHref="/services"
            />

            <LeadMagnetRelatedWorkSection leadMagnetKey="competitor-snapshot" />
          </div>
        </div>
      </div>
    </>
  );
}
