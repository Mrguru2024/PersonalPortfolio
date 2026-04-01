"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFunnel } from "@/lib/funnel-store";
import { funnelThankYouUrl } from "@/lib/funnelThankYou";

const applySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  businessName: z.string().min(1, "Business name is required"),
  website: z.string().optional(),
  monthlyRevenue: z.string().min(1, "Select monthly revenue"),
  mainChallenge: z.string().min(1, "Please describe your main challenge"),
  timeline: z.string().min(1, "Select timeline"),
  budgetRange: z.string().min(1, "Select budget range"),
});

type ApplyFormData = z.infer<typeof applySchema>;

const MONTHLY_REVENUE_OPTIONS = [
  { value: "pre-revenue", label: "Pre-revenue / side project" },
  { value: "0-10k", label: "$0 – $10k" },
  { value: "10k-50k", label: "$10k – $50k" },
  { value: "50k-100k", label: "$50k – $100k" },
  { value: "100k-500k", label: "$100k – $500k" },
  { value: "500k+", label: "$500k+" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "Within 1–3 months" },
  { value: "3-6months", label: "Within 3–6 months" },
  { value: "6months+", label: "6+ months / just exploring" },
];

const BUDGET_OPTIONS = [
  { value: "exploring", label: "Still exploring" },
  { value: "2k-5k", label: "$2k – $5k" },
  { value: "5k-10k", label: "$5k – $10k" },
  { value: "10k-25k", label: "$10k – $25k" },
  { value: "25k+", label: "$25k+" },
];

export default function ApplyPage() {
  const router = useRouter();
  const { scores, answers } = useFunnel();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      website: "",
      monthlyRevenue: "",
      mainChallenge: "",
      timeline: "",
      budgetRange: "",
    },
  });

  const monthlyRevenue = watch("monthlyRevenue");
  const timeline = watch("timeline");
  const budgetRange = watch("budgetRange");

  useEffect(() => {
    if (monthlyRevenue) setValue("monthlyRevenue", monthlyRevenue);
  }, [monthlyRevenue, setValue]);
  useEffect(() => {
    if (timeline) setValue("timeline", timeline);
  }, [timeline, setValue]);
  useEffect(() => {
    if (budgetRange) setValue("budgetRange", budgetRange);
  }, [budgetRange, setValue]);

  useEffect(() => {
    if (!scores && Object.keys(answers).length === 0) {
      router.replace("/diagnosis");
    }
  }, [scores, answers, router]);

  const onSubmit = async (data: ApplyFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/funnel/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          scores,
          form: data,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(funnelThankYouUrl("growth_plan_apply"));
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (!scores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-section to-background">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-6">
          <Link href="/diagnosis/results" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to your growth score
          </Link>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-foreground">Get your growth plan</h1>
            <p className="text-muted-foreground">
              Share a few details so we can tailor next steps and follow up with your results.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} placeholder="Your name" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@company.com" />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business name *</Label>
                <Input id="businessName" {...register("businessName")} placeholder="Company or brand" />
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label>Monthly revenue *</Label>
                <Select value={monthlyRevenue} onValueChange={(v) => setValue("monthlyRevenue", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHLY_REVENUE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.monthlyRevenue && (
                  <p className="text-sm text-destructive">{errors.monthlyRevenue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainChallenge">Main challenge *</Label>
                <Textarea
                  id="mainChallenge"
                  {...register("mainChallenge")}
                  placeholder="What's the biggest growth or conversion challenge you're facing?"
                  rows={4}
                />
                {errors.mainChallenge && (
                  <p className="text-sm text-destructive">{errors.mainChallenge.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Timeline *</Label>
                <Select value={timeline} onValueChange={(v) => setValue("timeline", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="When do you want to start?" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timeline && (
                  <p className="text-sm text-destructive">{errors.timeline.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Budget range *</Label>
                <Select value={budgetRange} onValueChange={(v) => setValue("budgetRange", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.budgetRange && (
                  <p className="text-sm text-destructive">{errors.budgetRange.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
