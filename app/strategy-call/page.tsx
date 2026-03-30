"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BRAND_GROWTH_PATH } from "@/lib/funnelCtas";
import { funnelThankYouUrl } from "@/lib/funnelThankYou";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { WhatToExpectList, CTAReassuranceLine } from "@/components/marketing/EmbeddedAssurance";
import {
  CTA_REASSURANCE_STRATEGY_CALL,
  WHAT_TO_EXPECT_STRATEGY_FORM_ITEMS,
  WHAT_TO_EXPECT_STRATEGY_FORM_TITLE,
} from "@/lib/embeddedAssuranceCopy";

const strategyCallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  businessName: z.string().min(1, "Business name is required"),
  website: z.string().optional(),
  businessStage: z.string().min(1, "Please select your business stage"),
  mainNeed: z.string().min(1, "Please select your main need"),
  budget: z.string().min(1, "Please select a budget range"),
  timeline: z.string().min(1, "Please select your timeline"),
  projectGoals: z.string().optional(),
});

type StrategyCallFormData = z.infer<typeof strategyCallSchema>;

const BUSINESS_STAGE_OPTIONS = [
  { value: "launching", label: "Launching" },
  { value: "established", label: "Established" },
  { value: "scaling", label: "Scaling" },
];

const MAIN_NEED_OPTIONS = [
  { value: "branding", label: "Branding" },
  { value: "website", label: "Website" },
  { value: "marketing-assets", label: "Marketing assets" },
  { value: "full-ecosystem", label: "Full ecosystem support" },
];

const BUDGET_OPTIONS = [
  { value: "under-10k", label: "Under $10k" },
  { value: "10k-35k", label: "$10k – $35k" },
  { value: "35k-plus", label: "$35k+" },
];

const TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "exploring", label: "Exploring" },
];

export default function StrategyCallPage() {
  const router = useRouter();
  const { track } = useVisitorTracking();

  useEffect(() => {
    track("page_view", { pageVisited: "/strategy-call" });
  }, [track]);

  const formStartedRef = useRef(false);

  const form = useForm<StrategyCallFormData>({
    resolver: zodResolver(strategyCallSchema),
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      website: "",
      businessStage: "",
      mainNeed: "",
      budget: "",
      timeline: "",
      projectGoals: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StrategyCallFormData) => {
      const res = await fetch("/api/strategy-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          businessName: data.businessName,
          website: data.website || undefined,
          businessStage: data.businessStage,
          mainNeed: data.mainNeed,
          budget: data.budget,
          timeline: data.timeline,
          projectGoals: data.projectGoals || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      track("form_completed", { pageVisited: "/strategy-call", metadata: { form: "strategy_call" } });
      toast({
        title: "Request received",
        description: "We'll be in touch to schedule your strategy call.",
      });
      router.push(funnelThankYouUrl("strategy_call_landing"));
    },
    onError: (error: Error) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StrategyCallFormData) => mutate(data);

  return (
    <>
      <div className="w-full min-w-0 max-w-full overflow-x-hidden min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10 py-8 fold:py-10 xs:py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl overflow-x-hidden">
          <FunnelHeroMedia
            src="/stock images/Digital_18.jpeg"
            spacing="before-copy"
            maxWidth="3xl"
            sizes="(max-width: 768px) 100vw, 672px"
            gradientClassName="from-background/50 via-transparent to-transparent"
          />
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary mb-3 sm:mb-4 shrink-0">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h1 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Book a free call
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              Share a few details. We’ll reach out to schedule a call and align on your goals—no pressure, no obligation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8 min-w-0">
            <Card className="border-border bg-card/80 shadow-sm overflow-hidden min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">What This Call Is For</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground break-words min-w-0">
                A working conversation: what you&apos;re trying to move, what&apos;s already in place, and whether a
                brand/web path here is the right lever. Direct feedback—no scripted pitch.
              </CardContent>
            </Card>
            <Card className="border-border bg-card/80 shadow-sm overflow-hidden min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Who This Is Best For</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground break-words min-w-0">
                Founders and operators ready to invest in brand, site, or marketing systems—launch, rebrand, or ongoing
                assets—with one coordinated team instead of a string of handoffs.
              </CardContent>
            </Card>
          </div>

          <WhatToExpectList
            title={WHAT_TO_EXPECT_STRATEGY_FORM_TITLE}
            items={WHAT_TO_EXPECT_STRATEGY_FORM_ITEMS}
            compact
            className="max-w-xl mx-auto mb-6 sm:mb-8"
          />

          <Card className="border-border bg-card shadow-md overflow-hidden min-w-0 max-w-xl mx-auto w-full">
            <CardHeader className="px-4 sm:px-6 md:px-8">
              <CardTitle className="text-lg sm:text-xl">Book your free call</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                All fields help us prepare for the conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 md:px-8 min-w-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
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
                                track("form_started", { pageVisited: "/strategy-call", metadata: { form: "strategy_call" } });
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
                          <Input type="email" placeholder="you@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company or brand name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website or social link (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://... or profile link" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUSINESS_STAGE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="mainNeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main need *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary need" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MAIN_NEED_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUDGET_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                        <FormLabel>Timeline *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMELINE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="projectGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short project goals or what&apos;s not working (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are you trying to achieve? What's not working with your current brand, site, or marketing?"
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="gap-2 w-full sm:w-auto min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md"
                      disabled={isPending}
                    >
                      {isPending ? "Submitting…" : "Submit + Schedule Call"}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px]">
                      <Link href={BRAND_GROWTH_PATH}>Back to Brand Growth</Link>
                    </Button>
                  </div>
                  <CTAReassuranceLine dense className="text-left max-w-none pt-1">
                    {CTA_REASSURANCE_STRATEGY_CALL}
                  </CTAReassuranceLine>
                </form>
              </Form>
            </CardContent>
          </Card>

          <LeadMagnetRelatedWorkSection leadMagnetKey="strategy-call" />
        </div>
      </div>
    </>
  );
}
