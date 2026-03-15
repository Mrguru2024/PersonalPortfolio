"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ExternalLink, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FUNNEL_SLUGS, type FunnelSlug } from "@/lib/funnelContent";
import {
  STARTUP_GROWTH_KIT_PATH,
  STARTUP_WEBSITE_SCORE_PATH,
  STARTUP_ACTION_PLAN_PATH,
  STARTUP_GROWTH_SYSTEM_OFFER_PATH,
} from "@/lib/funnelCtas";

const SLUG_LINKS: Record<string, string> = {
  "growth-kit": STARTUP_GROWTH_KIT_PATH,
  "website-score": STARTUP_WEBSITE_SCORE_PATH,
  "action-plan": STARTUP_ACTION_PLAN_PATH,
  offer: STARTUP_GROWTH_SYSTEM_OFFER_PATH,
};

const SLUG_TITLES: Record<string, string> = {
  "growth-kit": "Startup growth kit",
  "website-score": "Startup website score",
  "action-plan": "Startup action plan",
  offer: "Startup growth system offer",
};

const DEFAULT_CONTENT: Record<string, Record<string, unknown>> = {
  "growth-kit": {
    heroTitle: "Where to begin when building a business online",
    heroSubtitle:
      "A practical guide for new business owners with little or no budget. Learn why most startup websites fail, what to build first, and how to grow without a full agency.",
    sectionWhyFailTitle: "Why most startup websites fail",
    sectionWhyFailBody:
      "Startups often jump straight to building a site or buying templates before clarifying who they serve and what they offer. The result: a site that looks fine but doesn't convert, or that tries to do too much and confuses visitors. The fix isn't more features—it's clarity first, then a simple structure that turns visitors into leads.",
    sectionAssetsTitle: "Assets vs systems",
    sectionAssetsBody:
      'An asset is a single deliverable: a logo, a landing page, a PDF. A system is how those pieces work together to attract, convert, and follow up. Startups often collect assets (templates, AI-generated copy, stock visuals) without a system. You need both, but the system—clear offer, one primary CTA, lead capture, and a next step—should drive what assets you create.',
    sectionAITitle: "How AI tools and templates fit in",
    sectionAIBody:
      "AI and templates can speed up execution, but they work best when you've already decided on your message, audience, and conversion path. Use them to draft copy, suggest structures, or generate ideas—then edit for clarity and consistency.",
    sectionLayersTitle: "The 4 layers of online growth",
    sectionLayersIntro: "Growth online rests on four layers. Build from the bottom up; skipping layers leads to wasted effort.",
    layer1Title: "Clarity",
    layer1Desc:
      "Your offer, audience, and message must be clear before anything else. Confusion here undermines every other layer.",
    layer2Title: "Presentation",
    layer2Desc:
      "How you look and communicate—brand, design, copy. This builds trust and helps visitors take you seriously.",
    layer3Title: "Systems",
    layer3Desc:
      "Your website, lead capture, and conversion path. The machinery that turns visitors into leads and customers.",
    layer4Title: "Traffic & iteration",
    layer4Desc:
      "Getting the right people to your site and improving based on what works. Growth compounds when the first three layers are solid.",
    sectionRoadmapTitle: "A simple growth roadmap",
    roadmap1: "Clarify your offer and who it's for (one sentence).",
    roadmap2: "Structure your homepage: hero message, trust, problem/solution, one clear CTA.",
    roadmap3: "Capture leads with a simple form and one primary next step.",
    roadmap4: "Improve trust (proof, credentials, clarity) and conversion (fewer distractions, clearer CTA).",
    roadmap5: "Then focus on traffic and iteration—with a system that can receive and convert it.",
    nextStepsTitle: "Your next steps",
    nextStepsSubtitle: "See how your current site stacks up, then get a practical action plan—without spending a fortune.",
    ctaScore: "Get your startup website score",
    ctaRevenue: "Estimate revenue opportunity",
    ctaActionPlan: "View startup action plan",
  },
  "website-score": {
    heroTitle: "Startup website score",
    heroSubtitle:
      "Five simple questions about your website. Get a readiness score (0–100), improvement suggestions, and a clear next step with the Startup Action Plan.",
    ctaGrowthKit: "Read the startup growth kit",
    ctaRevenue: "Revenue calculator",
    ctaActionPlan: "Startup action plan",
  },
  "action-plan": {
    heroTitle: "Startup action plan",
    heroSubtitle:
      "Practical steps to improve your online presence—without a full agency build. Work through these in order for the best results.",
    step1Title: "Clarify your offer",
    step1Body:
      "Write one sentence that says who you help and what outcome you deliver. Use it everywhere: hero, meta description, and sales conversations. If you can't say it simply, visitors won't figure it out.",
    step2Title: "Structure your homepage",
    step2Body:
      "Follow a clear flow: hero (offer + one CTA), trust (proof or credentials), problem/solution, and a final CTA. Remove competing messages. One primary action per section.",
    step3Title: "Capture leads",
    step3Body:
      "Add one simple way for visitors to take the next step: email signup, contact form, or booking link. Make it visible and low-friction. One form above the fold is better than five scattered options.",
    step4Title: "Improve trust",
    step4Body:
      'Add proof: testimonials, case results, credentials, or a clear "why us." Trust signals near the top and near the CTA convert better. Even one or two strong signals help.',
    step5Title: "Improve conversions",
    step5Body:
      "Reduce distractions: fewer links, one clear CTA, and a path that leads to one next step. Test on mobile. Small changes (button text, placement, clarity) often have a big impact.",
    ctaSectionTitle: "Want a tailored audit and roadmap?",
    ctaSectionSubtitle:
      "The Startup Growth System is a practical audit for founders who can't yet afford a full agency build. You get a website audit, messaging clarity suggestions, conversion roadmap, page structure blueprint, and an actionable growth plan.",
    ctaButtonText: "Get startup growth system",
    secondaryCtaKit: "Startup growth kit",
    secondaryCtaScore: "Website score tool",
    secondaryCtaRevenue: "Revenue calculator",
  },
  offer: {
    heroTitle: "Startup growth system",
    heroSubtitle:
      "A practical startup growth audit designed for founders who cannot yet afford a full agency build. Get clarity, a roadmap, and an actionable plan—without the big-ticket price.",
    priceLabel: "Price range",
    priceAmount: "$249 – $399",
    priceNote: "One-time audit and deliverable set. No ongoing retainer. You get the plan; you choose how to execute it.",
    deliverablesTitle: "What you get",
    del1Title: "Website audit",
    del1Desc: "Review of your current site: clarity, structure, conversion gaps, and trust signals.",
    del2Title: "Messaging clarity suggestions",
    del2Desc: "Concrete recommendations so your offer and audience are clear and consistent.",
    del3Title: "Conversion improvement roadmap",
    del3Desc: "Prioritized steps to improve lead capture and conversion without a full rebuild.",
    del4Title: "Page structure blueprint",
    del4Desc: "A simple blueprint for your homepage (and key pages) so you know what to add or reorder.",
    del5Title: "Actionable growth plan",
    del5Desc: "A written plan you can follow step-by-step or hand to a freelancer or team.",
    bullet1: "No long-term commitment—one deliverable set.",
    bullet2: "Clear, written output you can use yourself or hand to a freelancer.",
    bullet3: "Focused on what matters most for early-stage growth.",
    ctaButtonText: "Get startup growth system",
    ctaNote: "You'll be taken to book a short call. We'll confirm scope and next steps—no pressure.",
  },
};

function getEditableFields(slug: string): { key: string; label: string; multiline?: boolean }[] {
  const data = DEFAULT_CONTENT[slug] ?? {};
  return Object.keys(data).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    multiline: (data[key] as string)?.length > 80,
  }));
}

export default function AdminFunnelEditPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const isValidSlug = slug && FUNNEL_SLUGS.includes(slug as FunnelSlug);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/funnel", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/funnel/${slug}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ data: Record<string, unknown> | null }>;
    },
    enabled: !!user && !!slug && isValidSlug,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    const defaults = { ...DEFAULT_CONTENT[slug], ...data?.data };
    setFormData(defaults);
  }, [slug, data?.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/funnel/${slug}`, { data: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnel", slug] });
      toast({ title: "Saved", description: "Funnel content updated." });
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const updateField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;
  if (!isValidSlug) {
    return (
      <div className="container max-w-2xl py-10">
        <p className="text-muted-foreground">Invalid funnel.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/admin/funnel">Back to Funnel</Link>
        </Button>
      </div>
    );
  }

  const liveHref = SLUG_LINKS[slug];
  const title = SLUG_TITLES[slug] ?? slug;
  const fields = getEditableFields(slug);

  return (
    <div className="w-full min-w-0 max-w-full py-6 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground mb-2">
          <Link href="/admin/funnel">
            <ArrowLeft className="h-4 w-4" />
            Funnel
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Edit: {title}</h1>
          <div className="flex gap-2">
            {liveHref && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={liveHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View live
                </a>
              </Button>
            )}
            <Button
              size="sm"
              className="gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Content fields</CardTitle>
              <CardDescription>
                Edit the copy shown on the live page. Changes are saved to the database and will appear on the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map(({ key, label, multiline }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </Label>
                  {multiline ? (
                    <Textarea
                      id={key}
                      value={(formData[key] as string) ?? ""}
                      onChange={(e) => updateField(key, e.target.value)}
                      rows={4}
                      className="resize-y min-h-[80px]"
                    />
                  ) : (
                    <Input
                      id={key}
                      value={(formData[key] as string) ?? ""}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
