"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList, Loader2 } from "lucide-react";
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
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/lib/growth-diagnosis/constants";
import { TIMELINE_OPTIONS } from "@/lib/funnel-content";

const STORAGE_DONE = "fgt_qualified_lead_done";
const STORAGE_SKIP = "fgt_qualified_lead_skip";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  company: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  primaryGoal: z.string().trim().min(1, "Choose a goal"),
  timeline: z.string().trim().min(1, "Choose a timeline"),
  toolsFocus: z.string().trim().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function FreeToolsQualifiedLeadCard() {
  const [mode, setMode] = useState<"form" | "done" | "skipped">("form");
  const { getVisitorId } = useVisitorTracking();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_DONE) === "1") setMode("done");
      else if (sessionStorage.getItem(STORAGE_SKIP) === "1") setMode("skipped");
    } catch {
      /* ignore */
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      websiteUrl: "",
      businessType: "",
      primaryGoal: "",
      timeline: "",
      toolsFocus: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const res = await fetch("/api/free-growth-tools/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          company: values.company || undefined,
          websiteUrl: values.websiteUrl || undefined,
          businessType: values.businessType || undefined,
          primaryGoal: values.primaryGoal,
          timeline: values.timeline,
          toolsFocus: values.toolsFocus || undefined,
          visitorId: getVisitorId() || undefined,
          utm_source: params?.get("utm_source") ?? undefined,
          utm_medium: params?.get("utm_medium") ?? undefined,
          utm_campaign: params?.get("utm_campaign") ?? undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          landing_page:
            typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/free-growth-tools",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.message === "string" ? json.message : "Submission failed");
      }
    },
    onSuccess: () => {
      try {
        sessionStorage.setItem(STORAGE_DONE, "1");
      } catch {
        /* ignore */
      }
      setMode("done");
      toast({
        title: "Thanks — you're set",
        description: "We’ll use this to qualify follow-up in CRM. Explore the tools below.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Couldn’t save",
        description: err.message || "Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleSkip = () => {
    try {
      sessionStorage.setItem(STORAGE_SKIP, "1");
    } catch {
      /* ignore */
    }
    setMode("skipped");
  };

  const reopenForm = () => {
    try {
      sessionStorage.removeItem(STORAGE_SKIP);
    } catch {
      /* ignore */
    }
    setMode("form");
  };

  if (mode === "done") {
    return (
      <Card className="border-primary/25 bg-primary/5 dark:bg-primary/10">
        <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ClipboardList className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h2 className="text-base font-semibold text-foreground">Profile saved for this session</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your answers are in our CRM so we can prioritize the right follow-up. Use any tool below—results
              are best when we already know your goal and timeline.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "skipped") {
    return (
      <div className="rounded-xl border border-border bg-section/50 dark:bg-section/25 px-4 py-3 text-sm text-muted-foreground text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span>
          You’re browsing without a saved profile—fine for exploring. Sharing details first helps us send
          qualified, relevant follow-up from CRM.
        </span>
        <Button type="button" variant="outline" size="sm" className="shrink-0 min-h-10" onClick={reopenForm}>
          Share details for CRM
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardContent className="p-5 sm:p-8">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Start with a short qualification</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto sm:mx-0">
            We focus these free tools on <span className="text-foreground font-medium">qualified CRM leads</span>
            —so share a few details first. You get faster, more relevant follow-up; we route you to the right tool
            and teammate.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 max-w-xl mx-auto sm:max-w-none"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Your name" {...field} />
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
                    <FormLabel>Work email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="you@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Business name" {...field} />
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
                    <FormLabel>Website (optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business type (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name="primaryGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary goal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="What do you want most?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIMARY_GOALS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
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
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeline to improve</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="When do you want momentum?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            <FormField
              control={form.control}
              name="toolsFocus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tools you care about (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. diagnosis first, revenue calculator, competitor snapshot…"
                      rows={3}
                      className="resize-y min-h-[88px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
              <Button
                type="submit"
                className="min-h-[48px] w-full sm:w-auto gap-2"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save & unlock tools"
                )}
              </Button>
              <Button type="button" variant="ghost" className="min-h-[48px] text-muted-foreground" onClick={handleSkip}>
                Continue without sharing — I’ll explore first
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              By submitting, you agree we may contact you about Ascendra services. See{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy
              </Link>
              .
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
