"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
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
import { funnelThankYouUrl } from "@/lib/funnelThankYou";
import { TIMELINE_OPTIONS } from "@/lib/funnel-content";

const PRIMARY_FOCUS_OPTIONS = [
  { value: "lead_prospecting", label: "Lead prospecting & outbound systems" },
  { value: "custom_crm", label: "Custom CRM / pipeline built for our business" },
  { value: "lead_conversion", label: "Lead conversion (landing pages, forms, follow-up)" },
  { value: "ad_management", label: "Paid ads management (Google, Meta, LinkedIn, etc.)" },
  { value: "full_funnel", label: "Several of the above — full funnel review" },
] as const;

const CRM_SITUATION_OPTIONS = [
  { value: "spreadsheets", label: "Spreadsheets / notes — no real CRM" },
  { value: "basic_saas", label: "Basic SaaS CRM (HubSpot, Pipedrive, etc.) — underused" },
  { value: "enterprise", label: "Enterprise CRM — needs customization or cleanup" },
  { value: "custom_partial", label: "Custom or in-house — needs rebuild or expansion" },
  { value: "unsure", label: "Not sure what we need yet" },
] as const;

const AD_PLATFORM_OPTIONS = [
  { id: "google", label: "Google Ads" },
  { id: "meta", label: "Meta (Facebook / Instagram)" },
  { id: "linkedin", label: "LinkedIn Ads" },
  { id: "other", label: "Other / programmatic" },
  { id: "none_yet", label: "Not running paid ads yet" },
] as const;

const AD_SPEND_OPTIONS = [
  { value: "prefer_not", label: "Prefer not to say" },
  { value: "under_2k", label: "Under $2k / month" },
  { value: "2k_10k", label: "$2k – $10k / month" },
  { value: "10k_50k", label: "$10k – $50k / month" },
  { value: "50k_plus", label: "$50k+ / month" },
  { value: "not_running", label: "Not spending on ads right now" },
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[\d\s\-+()]{10,}$/.test(v), "Enter a valid phone number"),
  websiteUrl: z.string().optional(),
  primaryFocus: z.string().min(1, "Select a primary focus"),
  crmSituation: z.string().min(1, "Tell us about your CRM / pipeline"),
  adPlatforms: z.array(z.string()).default([]),
  monthlyAdSpend: z.string().optional(),
  timeline: z.string().min(1, "Select a timeline"),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function labelsForPlatforms(ids: string[]): string[] {
  const map = new Map<string, string>(AD_PLATFORM_OPTIONS.map((o) => [o.id, o.label]));
  return ids.map((id) => map.get(id) ?? id);
}

export function PpcLeadMagnetForm() {
  const router = useRouter();
  const formStartedSent = useRef(false);
  const { track } = useVisitorTracking();

  const onFormInteraction = () => {
    if (!formStartedSent.current) {
      formStartedSent.current = true;
      track("form_started", { pageVisited: "/ppc-lead-system", metadata: { form: "ppc_lead_consultation" } });
    }
  };

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      phone: "",
      websiteUrl: "",
      primaryFocus: "",
      crmSituation: "",
      adPlatforms: [],
      monthlyAdSpend: "",
      timeline: "",
      notes: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: Values) => {
      const res = await fetch("/api/ppc-lead-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          businessName: values.businessName,
          email: values.email,
          phone: values.phone || undefined,
          websiteUrl: values.websiteUrl || undefined,
          primaryFocus:
            PRIMARY_FOCUS_OPTIONS.find((o) => o.value === values.primaryFocus)?.label ?? values.primaryFocus,
          crmSituation:
            CRM_SITUATION_OPTIONS.find((o) => o.value === values.crmSituation)?.label ?? values.crmSituation,
          adPlatforms: labelsForPlatforms(values.adPlatforms),
          monthlyAdSpend:
            values.monthlyAdSpend && values.monthlyAdSpend !== "prefer_not"
              ? AD_SPEND_OPTIONS.find((o) => o.value === values.monthlyAdSpend)?.label ?? values.monthlyAdSpend
              : undefined,
          timeline: values.timeline,
          notes: values.notes || undefined,
          landing_page: "/ppc-lead-system",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => {
      track("form_completed", {
        pageVisited: "/ppc-lead-system",
        metadata: { form: "ppc_lead_consultation" },
      });
      toast({
        title: "Request received",
        description: "We will review your goals and follow up with next steps.",
      });
      router.replace(funnelThankYouUrl("ppc_lead_consultation"));
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="border-border bg-card max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutate(v))}
            className="space-y-4"
            onFocus={onFormInteraction}
            onChange={onFormInteraction}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
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
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company or brand" {...field} />
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
                    <FormLabel>Work email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
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
                      <Input type="tel" placeholder="+1 …" {...field} />
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
                  <FormLabel>Website (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryFocus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you mainly looking for?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_FOCUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
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
              name="crmSituation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How do you track leads &amp; deals today?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the closest fit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CRM_SITUATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
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
              name="adPlatforms"
              render={() => (
                <FormItem>
                  <FormLabel>Ad platforms (select any that apply)</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AD_PLATFORM_OPTIONS.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="adPlatforms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) =>
                                  checked
                                    ? field.onChange([...(field.value ?? []), item.id])
                                    : field.onChange(field.value?.filter((v) => v !== item.id) ?? [])
                                }
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer">{item.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyAdSpend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approximate monthly ad spend</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AD_SPEND_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
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
                  <FormLabel>When do you want to move?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
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
                  <FormLabel>Anything else we should know? (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Goals, tools you use, team size…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto gap-2" disabled={isPending}>
              {isPending ? "Sending…" : "Request consultation"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
