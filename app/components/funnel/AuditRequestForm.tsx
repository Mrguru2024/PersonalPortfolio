"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
  HELP_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/funnel-content";

const auditRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  websiteUrl: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  currentChallenge: z.string().min(1, "Select a challenge"),
  businessStage: z.string().min(1, "Select your current stage"),
  helpNeeded: z.array(z.string()).min(1, "Select at least one area"),
  budgetRange: z.string().min(1, "Select a budget range"),
  timeline: z.string().min(1, "Select a timeline"),
  notes: z.string().optional(),
});

type AuditRequestValues = z.infer<typeof auditRequestSchema>;

export function AuditRequestForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AuditRequestValues>({
    resolver: zodResolver(auditRequestSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      websiteUrl: "",
      industry: "",
      currentChallenge: "",
      businessStage: "",
      helpNeeded: [],
      budgetRange: "",
      timeline: "",
      notes: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AuditRequestValues) => {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          revenueRange: values.budgetRange,
          mainChallenge: values.currentChallenge,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Failed to submit audit request");
      }

      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Audit request received",
        description:
          "Thanks for the details. We will review your request and share your next steps shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <Card className="border-border bg-card funnel-card">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Thanks, your audit request is in.
          </h3>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            We will review your information across strategy, design, and
            technology criteria, then send recommended next steps.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="min-h-[44px]">
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/services">Review Service Options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card funnel-card">
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
                      <Input placeholder="Your full name" {...field} />
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
                      <Input placeholder="Company or business name" {...field} />
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
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourwebsite.com"
                        type="url"
                        {...field}
                      />
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
                  <FormLabel>Industry *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. local services, healthcare, retail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentChallenge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current challenge *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select challenge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHALLENGE_OPTIONS.map((challenge) => (
                          <SelectItem key={challenge} value={challenge}>
                            {challenge}
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
                        {STAGE_OPTIONS.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
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
              name="helpNeeded"
              render={() => (
                <FormItem>
                  <FormLabel>What do you need help with? *</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-border p-3">
                    {HELP_OPTIONS.map((option) => (
                      <FormField
                        key={option}
                        control={form.control}
                        name="helpNeeded"
                        render={({ field }) => {
                          const selected = field.value?.includes(option);
                          return (
                            <FormItem className="flex items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), option]);
                                    } else {
                                      field.onChange(
                                        (field.value || []).filter((value) => value !== option)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal leading-tight">
                                {option}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget range *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((budget) => (
                          <SelectItem key={budget} value={budget}>
                            {budget}
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Add context we should know before we review your request."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full min-h-[44px]" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Audit Request"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
