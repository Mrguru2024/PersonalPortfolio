"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  AGE_RANGE_OPTIONS,
  BUDGET_OPTIONS_WITH_FLEXIBLE,
  COMPANY_SIZE_OPTIONS,
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/funnel-content";
import { useExperimentVariant } from "@/lib/experiments/useExperimentVariant";

const strategyCallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[\d\s\-+()]{10,}$/.test(v), "Enter a valid phone number"),
  websiteUrl: z.string().optional(),
  primaryGoal: z.string().min(8, "Add a little detail so we can prepare"),
  budgetRange: z.string().optional(),
  timeline: z.string().min(1, "Select a timeline"),
  notes: z.string().optional(),
  ageRange: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  companySize: z.string().optional(),
});

type StrategyCallValues = z.infer<typeof strategyCallSchema>;

export function StrategyCallForm() {
  const [submitted, setSubmitted] = useState(false);
  const { track, getAttributionSnapshot } = useVisitorTracking();
  const pathname = usePathname();
  const pageVisited = pathname || "/contact";
  const formStartedRef = useRef(false);
  const submitExperiment = useExperimentVariant("strategy_call_submit_cta_v1", {
    pageVisited,
  });
  const submitCtaByVariant: Record<string, string> = {
    control: "Book my free call",
    book_now: "Book my strategy call now",
    get_plan: "Get my custom call plan",
  };

  const form = useForm<StrategyCallValues>({
    resolver: zodResolver(strategyCallSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      phone: "",
      websiteUrl: "",
      primaryGoal: "",
      budgetRange: "",
      timeline: "",
      notes: "",
      ageRange: "",
      gender: "",
      occupation: "",
      companySize: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: StrategyCallValues) => {
      const attribution = getAttributionSnapshot();
      const message = [
        `Primary goal: ${values.primaryGoal}`,
        values.websiteUrl ? `Website: ${values.websiteUrl}` : "",
        values.budgetRange ? `Budget range: ${values.budgetRange}` : "",
        values.notes ? `Notes: ${values.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          company: values.businessName,
          projectType: "Strategy Call",
          budget: values.budgetRange || "Not specified",
          timeframe: values.timeline,
          message,
          newsletter: false,
          ageRange: values.ageRange || undefined,
          gender: values.gender || undefined,
          occupation: values.occupation || undefined,
          companySize: values.companySize || undefined,
          ...attribution.current,
          first_touch: attribution.firstTouch,
          last_touch: attribution.lastTouch,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Failed to submit strategy call request");
      }

      return res.json();
    },
    onSuccess: () => {
      track("form_completed", {
        pageVisited,
        metadata: {
          form: "strategy_call",
          experiment_key: submitExperiment.definition.key,
          experiment_variant: submitExperiment.variant,
        },
      });
      submitExperiment.trackConversion("contact_strategy_call_form_completed");
      setSubmitted(true);
      toast({
        title: "Request received",
        description:
          "Thanks. We will review your details and send next-step scheduling guidance.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to submit",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Strategy call request submitted.
          </h3>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            We will review your context, then reach out with the best next-step
            call flow for your stage.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/digital-growth-audit">Prefer a full audit first?</Link>
            </Button>
            <Button asChild className="min-h-[44px]">
              <Link href="/services">Review service options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 sm:p-6">
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
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                        onFocus={() => {
                          if (!formStartedRef.current) {
                            formStartedRef.current = true;
                            track("form_started", { pageVisited, metadata: { form: "strategy_call" } });
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
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="Best number to reach you"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget range (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select if known" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_OPTIONS_WITH_FLEXIBLE.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
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
              name="primaryGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary goal *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What should this strategy call solve first?"
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
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((timeline) => (
                        <SelectItem key={timeline} value={timeline}>
                          {timeline}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Anything else to share?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Optional — help us personalize</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Age range</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AGE_RANGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Role / occupation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OCCUPATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Company size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_SIZE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
              {isPending ? "Submitting..." : (submitCtaByVariant[submitExperiment.variant] ?? submitCtaByVariant.control)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
