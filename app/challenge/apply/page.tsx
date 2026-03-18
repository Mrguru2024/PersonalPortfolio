"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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

const applySchema = z.object({
  mainGoal: z.string().min(1, "Please describe your main business goal"),
  websiteStatus: z.string().min(1, "Select current website status"),
  leadGenProblem: z.string().min(1, "What's your biggest lead generation problem?"),
  budgetRange: z.string().min(1, "Select budget range"),
  timeline: z.string().min(1, "Select timeline"),
  implementationInterest: z.string().min(1, "Select interest in implementation support"),
  notes: z.string().optional(),
});

type ApplyFormData = z.infer<typeof applySchema>;

const BUDGET_OPTIONS = [
  { value: "exploring", label: "Still exploring" },
  { value: "2k-5k", label: "$2k – $5k" },
  { value: "5k-10k", label: "$5k – $10k" },
  { value: "10k-25k", label: "$10k – $25k" },
  { value: "25k+", label: "$25k+" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "1–3 months" },
  { value: "3-6months", label: "3–6 months" },
  { value: "6months+", label: "6+ months" },
];

const WEBSITE_STATUS_OPTIONS = [
  { value: "none", label: "No website yet" },
  { value: "basic", label: "Basic / outdated" },
  { value: "good", label: "Good but not converting" },
  { value: "redesign", label: "Considering redesign" },
];

const INTEREST_OPTIONS = [
  { value: "yes_soon", label: "Yes, I want to discuss soon" },
  { value: "yes_later", label: "Yes, but not yet" },
  { value: "maybe", label: "Maybe, depending on fit" },
  { value: "no", label: "No, just the challenge for now" },
];

export default function ChallengeApplyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      mainGoal: "",
      websiteStatus: "",
      leadGenProblem: "",
      budgetRange: "",
      timeline: "",
      implementationInterest: "",
      notes: "",
    },
  });

  const budgetRange = watch("budgetRange");
  const timeline = watch("timeline");
  const websiteStatus = watch("websiteStatus");
  const implementationInterest = watch("implementationInterest");

  const onSubmit = async (data: ApplyFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, registrationId: registrationId ? Number(registrationId) : undefined }),
      });
      if (!res.ok) throw new Error("Submit failed");
      router.push("/challenge/thank-you");
    } catch {
      // show error
    } finally {
      setSubmitting(false);
    }
  };

  if (!registrationId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center mb-4">Open the apply form from your challenge dashboard.</p>
              <Button asChild className="w-full">
                <Link href="/challenge/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={registrationId ? `/challenge/dashboard?registrationId=${registrationId}` : "/challenge/dashboard"} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-foreground">Apply for a strategy call</h1>
            <p className="text-muted-foreground">Help us understand your goals so we can match you with the right next step.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainGoal">Main business goal *</Label>
                <Textarea id="mainGoal" {...register("mainGoal")} rows={3} placeholder="What do you want to achieve in the next 6–12 months?" />
                {errors.mainGoal && <p className="text-sm text-destructive">{errors.mainGoal.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Current website status *</Label>
                <Select value={websiteStatus} onValueChange={(v) => setValue("websiteStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {WEBSITE_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.websiteStatus && <p className="text-sm text-destructive">{errors.websiteStatus.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadGenProblem">Biggest lead generation problem *</Label>
                <Textarea id="leadGenProblem" {...register("leadGenProblem")} rows={2} placeholder="What's blocking you from getting more clients?" />
                {errors.leadGenProblem && <p className="text-sm text-destructive">{errors.leadGenProblem.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Budget range *</Label>
                <Select value={budgetRange} onValueChange={(v) => setValue("budgetRange", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.budgetRange && <p className="text-sm text-destructive">{errors.budgetRange.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Timeline *</Label>
                <Select value={timeline} onValueChange={(v) => setValue("timeline", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {TIMELINE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timeline && <p className="text-sm text-destructive">{errors.timeline.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Interest in implementation support *</Label>
                <Select value={implementationInterest} onValueChange={(v) => setValue("implementationInterest", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INTEREST_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.implementationInterest && <p className="text-sm text-destructive">{errors.implementationInterest.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional notes</Label>
                <Textarea id="notes" {...register("notes")} rows={2} placeholder="Anything else we should know?" />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
