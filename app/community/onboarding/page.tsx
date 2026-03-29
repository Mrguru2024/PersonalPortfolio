"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FOUNDER_TYPES,
  BUSINESS_STAGES,
  PROFILE_VISIBILITY,
  MESSAGE_PERMISSION,
  COMMUNICATION_STYLES,
  MENTORSHIP_INTERESTS,
} from "@/lib/community/constants";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Who you are", description: "How do you describe yourself?" },
  { id: 2, title: "Stage & industry", description: "Where you're at" },
  { id: 3, title: "What you're building", description: "Goals and challenges" },
  { id: 4, title: "Collaboration & privacy", description: "How you want to connect" },
  { id: 5, title: "You're in", description: "Welcome to the network" },
];

export default function CommunityOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, unknown>>({
    founderType: "",
    businessStage: "",
    industry: "",
    whatBuilding: "",
    biggestChallenge: "",
    goals: "",
    lookingFor: "",
    whatYouOffer: "",
    communicationStyle: "unspecified",
    mentorshipInterest: "none",
    skillSlugs: [] as string[],
    goalSlugs: [] as string[],
    openToCollaborate: false,
    profileVisibility: "public",
    messagePermission: "none",
  });

  const { data: tagVocab } = useQuery({
    queryKey: ["/api/community/tags"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/tags");
      if (!res.ok) return null;
      return res.json() as Promise<{
        skills: { slug: string; label: string }[];
        goals: { slug: string; label: string }[];
      }>;
    },
    enabled: !!user,
  });

  const toggleSlug = (key: "skillSlugs" | "goalSlugs", slug: string, max: number) => {
    setForm((f) => {
      const cur = [...((f[key] as string[]) ?? [])];
      const i = cur.indexOf(slug);
      if (i >= 0) cur.splice(i, 1);
      else if (cur.length < max) cur.push(slug);
      return { ...f, [key]: cur };
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?redirect=/community/onboarding");
    }
  }, [user, authLoading, router]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/community/onboarding", {
        ...form,
        fullName: user?.full_name ?? user?.username,
        username: user?.username,
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      setStep(5);
      toast({ title: "Welcome to the Founder Network" });
    },
    onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
  });

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
    else submitMutation.mutate();
  };

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {STEPS.slice(0, 4).map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full",
                step >= s.id ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold">{STEPS[step - 1].title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{STEPS[step - 1].description}</p>
      </div>

      <Card className="border-border/50">
        <CardHeader />
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">What best describes you?</p>
              <RadioGroup
                value={String(form.founderType)}
                onValueChange={(v) => setForm((f) => ({ ...f, founderType: v }))}
                className="grid gap-2"
              >
                {FOUNDER_TYPES.map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <RadioGroupItem value={t} id={t} />
                    <Label htmlFor={t} className="font-normal capitalize">
                      {t.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Business stage</Label>
                <select
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.businessStage)}
                  onChange={(e) => setForm((f) => ({ ...f, businessStage: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {BUSINESS_STAGES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Industry (optional)</Label>
                <Input
                  placeholder="e.g. SaaS, e-commerce, services"
                  value={String(form.industry ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>What are you building? (optional)</Label>
                <Textarea
                  placeholder="Your product, service, or focus"
                  value={String(form.whatBuilding ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, whatBuilding: e.target.value }))}
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <div>
                <Label>Biggest current challenge (optional)</Label>
                <Textarea
                  placeholder="e.g. getting first clients, scaling marketing"
                  value={String(form.biggestChallenge ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, biggestChallenge: e.target.value }))}
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <div>
                <Label>Main goals (optional)</Label>
                <Textarea
                  placeholder="What you want to achieve"
                  value={String(form.goals ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <div>
                <Label>Who you want to meet (optional)</Label>
                <Textarea
                  placeholder="Roles, backgrounds, or founder types"
                  value={String(form.lookingFor ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, lookingFor: e.target.value }))}
                  className="mt-2 min-h-[72px]"
                />
              </div>
              <div>
                <Label>What you can offer (optional)</Label>
                <Textarea
                  placeholder="Skills, intros, or help you can give"
                  value={String(form.whatYouOffer ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, whatYouOffer: e.target.value }))}
                  className="mt-2 min-h-[72px]"
                />
              </div>
              <div>
                <Label>Interaction style</Label>
                <select
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.communicationStyle ?? "unspecified")}
                  onChange={(e) => setForm((f) => ({ ...f, communicationStyle: e.target.value }))}
                >
                  {COMMUNICATION_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Mentorship interest</Label>
                <select
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.mentorshipInterest ?? "none")}
                  onChange={(e) => setForm((f) => ({ ...f, mentorshipInterest: e.target.value }))}
                >
                  {MENTORSHIP_INTERESTS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              {tagVocab && (
                <>
                  <div>
                    <Label>Skill tags (up to 5)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tagVocab.skills?.map((t) => {
                        const active = ((form.skillSlugs as string[]) ?? []).includes(t.slug);
                        return (
                          <button
                            key={t.slug}
                            type="button"
                            onClick={() => toggleSlug("skillSlugs", t.slug, 5)}
                            className={`rounded-full border px-2.5 py-1 text-xs transition ${
                              active
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border/80 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Goal tags (up to 5)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tagVocab.goals?.map((t) => {
                        const active = ((form.goalSlugs as string[]) ?? []).includes(t.slug);
                        return (
                          <button
                            key={t.slug}
                            type="button"
                            onClick={() => toggleSlug("goalSlugs", t.slug, 5)}
                            className={`rounded-full border px-2.5 py-1 text-xs transition ${
                              active
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border/80 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="openToCollaborate"
                  checked={Boolean(form.openToCollaborate)}
                  onChange={(e) => setForm((f) => ({ ...f, openToCollaborate: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="openToCollaborate">I'm open to collaboration opportunities</Label>
              </div>
              <div>
                <Label>Profile visibility</Label>
                <RadioGroup
                  value={String(form.profileVisibility)}
                  onValueChange={(v) => setForm((f) => ({ ...f, profileVisibility: v }))}
                  className="mt-2 gap-2"
                >
                  {PROFILE_VISIBILITY.map((v) => (
                    <div key={v} className="flex items-center space-x-2">
                      <RadioGroupItem value={v} id={`vis-${v}`} />
                      <Label htmlFor={`vis-${v}`} className="font-normal capitalize">{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Who can message you</Label>
                <RadioGroup
                  value={String(form.messagePermission)}
                  onValueChange={(v) => setForm((f) => ({ ...f, messagePermission: v }))}
                  className="mt-2 gap-2"
                >
                  {MESSAGE_PERMISSION.map((v) => (
                    <div key={v} className="flex items-center space-x-2">
                      <RadioGroupItem value={v} id={`msg-${v}`} />
                      <Label htmlFor={`msg-${v}`} className="font-normal">
                        {v === "none" ? "No one" : v === "collab_only" ? "Only when I'm open to collaborate" : "Anyone"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold">You're in</h2>
              <p className="text-muted-foreground mt-2">
                Your profile is set up. Explore the feed, find collaborators, and join the conversation.
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link href="/community/home">Open your AFN home <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}

          {step < 5 && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={submitMutation.isPending} className="gap-2">
                {step === 4 ? "Finish" : "Next"}
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
