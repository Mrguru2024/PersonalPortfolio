"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  Loader2,
  Sparkles,
  Type,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VariantBuilder, type VariantDraft } from "./VariantBuilder";
import { apiRequest } from "@/lib/queryClient";
import { MetricTooltip } from "@/components/aee/MetricTooltip";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    value: "headline_test",
    label: "Headline or hero text",
    hint: "Try different titles or value props at the top of a page.",
  },
  {
    value: "cta_test",
    label: "Button or call-to-action",
    hint: "Compare “Book a call” vs “Get the guide”, placement, or color.",
  },
  {
    value: "landing_page",
    label: "Whole landing page",
    hint: "Multiple sections change together — best for bigger redesigns.",
  },
  {
    value: "google_ads_creative",
    label: "Paid ads (Google / search)",
    hint: "Tie this test to ad copy or creatives you run in Paid Growth.",
  },
  {
    value: "email_subject",
    label: "Email subject or preview",
    hint: "Use for newsletter or nurture experiments linked from Content Studio.",
  },
  {
    value: "social_hook",
    label: "Social post hook",
    hint: "First line or creative angle on LinkedIn, etc.",
  },
  {
    value: "multivariate",
    label: "Multivariate (several changes)",
    hint: "You will use three or more versions to mix multiple ideas.",
  },
] as const;

const FUNNEL_STAGES = [
  { value: "awareness", label: "Awareness", hint: "They’re just discovering you." },
  { value: "consideration", label: "Consideration", hint: "They’re comparing options." },
  { value: "conversion", label: "Conversion", hint: "They’re ready to sign up or buy." },
  { value: "nurture", label: "Nurture", hint: "Existing leads or customers." },
] as const;

const STEPS = [
  { id: 1, title: "Basics", subtitle: "Name & prediction", icon: Type },
  { id: 2, title: "Type & audience", subtitle: "What you’re changing", icon: Users },
  { id: 3, title: "Versions", subtitle: "Today vs new idea", icon: FlaskConical },
  { id: 4, title: "Review", subtitle: "Save draft", icon: ClipboardCheck },
] as const;

const OFFER_LABELS: Record<string, string> = {
  lead_magnet: "Free resource",
  service: "Consulting / done-for-you",
  strategy_call: "Strategy / discovery call",
  paid_offer: "Paid product or pilot",
  other: "Other",
};

function WhyWeAskAccordion({
  children,
  heading = "Why we ask this?",
}: {
  children: ReactNode;
  /** Defaults to the standard inline help label. */
  heading?: string;
}) {
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border/80 bg-muted/15 px-1 sm:px-2">
      <AccordionItem value="why" className="border-0">
        <AccordionTrigger className="text-sm font-medium py-3 px-2 hover:no-underline text-foreground [&[data-state=open]]:text-primary">
          {heading}
        </AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3 px-2">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function recapSnippet(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function ExperimentRecapSidebar({
  step,
  name,
  finalKey,
  templateLabel,
  funnelLabel,
  offerLabel,
  audienceLabel,
  hypothesis,
  description,
  variants,
}: {
  step: number;
  name: string;
  finalKey: string;
  templateLabel: string;
  funnelLabel: string;
  offerLabel: string;
  audienceLabel: string;
  hypothesis: string;
  description: string;
  variants: VariantDraft[];
}) {
  const preview = variants.slice(0, 4);
  const more = variants.length - preview.length;

  return (
    <aside className="hidden lg:block w-[260px] xl:w-[280px] shrink-0" aria-label="Experiment answers recap">
      <Card className="sticky top-24 border-dashed bg-card/80 shadow-sm">
        <CardHeader className="pb-2 space-y-1">
          <CardTitle className="text-sm font-semibold">Your answers so far</CardTitle>
          <CardDescription className="text-xs">Read-only summary — change answers in the steps to the left.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-3 text-muted-foreground">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
            <span>Progress</span>
            <span className="tabular-nums text-foreground font-medium">
              Step {step} of {STEPS.length}
            </span>
          </div>
          <dl className="space-y-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Title</dt>
              <dd className="text-foreground font-medium leading-snug break-words">{name.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Tracking code</dt>
              <dd className="font-mono text-[11px] text-foreground break-all">{finalKey || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Test type</dt>
              <dd className="text-foreground">{templateLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Journey stage</dt>
              <dd className="text-foreground">{funnelLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Offer</dt>
              <dd className="text-foreground">{offerLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Audience</dt>
              <dd className="text-foreground">{audienceLabel}</dd>
            </div>
            {hypothesis.trim() ? (
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Prediction</dt>
                <dd className="text-foreground leading-snug">{recapSnippet(hypothesis, 220)}</dd>
              </div>
            ) : null}
            {description.trim() ? (
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Internal notes</dt>
                <dd className="text-foreground/90 leading-snug">{recapSnippet(description, 160)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/90">Versions ({variants.length})</dt>
              <dd>
                <ul className="mt-1 space-y-1 text-foreground">
                  {preview.map((v, i) => (
                    <li key={`${v.key}-${i}`} className="flex gap-1.5">
                      <span className="text-muted-foreground shrink-0">{v.isControl ? "●" : "○"}</span>
                      <span className="min-w-0 break-words">{v.name || v.key}</span>
                    </li>
                  ))}
                  {more > 0 ? <li className="text-muted-foreground italic">+{more} more</li> : null}
                </ul>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </aside>
  );
}

function slugifyExperimentKey(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 56) || ""
  );
}

function validateVariants(variants: VariantDraft[]): string | null {
  if (variants.length < 2) {
    return "Add at least two versions: keep the current experience plus one new idea to compare.";
  }
  const controls = variants.filter((v) => v.isControl);
  if (controls.length !== 1) {
    return "Pick exactly one “original” version (the experience you have today). That becomes your baseline.";
  }
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]!;
    if (!v.name.trim()) {
      return `Version ${i + 1}: give it a short label (e.g. “Blue button”) so reports stay clear.`;
    }
    if (!v.key.trim()) {
      return `Version ${i + 1}: each version needs a short code — use letters and underscores only.`;
    }
    if (!Number.isFinite(v.allocationWeight) || v.allocationWeight <= 0) {
      return `Version ${i + 1}: traffic share must be a number greater than zero.`;
    }
  }
  return null;
}

function templateSuggestedVariants(template: string): VariantDraft[] | null {
  const base = [
    { key: "control", name: "Original", allocationWeight: 1, isControl: true },
    { key: "variant_a", name: "New version", allocationWeight: 1, isControl: false },
  ];
  switch (template) {
    case "headline_test":
      return [
        { key: "control", name: "Current headline", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "New headline", allocationWeight: 1, isControl: false },
      ];
    case "cta_test":
      return [
        { key: "control", name: "Current button / CTA", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "New button / CTA", allocationWeight: 1, isControl: false },
      ];
    case "landing_page":
      return [
        { key: "control", name: "Current page", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "Redesigned page", allocationWeight: 1, isControl: false },
      ];
    case "email_subject":
      return [
        { key: "control", name: "Current subject line", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "New subject line", allocationWeight: 1, isControl: false },
      ];
    case "google_ads_creative":
      return [
        { key: "control", name: "Current ad / copy", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "New ad / copy", allocationWeight: 1, isControl: false },
      ];
    case "social_hook":
      return [
        { key: "control", name: "Current hook", allocationWeight: 1, isControl: true },
        { key: "variant_a", name: "New hook", allocationWeight: 1, isControl: false },
      ];
    case "multivariate":
      return [
        { key: "control", name: "Combination A (baseline)", allocationWeight: 1, isControl: true },
        { key: "variant_b", name: "Combination B", allocationWeight: 1, isControl: false },
        { key: "variant_c", name: "Combination C", allocationWeight: 1, isControl: false },
      ];
    default:
      return base;
  }
}

const EXAMPLE_IDEAS: ReadonlyArray<{ title: string; hypothesis: string }> = [
  {
    title: "Homepage hero — social proof first",
    hypothesis: "If we lead with client logos above the fold, more visitors will scroll to the services section.",
  },
  {
    title: "Pricing page — “Book a call” vs guide",
    hypothesis: "If we swap the main button to “Book a strategy call,” qualified leads go up even if raw signups dip slightly.",
  },
  {
    title: "Lead form — fewer fields",
    hypothesis: "If we only ask for email first, more people start the form and we can collect details later.",
  },
];

export function CreateExperimentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [useAutoKey, setUseAutoKey] = useState(true);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [funnelStage, setFunnelStage] = useState<string>("consideration");
  const [personaKey, setPersonaKey] = useState("");
  const [offerType, setOfferType] = useState("lead_magnet");
  const [template, setTemplate] = useState<string>("headline_test");
  const [variants, setVariants] = useState<VariantDraft[]>([
    { key: "control", name: "Original", allocationWeight: 1, isControl: true },
    { key: "variant_a", name: "New version", allocationWeight: 1, isControl: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedKeyOpen, setAdvancedKeyOpen] = useState(false);
  const [templateSyncNote, setTemplateSyncNote] = useState(false);
  const skipNextTemplateEffect = useRef(true);

  useEffect(() => {
    if (!useAutoKey) return;
    setKey(slugifyExperimentKey(name));
  }, [name, useAutoKey]);

  /** When the user picks a different test type, refresh example version names so step 3 stays in sync. */
  useEffect(() => {
    if (skipNextTemplateEffect.current) {
      skipNextTemplateEffect.current = false;
      return;
    }
    const sug = templateSuggestedVariants(template);
    if (sug) {
      setVariants(sug);
      setTemplateSyncNote(true);
      const t = window.setTimeout(() => setTemplateSyncNote(false), 4500);
      return () => window.clearTimeout(t);
    }
  }, [template]);

  const finalKey = useMemo(() => key.trim().toLowerCase().replace(/\s+/g, "_"), [key]);

  const step1Ok = name.trim().length >= 2 && finalKey.length >= 2;
  const variantError = validateVariants(variants);

  const maxReachableStep = !step1Ok ? 1 : variantError ? 3 : 4;

  /** If variants become invalid while on Review, drop back to Versions. */
  useEffect(() => {
    if (step > maxReachableStep) setStep(maxReachableStep);
  }, [step, maxReachableStep]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const vErr = validateVariants(variants);
    if (vErr) {
      setError(vErr);
      setStep(3);
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/admin/experiments", {
        key: finalKey,
        name: name.trim(),
        description: description.trim() || null,
        hypothesis: hypothesis.trim() || null,
        funnelStage,
        primaryPersonaKey: personaKey.trim() || null,
        offerType,
        experimentTemplateKey: template,
        channels: ["web"],
        variants: variants.map((v) => ({
          key: v.key.trim(),
          name: v.name.trim(),
          allocationWeight: v.allocationWeight,
          isControl: v.isControl,
          config: {},
        })),
      });
      const data = (await res.json()) as { id: number };
      router.push(`/admin/experiments/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const applyFriendlyNames = () => {
    const sug = templateSuggestedVariants(template);
    if (sug) setVariants(sug);
  };

  const funnelLabel = FUNNEL_STAGES.find((f) => f.value === funnelStage)?.label ?? funnelStage;
  const templateLabel = TEMPLATES.find((t) => t.value === template)?.label ?? template;
  const offerLabel = OFFER_LABELS[offerType] ?? offerType.replace(/_/g, " ");
  const audienceLabel = personaKey.trim() || "Everyone";

  const progressPct = (step / STEPS.length) * 100;

  function trafficPercentsForReview(vs: VariantDraft[]): number[] {
    const raw = vs.map((v) => (Number.isFinite(v.allocationWeight) && v.allocationWeight > 0 ? v.allocationWeight : 1));
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    return raw.map((w) => (w / sum) * 100);
  }
  const reviewPercents = step === 4 ? trafficPercentsForReview(variants) : [];

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto pb-8 sm:pb-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-6 lg:items-start xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-8">
        <div className="min-w-0 max-w-4xl space-y-6 sm:space-y-8 lg:max-w-none">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:px-5 sm:py-4 space-y-2">
        <p className="text-sm font-medium text-foreground">You’re building a compare-and-learn test</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No code required here. We’ll save a <strong className="text-foreground font-medium">draft</strong> you can
          start when you’re ready. Use your own words — engineers can hook up tracking using the short codes below.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step} of {STEPS.length}
          </span>
          <span className="tabular-nums">{Math.round(progressPct)}% complete</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/50"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="Wizard progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <nav aria-label="Create experiment progress" className="rounded-xl border bg-card/50 p-4">
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={s.id > maxReachableStep}
                  onClick={() => {
                    if (s.id <= maxReachableStep) {
                      setError(null);
                      setStep(s.id);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all",
                    active && "border-primary/30 bg-primary/10 ring-1 ring-primary/20",
                    done && !active && "bg-muted/40 opacity-95",
                    s.id > maxReachableStep && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      done && "bg-primary text-primary-foreground",
                      active && !done && "bg-primary/20 text-primary",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-5 w-5" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{s.title}</span>
                    <span className="block text-xs text-muted-foreground">{s.subtitle}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Tap a step to go back. Nothing is saved until you click{" "}
          <strong className="text-foreground">Save draft experiment</strong> on the last step.
        </p>
      </nav>

      {step === 1 ? (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Give your test a clear name</CardTitle>
            <CardDescription>
              Write like you’re telling a teammate what you’re trying — you can paste from a doc or keep it short.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <WhyWeAskAccordion>
              A <strong className="text-foreground">clear title</strong> helps your team find this test in the list later.
              The <strong className="text-foreground">prediction</strong> is optional but makes it easier to agree later
              whether the test “worked.” <strong className="text-foreground">Internal notes</strong> are only for your
              workspace (links, stakeholder asks). The <strong className="text-foreground">tracking code</strong> is the
              stable ID your site or tools use to record which version someone saw—we derive it from the title unless you
              override it.
            </WhyWeAskAccordion>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Start from an idea (optional)</p>
              <p className="text-xs text-muted-foreground">Tap one to fill the title and a sample prediction. Edit freely afterward.</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_IDEAS.map((ex) => (
                  <Button
                    key={ex.title}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-auto py-2 px-3 text-left font-normal whitespace-normal"
                    onClick={() => {
                      setName(ex.title);
                      setHypothesis(ex.hypothesis);
                      setError(null);
                    }}
                  >
                    <span className="block text-xs font-medium text-foreground leading-snug">{ex.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-name" className="text-base">
                Title
                <MetricTooltip
                  label="What's this?"
                  className="ml-1"
                  explanation="Only your team sees this name in the admin. Visitors don’t see it unless you use the same text on the site yourself."
                />
              </Label>
              <Input
                id="exp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Homepage hero — trust badge test"
                className="text-base"
                autoComplete="off"
                aria-invalid={name.trim().length > 0 && name.trim().length < 2}
              />
              {name.trim().length > 0 && name.trim().length < 2 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Use at least two characters for the title.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-hyp">Prediction (optional but recommended)</Label>
              <Textarea
                id="exp-hyp"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="If we highlight client results in the hero, more visitors will book a call — without fewer overall signups."
                rows={3}
                className="resize-y min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" aria-hidden />
                One sentence is enough. It helps you decide later whether the test worked.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-desc">Internal notes (optional)</Label>
              <Textarea
                id="exp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Links to Figma, doc, or what stakeholders asked for."
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                Short tracking code (filled automatically)
                <MetricTooltip
                  label="Why?"
                  explanation="Your website or tools use this stable code to remember which version someone saw. We derive it from your title — most people never change it."
                />
              </p>
              <code className="block break-all rounded-md bg-background px-3 py-2 text-sm font-mono border">
                {finalKey || "…type a title above"}
              </code>
              <Collapsible open={advancedKeyOpen} onOpenChange={setAdvancedKeyOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-muted-foreground">
                    <ChevronDown className={cn("h-4 w-4 mr-1 transition-transform", advancedKeyOpen && "rotate-180")} />
                    I need to edit the code myself
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      setUseAutoKey(false);
                      setKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "_")
                          .replace(/[^a-z0-9_]/g, ""),
                      );
                    }}
                    className="font-mono text-sm"
                    placeholder="my_experiment_key"
                    aria-label="Manual experiment technical ID"
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      setUseAutoKey(true);
                      setKey(slugifyExperimentKey(name));
                    }}
                  >
                    Reset to auto from title
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">What kind of change is this?</CardTitle>
            <CardDescription>
              Pick the closest match. We’ll suggest friendly labels for your versions in the next step whenever you switch
              types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <WhyWeAskAccordion>
              We use <strong className="text-foreground">test type</strong> to suggest clear version names on the next
              step. <strong className="text-foreground">Journey stage</strong> and <strong className="text-foreground">offer</strong>{" "}
              labels help group reports — they don’t change how traffic runs. The audience tag is optional metadata for
              your own segmentation.
            </WhyWeAskAccordion>
            {templateSyncNote && (
              <p
                className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                <Sparkles className="inline h-4 w-4 mr-1.5 align-text-bottom text-primary" aria-hidden />
                Version names were updated to match this test type — adjust them on the next step if you like.
              </p>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium">Choose a category — tap a card</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setTemplate(t.value);
                      setError(null);
                    }}
                    className={cn(
                      "relative rounded-xl border p-3 sm:p-4 text-left text-sm transition-all hover:bg-muted/50 hover:border-primary/25",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      template === t.value &&
                        "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm scale-[1.01]",
                    )}
                  >
                    {template === t.value ? (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : null}
                    <span className="font-medium text-foreground block pr-8">{t.label}</span>
                    <span className="text-muted-foreground text-xs mt-1 block leading-snug">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                Where are people in their journey?
                <MetricTooltip
                  label="Why ask?"
                  explanation="Rough label for reports — pick where visitors usually see this test (browsing, comparing, deciding, or already a contact)."
                />
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {FUNNEL_STAGES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFunnelStage(f.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all hover:bg-muted/50",
                      funnelStage === f.value && "border-primary bg-primary/5 ring-2 ring-primary/20",
                    )}
                  >
                    <span className="font-medium text-sm">{f.label}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">{f.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  What are you offering in this journey?
                  <MetricTooltip
                    label="Examples"
                    explanation="Helps group results later — e.g. checklist download vs. paid workshop."
                  />
                </Label>
                <Select value={offerType} onValueChange={setOfferType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_magnet">Free resource (guide, checklist, video…)</SelectItem>
                    <SelectItem value="service">Consulting or done-for-you service</SelectItem>
                    <SelectItem value="strategy_call">Free strategy / discovery call</SelectItem>
                    <SelectItem value="paid_offer">Paid product, course, or pilot</SelectItem>
                    <SelectItem value="other">Something else</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground leading-snug">
                  Don’t stress — you can change this later. Pick what feels closest today.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="persona" className="flex items-center gap-1">
                  Audience tag (optional)
                  <MetricTooltip
                    label="Examples"
                    explanation="A short internal label: “SMB owner”, “marketing lead”. Leave blank if everyone’s in the same audience."
                  />
                </Label>
                <Input
                  id="persona"
                  value={personaKey}
                  onChange={(e) => setPersonaKey(e.target.value)}
                  placeholder="e.g. Small business owners"
                  className="text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">Versions & who sees them</CardTitle>
              <CardDescription>
                Most tests compare <strong className="text-foreground font-medium">what you have today</strong> with{" "}
                <strong className="text-foreground font-medium">one new idea</strong>. The bar shows roughly how traffic
                will split.
              </CardDescription>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={applyFriendlyNames} className="shrink-0 gap-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Reset names from test type
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <WhyWeAskAccordion>
              Visitors need a stable <strong className="text-foreground">“original”</strong> (baseline) and at least one{" "}
              <strong className="text-foreground">new idea</strong>. Friendly names appear in reports; short codes are for
              technical tracking. Traffic share is relative — use the quick buttons for an even or conservative split before
              fine-tuning numbers.
            </WhyWeAskAccordion>
            <VariantBuilder variants={variants} onChange={setVariants} />
            {variantError ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {variantError}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Almost done — review</CardTitle>
            <CardDescription>
              We’ll save this as a <strong className="text-foreground font-medium">draft</strong>. Nothing goes live to
              visitors until you start the test from the next screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <WhyWeAskAccordion>
              This step is a <strong className="text-foreground">read-only checklist</strong> of what you entered (on wide
              screens, the sidebar stays visible while you move through earlier steps too). Saving creates a{" "}
              <strong className="text-foreground">draft</strong> only—visitors don’t see anything until you{" "}
              <strong className="text-foreground">start</strong> the experiment from the next screen. Use the buttons below
              to jump back if anything needs a tweak.
            </WhyWeAskAccordion>

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Title</dt>
                <dd className="font-medium text-base mt-0.5">{name.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Tracking code</dt>
                <dd className="font-mono text-sm mt-0.5 break-all">{finalKey || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Test type</dt>
                <dd className="mt-0.5">{templateLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Funnel stage</dt>
                <dd className="mt-0.5">{funnelLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Offer</dt>
                <dd className="mt-0.5 capitalize">{offerType.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Audience tag</dt>
                <dd className="mt-0.5">{personaKey.trim() || "Everyone"}</dd>
              </div>
              {hypothesis.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Prediction</dt>
                  <dd className="mt-0.5 leading-relaxed">{hypothesis.trim()}</dd>
                </div>
              ) : null}
              {description.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Internal notes</dt>
                  <dd className="mt-0.5 text-muted-foreground">{description.trim()}</dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Traffic preview</dt>
                <dd className="mb-3">
                  <div className="flex h-4 w-full max-w-md overflow-hidden rounded-full bg-muted border" aria-hidden>
                    {reviewPercents.map((pct, i) => (
                      <div
                        key={`rev-${variants[i]?.key}-${i}`}
                        className={cn(
                          "h-full min-w-[3px] transition-all",
                          variants[i]?.isControl ? "bg-primary/45" : "bg-primary",
                        )}
                        style={{ flex: `${Math.max(pct, 0.5)} 1 0%` }}
                      />
                    ))}
                  </div>
                </dd>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Versions</dt>
                <dd>
                  <ul className="space-y-2">
                    {variants.map((v, i) => (
                      <li
                        key={`${v.key}-${i}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2"
                      >
                        <span>
                          <span className="font-medium">{v.name}</span>{" "}
                          <span className="text-muted-foreground text-xs font-mono">({v.key})</span>
                          {v.isControl ? (
                            <span className="ml-2 text-xs text-primary font-medium">original today</span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {reviewPercents[i] != null ? `${reviewPercents[i]!.toFixed(0)}%` : "—"} · share {v.allocationWeight}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" onClick={() => submit()} disabled={saving || !step1Ok || !!variantError} size="lg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> : null}
                Save draft experiment
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(3)} disabled={saving}>
                Edit versions
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={saving}>
                Edit basics
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={saving}>
                Edit type & audience
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step < 4 && error ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2" role="alert">
          {error}
        </p>
      ) : null}

      {step < 4 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              setError(null);
              if (step === 1 && !step1Ok) {
                setError("Add a title with at least two letters. The technical ID fills in automatically.");
                return;
              }
              if (step === 3 && variantError) {
                setError(variantError);
                return;
              }
              setStep((s) => Math.min(4, s + 1));
            }}
            disabled={(step === 1 && !step1Ok) || (step === 3 && !!variantError)}
            className="gap-1"
          >
            Continue
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
        </div>

        <ExperimentRecapSidebar
          step={step}
          name={name}
          finalKey={finalKey}
          templateLabel={templateLabel}
          funnelLabel={funnelLabel}
          offerLabel={offerLabel}
          audienceLabel={audienceLabel}
          hypothesis={hypothesis}
          description={description}
          variants={variants}
        />
      </div>
    </div>
  );
}
