"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, ArrowRight, Search } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { toast } from "@/hooks/use-toast";

const auditFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Valid email is required"),
  websiteUrl: z.string().optional(),
  industry: z.string().min(1, "Please select your industry"),
  revenueRange: z.string().min(1, "Please select revenue range"),
  mainChallenge: z.string().min(10, "Please describe your main challenge in a few words"),
  timeline: z.string().min(1, "Please select your timeline"),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

const INDUSTRY_OPTIONS = [
  { value: "electrician", label: "Electrician" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "locksmith", label: "Locksmith" },
  { value: "security", label: "Security installer" },
  { value: "roofing", label: "Roofing" },
  { value: "other-trades", label: "Other trades / local service" },
];

const REVENUE_OPTIONS = [
  { value: "under-10k", label: "Under $10k/month" },
  { value: "10k-25k", label: "$10k – $25k/month" },
  { value: "25k-50k", label: "$25k – $50k/month" },
  { value: "50k-100k", label: "$50k – $100k/month" },
  { value: "100k-plus", label: "$100k+/month" },
  { value: "prefer-not", label: "Prefer not to say" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-2-weeks", label: "Within 1–2 weeks" },
  { value: "1-month", label: "Within a month" },
  { value: "2-3-months", label: "2–3 months" },
  { value: "exploring", label: "Just exploring for now" },
];

export default function AuditPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      businessName: "",
      name: "",
      email: "",
      websiteUrl: "",
      industry: "",
      revenueRange: "",
      mainChallenge: "",
      timeline: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AuditFormData) => {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: data.businessName,
          name: data.name,
          email: data.email,
          websiteUrl: data.websiteUrl || undefined,
          industry: data.industry,
          revenueRange: data.revenueRange,
          mainChallenge: data.mainChallenge,
          timeline: data.timeline,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Request received",
        description: "We'll review your site and get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AuditFormData) => mutate(data);

  return (
    <>
      <PageSEO
        title="Free Website Growth Audit | Ascendra Technologies"
        description="Get a free review of your website's performance, conversion gaps, and lead generation potential. For contractors and trades businesses."
        keywords={["website audit", "lead generation", "contractor website", "conversion"]}
        canonicalPath="/audit"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10 py-10 xs:py-12 sm:py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)] pointer-events-none" aria-hidden />
        <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-xl">
          {submitted ? (
            <Card className="border-border bg-card shadow-lg overflow-hidden">
              <CardHeader className="text-center px-4 sm:px-6 md:px-8 pb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary mx-auto mb-3 sm:mb-4 shrink-0">
                  <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="text-center text-xl sm:text-2xl">You're all set</CardTitle>
                <CardDescription className="text-center text-sm sm:text-base max-w-md mx-auto">
                  We've received your request. We'll review your website and send you feedback and next steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6 md:px-8 pt-0">
                <p className="text-sm text-muted-foreground text-center">
                  Next step: book a short strategy call so we can walk through the audit and options.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                  <Button asChild size="lg" className="gap-2 w-full sm:w-auto min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href="/#contact">
                      Book a Strategy Call
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px] text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                    <Link href="/contractor-systems">Back to contractor systems</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary mb-3 sm:mb-4 shrink-0">
                  <Search className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h1 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Get Your Free Website Growth Audit
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-2">
                  We'll review your current website, identify conversion gaps, and show you where you may be losing leads online.
                </p>
                <p className="text-xs text-muted-foreground/90">Free · No obligation · Results in 24–48 hours</p>
              </div>

              <Card className="border-border bg-card shadow-md overflow-hidden">
                <CardHeader className="px-4 sm:px-6 md:px-8">
                  <CardTitle className="text-lg sm:text-xl">Request your audit</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    A few details so we can tailor the review. No obligation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 md:px-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company or business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
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
                      </div>
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://yourwebsite.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INDUSTRY_OPTIONS.map((opt) => (
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
                        name="revenueRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly revenue range *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {REVENUE_OPTIONS.map((opt) => (
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
                        name="mainChallenge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Main challenge *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Not getting enough leads from our website, or our site doesn't work well on mobile"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
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
                                  <SelectValue placeholder="When do you want to start?" />
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
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2 min-h-[44px] sm:min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md"
                        disabled={isPending}
                      >
                        {isPending ? "Submitting…" : "Get My Free Audit"}
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">We'll review your site and respond within 24–48 hours.</p>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground mt-6 px-2">
                <Link href="/contractor-systems" className="underline hover:text-foreground">
                  Learn more about contractor & trades systems
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
