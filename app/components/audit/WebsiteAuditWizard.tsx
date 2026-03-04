"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { WebsiteAuditSubmission } from "@shared/websiteAuditSchema";
import {
  AD_PLATFORMS,
  AUDIT_CONVERSION_ACTIONS,
  AUDIT_PRIMARY_GOALS,
  AUDIT_TIMELINES,
  CMS_OPTIONS,
  CONTACT_METHODS,
  TRACKING_TOOLS,
  WEBSITE_BUSINESS_TYPES,
} from "@shared/websiteAuditSchema";

type BusinessType = (typeof WEBSITE_BUSINESS_TYPES)[number];
type CmsType = (typeof CMS_OPTIONS)[number];
type Timeline = (typeof AUDIT_TIMELINES)[number];
type ContactMethod = (typeof CONTACT_METHODS)[number];

const parseList = (value: string): string[] =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const toTitle = (value: string): string =>
  value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

export function WebsiteAuditWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    websiteUrl: "",
    businessType: "lead-generation" as BusinessType,
    targetAudience: "",
    topChallenges: "",
    primaryGoals: [] as string[],
    primaryConversionActions: [] as string[],
    priorityPagesText: "",
    competitorsText: "",
    focusKeywordsText: "",
    targetLocations: "",
    cmsPlatform: "unknown" as CmsType,
    customStackDetails: "",
    trackingTools: [] as string[],
    hasAnalyticsAccess: false,
    hasSearchConsoleAccess: false,
    runningAds: false,
    adPlatforms: [] as string[],
    monthlySessions: "",
    currentConversionRate: "",
    canProvideReadOnlyAccess: false,
    preferredTimeline: "within-2-weeks" as Timeline,
    preferredContactMethod: "email" as ContactMethod,
    additionalContext: "",
    newsletter: false,
    consent: false,
  });

  const progress = useMemo(() => Math.round((step / 4) * 100), [step]);

  const toggleItem = (
    key: "primaryGoals" | "primaryConversionActions" | "trackingTools" | "adPlatforms",
    item: string
  ) => {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.name.trim() || !form.email.trim()) {
        setError("Name and email are required.");
        return false;
      }
      if (!/^https?:\/\//i.test(form.websiteUrl.trim())) {
        setError("Website URL must include https:// or http://.");
        return false;
      }
      if (form.targetAudience.trim().length < 10) {
        setError("Target audience should be at least 10 characters.");
        return false;
      }
      if (form.topChallenges.trim().length < 20) {
        setError("Top challenges should be at least 20 characters.");
        return false;
      }
    }

    if (step === 2) {
      if (form.primaryGoals.length === 0) {
        setError("Select at least one audit goal.");
        return false;
      }
      if (form.primaryConversionActions.length === 0) {
        setError("Select at least one primary conversion action.");
        return false;
      }
      if (parseList(form.priorityPagesText).length === 0) {
        setError("Add at least one priority page to audit.");
        return false;
      }
    }

    if (step === 4 && !form.consent) {
      setError("Please confirm consent before submitting.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const buildPayload = (): WebsiteAuditSubmission => ({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    company: form.company.trim() || undefined,
    role: form.role.trim() || undefined,
    websiteUrl: form.websiteUrl.trim(),
    businessType: form.businessType,
    targetAudience: form.targetAudience.trim(),
    topChallenges: form.topChallenges.trim(),
    primaryGoals: form.primaryGoals,
    primaryConversionActions: form.primaryConversionActions,
    priorityPages: parseList(form.priorityPagesText),
    competitors: parseList(form.competitorsText),
    targetLocations: form.targetLocations.trim() || undefined,
    focusKeywords: parseList(form.focusKeywordsText),
    cmsPlatform: form.cmsPlatform,
    customStackDetails: form.customStackDetails.trim() || undefined,
    trackingTools: form.trackingTools,
    hasAnalyticsAccess: form.hasAnalyticsAccess,
    hasSearchConsoleAccess: form.hasSearchConsoleAccess,
    runningAds: form.runningAds,
    adPlatforms: form.runningAds ? form.adPlatforms : [],
    monthlySessions: form.monthlySessions.trim() || undefined,
    currentConversionRate: form.currentConversionRate.trim() || undefined,
    canProvideReadOnlyAccess: form.canProvideReadOnlyAccess,
    preferredTimeline: form.preferredTimeline,
    preferredContactMethod: form.preferredContactMethod,
    additionalContext: form.additionalContext.trim() || undefined,
    newsletter: form.newsletter,
    consent: form.consent,
  });

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/website-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to submit website audit.");
      }
      setSubmittedId(typeof data.id === "number" ? data.id : null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit website audit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Audit Request Received</CardTitle>
            <CardDescription>
              Thanks! We now have the context needed to run a professional website audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              We’ll review your site across SEO, UX, conversion flow, performance, and technical setup,
              then follow up with actionable findings and prioritized recommendations.
            </p>
            {submittedId ? (
              <Badge variant="secondary">Reference ID: {submittedId}</Badge>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" onClick={() => router.push("/")}>
                Back to Home
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/assessment")}>
                Start Project Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            Free Website Audit
          </CardTitle>
          <CardDescription>
            Step {step} of 4 · Help us gather everything needed for a professional audit.
          </CardDescription>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Website URL *</Label>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Input
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="Founder, Marketing Lead, etc."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Business Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.businessType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessType: e.target.value as BusinessType }))
                  }
                >
                  {WEBSITE_BUSINESS_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {toTitle(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Target Audience *</Label>
                <Input
                  value={form.targetAudience}
                  onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
                  placeholder="Who do you want to attract and convert?"
                />
              </div>

              <div className="grid gap-2">
                <Label>Top Challenges *</Label>
                <Textarea
                  rows={4}
                  value={form.topChallenges}
                  onChange={(e) => setForm((f) => ({ ...f, topChallenges: e.target.value }))}
                  placeholder="What feels broken right now? Traffic quality, conversion, SEO visibility, UX issues, etc."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label>Primary Audit Goals * (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {AUDIT_PRIMARY_GOALS.map((goal) => (
                    <Button
                      key={goal}
                      type="button"
                      size="sm"
                      variant={form.primaryGoals.includes(goal) ? "default" : "outline"}
                      onClick={() => toggleItem("primaryGoals", goal)}
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Primary Conversion Actions * (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {AUDIT_CONVERSION_ACTIONS.map((conversion) => (
                    <Button
                      key={conversion}
                      type="button"
                      size="sm"
                      variant={
                        form.primaryConversionActions.includes(conversion)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => toggleItem("primaryConversionActions", conversion)}
                    >
                      {conversion}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Priority Pages to Audit * (comma or new line separated)</Label>
                <Textarea
                  rows={4}
                  value={form.priorityPagesText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priorityPagesText: e.target.value }))
                  }
                  placeholder="/, /services, /pricing, /contact"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Main Competitors (optional)</Label>
                  <Textarea
                    rows={4}
                    value={form.competitorsText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, competitorsText: e.target.value }))
                    }
                    placeholder="competitor1.com, competitor2.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Target Locations / Markets</Label>
                  <Textarea
                    rows={4}
                    value={form.targetLocations}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, targetLocations: e.target.value }))
                    }
                    placeholder="Atlanta, GA; US nationwide; UK market..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>CMS / Platform</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.cmsPlatform}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cmsPlatform: e.target.value as CmsType }))
                    }
                  >
                    {CMS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {toTitle(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Current Stack Notes</Label>
                  <Input
                    value={form.customStackDetails}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customStackDetails: e.target.value }))
                    }
                    placeholder="Next.js + Shopify headless, WordPress + custom theme, etc."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Focus Keywords (optional)</Label>
                <Textarea
                  rows={3}
                  value={form.focusKeywordsText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, focusKeywordsText: e.target.value }))
                  }
                  placeholder="web design atlanta, custom web app agency, ..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Tracking Tools in Use</Label>
                <div className="flex flex-wrap gap-2">
                  {TRACKING_TOOLS.map((tool) => (
                    <Button
                      key={tool}
                      type="button"
                      size="sm"
                      variant={form.trackingTools.includes(tool) ? "default" : "outline"}
                      onClick={() => toggleItem("trackingTools", tool)}
                    >
                      {tool}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Estimated Monthly Sessions</Label>
                  <Input
                    value={form.monthlySessions}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, monthlySessions: e.target.value }))
                    }
                    placeholder="e.g. 12,500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Current Conversion Rate</Label>
                  <Input
                    value={form.currentConversionRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currentConversionRate: e.target.value }))
                    }
                    placeholder="e.g. 1.8%"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <Label className="text-sm">Access & Data Signals</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hasAnalyticsAccess}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hasAnalyticsAccess: e.target.checked }))
                    }
                  />
                  We currently have analytics data access (or can provide it).
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hasSearchConsoleAccess}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hasSearchConsoleAccess: e.target.checked,
                      }))
                    }
                  />
                  We currently have Google Search Console access.
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.runningAds}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, runningAds: e.target.checked }))
                    }
                  />
                  We are actively running paid ads.
                </label>
              </div>

              {form.runningAds && (
                <div className="grid gap-2">
                  <Label>Ad Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {AD_PLATFORMS.map((platform) => (
                      <Button
                        key={platform}
                        type="button"
                        size="sm"
                        variant={form.adPlatforms.includes(platform) ? "default" : "outline"}
                        onClick={() => toggleItem("adPlatforms", platform)}
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Preferred Timeline for Audit Delivery *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.preferredTimeline}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        preferredTimeline: e.target.value as Timeline,
                      }))
                    }
                  >
                    {AUDIT_TIMELINES.map((timeline) => (
                      <option key={timeline} value={timeline}>
                        {toTitle(timeline)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Preferred Contact Method *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.preferredContactMethod}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        preferredContactMethod: e.target.value as ContactMethod,
                      }))
                    }
                  >
                    {CONTACT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {toTitle(method)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.canProvideReadOnlyAccess}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      canProvideReadOnlyAccess: e.target.checked,
                    }))
                  }
                />
                We can provide read-only access to analytics/CMS if needed.
              </label>

              <div className="grid gap-2">
                <Label>Additional Context</Label>
                <Textarea
                  rows={5}
                  value={form.additionalContext}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, additionalContext: e.target.value }))
                  }
                  placeholder="Anything else we should know before auditing (recent redesign, campaign launch, known issues, dev constraints, etc.)?"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newsletter: e.target.checked }))
                  }
                />
                Send me occasional web performance and SEO updates.
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consent: e.target.checked }))
                  }
                />
                I confirm the information above is accurate and agree to be contacted about this audit request. *
              </label>
            </div>
          )}

          <div className="flex justify-between pt-2">
            {step === 1 ? (
              <div />
            ) : (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                Submit Free Audit Request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
