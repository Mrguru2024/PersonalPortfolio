"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FlaskConical,
  LayoutGrid,
  LineChart,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  EXPERIMENTS_TUTORIAL_CHECKLIST,
  EXPERIMENTS_TUTORIAL_STORAGE_KEY,
  type TutorialChecklistItem,
} from "@/lib/experimentsHowToTutorial";

type ScenarioId = "landing" | "email" | "paid";

const SCENARIOS: Record<
  ScenarioId,
  { title: string; hypothesis: string; variants: string[]; metric: string; wiring: string }
> = {
  landing: {
    title: "Landing page (hero or CTA)",
    hypothesis: "If we lead with time-to-value instead of features, more visitors will start the booking flow.",
    variants: ["Control: feature-led headline", "Variant: outcome + timeframe in the hero", "Optional: shorter subhead"],
    metric: "Visitors → leads (form or calendar) in rollups; confirm high-value leads in CRM.",
    wiring:
      "Frontend calls `GET /api/growth-intelligence/variant?experiment=YOUR_KEY&visitorId=...` and renders the matching hero. Same experiment key as in admin.",
  },
  email: {
    title: "Newsletter or nurture email",
    hypothesis: "If the subject line names the reader’s role, open rate rises without hurting replies.",
    variants: ["Control: generic benefit subject", "Variant: role + outcome in ≤50 characters"],
    metric: "Opens/clicks often come from your ESP; paste rates into optional fields on the AI insights panel. Tie ultimate conversions to CRM where possible.",
    wiring:
      "Experiment key can align a send split if your mail tool supports per-recipient URLs or segments; otherwise use the experiment to track downstream landing behavior with consistent UTM + variant endpoint.",
  },
  paid: {
    title: "Paid search or social",
    hypothesis: "If ad copy matches the landing variant’s primary promise, conversion rate improves at the same CPC.",
    variants: ["Control: broad category copy", "Variant: tight match to landing headline"],
    metric: "Ad platform conversions + experiment rollups; add channel links on the detail page to the Google/Meta campaign.",
    wiring:
      "Link campaigns in **Channel links** on the experiment detail page. Keep `experiment` query params or stored assignment aligned with the ad’s landing URL.",
  },
};

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(EXPERIMENTS_TUTORIAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function ExperimentsFlowDiagram({ className }: { className?: string }) {
  return (
    <figure
      className={cn("rounded-xl border bg-muted/20 p-4 dark:bg-muted/10", className)}
      aria-label="Diagram: experiment lifecycle"
    >
      <figcaption className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Illustration: data flow (accurate to this product)
      </figcaption>
      <svg viewBox="0 0 640 120" className="w-full h-auto text-foreground" role="img" aria-hidden="false">
        <title>Ascendra Experimentation Engine flow</title>
        <defs>
          <linearGradient id="aee-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" fillOpacity="0.45" />
          </marker>
        </defs>
        <rect x="8" y="36" width="120" height="48" rx="8" fill="url(#aee-grad)" stroke="currentColor" strokeOpacity="0.25" />
        <text x="68" y="54" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
          Hypothesis
        </text>
        <text x="68" y="70" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          admin draft
        </text>
        <path d="M132 60 L155 60" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="158" y="36" width="124" height="48" rx="8" fill="url(#aee-grad)" stroke="currentColor" strokeOpacity="0.25" />
        <text x="220" y="54" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
          growth_experiments
        </text>
        <text x="220" y="70" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          + growth_variants
        </text>
        <path d="M286 60 L308 60" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />

        <rect x="312" y="28" width="132" height="64" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeOpacity="0.4" />
        <text x="378" y="50" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
          Visitor request
        </text>
        <text x="378" y="66" textAnchor="middle" className="fill-muted-foreground text-[10px]">
          /api/growth-intelligence/variant
        </text>
        <text x="378" y="80" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          variantKey + config
        </text>

        <path d="M448 60 L472 60" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />

        <rect x="476" y="36" width="152" height="48" rx="8" fill="url(#aee-grad)" stroke="currentColor" strokeOpacity="0.25" />
        <text x="552" y="54" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
          aee_experiment_metrics_daily
        </text>
        <text x="552" y="70" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          rollups (dimension total)
        </text>
      </svg>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        Assignments persist per visitor; daily rows aggregate visitors, leads, optional revenue/spend for each variant.
        The admin detail page reads those totals for the rollups table and recommendations.
      </p>
    </figure>
  );
}

function ChecklistPanel({
  checkedIds,
  onToggle,
  onReset,
}: {
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
}) {
  const total = EXPERIMENTS_TUTORIAL_CHECKLIST.length;
  const done = checkedIds.size;
  const pct = Math.round((done / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Your launch checklist</CardTitle>
            <CardDescription>
              Check steps as you complete them. Progress is saved in this browser only.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">{pct}%</p>
            <p className="text-xs text-muted-foreground">
              {done} / {total}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-3" aria-hidden>
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-0 max-h-[min(520px,55vh)] overflow-y-auto pr-1">
        {EXPERIMENTS_TUTORIAL_CHECKLIST.map((item) => (
          <ChecklistRow key={item.id} item={item} checked={checkedIds.has(item.id)} onToggle={() => onToggle(item.id)} />
        ))}
        <button
          type="button"
          onClick={onReset}
          className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Clear all checks
        </button>
      </CardContent>
    </Card>
  );
}

function ChecklistRow({
  item,
  checked,
  onToggle,
}: {
  item: TutorialChecklistItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full gap-3 text-left py-3 border-b border-border/60 last:border-0 rounded-none hover:bg-muted/40 -mx-2 px-2 transition-colors",
        checked && "bg-primary/5",
      )}
    >
      <span className="shrink-0 mt-0.5" aria-hidden>
        {checked ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/70" />
        )}
      </span>
      <span className="min-w-0">
        <span className={cn("text-sm font-medium block", checked && "text-foreground/90")}>{item.label}</span>
        <span className="text-xs text-muted-foreground leading-snug block mt-0.5">{item.hint}</span>
      </span>
    </button>
  );
}

export function ExperimentsAbTestingTutorial() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [scenario, setScenario] = useState<ScenarioId>("landing");
  const scenarioDetail = SCENARIOS[scenario];

  const persistReady = useRef(false);
  useEffect(() => {
    setCheckedIds(loadChecked());
  }, []);

  useEffect(() => {
    if (!persistReady.current) {
      persistReady.current = true;
      return;
    }
    try {
      localStorage.setItem(EXPERIMENTS_TUTORIAL_STORAGE_KEY, JSON.stringify([...checkedIds]));
    } catch {
      /* ignore quota */
    }
  }, [checkedIds]);

  const toggle = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetChecks = useCallback(() => {
    setCheckedIds(new Set());
    try {
      localStorage.removeItem(EXPERIMENTS_TUTORIAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const navItems = useMemo(
    () => [
      { href: "/admin/experiments", label: "Overview", icon: LayoutGrid, note: "Workflow, calculator, experiment table" },
      { href: "/admin/experiments/new", label: "New experiment", icon: FlaskConical, note: "Wizard: hypothesis, type, variants" },
      { href: "/admin/experiments/reports", label: "Reports", icon: LineChart, note: "Rollup / readout hub" },
      { href: "/admin/experiments/patterns", label: "Patterns", icon: BookOpen, note: "Ideas for future tests" },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <Tabs defaultValue="walkthrough" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 p-1 bg-muted/60">
          <TabsTrigger value="walkthrough" className="text-xs sm:text-sm py-2">
            Walkthrough
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs sm:text-sm py-2">
            Screen map
          </TabsTrigger>
          <TabsTrigger value="examples" className="text-xs sm:text-sm py-2">
            Examples
          </TabsTrigger>
          <TabsTrigger value="deep" className="text-xs sm:text-sm py-2">
            Concepts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="walkthrough" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <ExperimentsFlowDiagram />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Seven-minute mental model</CardTitle>
                  <CardDescription>What “A/B testing” means in Ascendra (not a generic blog definition).</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                  <p>
                    <strong className="text-foreground font-medium">1. One experiment, many arms.</strong> A test has an
                    experiment key, a control variant, and challengers. Allocation weights in admin determine how often
                    new visitors are assigned to each arm (sticky per visitor once assigned).
                  </p>
                  <p>
                    <strong className="text-foreground font-medium">2. Measurement is server-side rollups.</strong> The
                    detail page &ldquo;Rollups (totals)&rdquo; table aggregates{" "}
                    <code className="text-xs bg-muted px-1 rounded">aee_experiment_metrics_daily</code> rows with{" "}
                    <code className="text-xs bg-muted px-1 rounded">dimension_key = total</code>. Visitors and leads columns
                    are what you plug into the overview calculator for a z-test.
                  </p>
                  <p>
                    <strong className="text-foreground font-medium">3. Recommendations are conservative.</strong> Until
                    there is roughly <strong className="text-foreground">~20 visitors per variant</strong> or at least one
                    lead, the <strong className="text-foreground">Optimization preview</strong> card tends to say you need
                    more data — that mirrors the code in the insight engine, not generic advice.
                  </p>
                  <p>
                    <strong className="text-foreground font-medium">4. AI insights are optional glue.</strong> The{" "}
                    <strong className="text-foreground">Content &amp; campaign AI insights</strong> panel sends rollups +
                    your goal to the model with instructions not to invent numbers. It complements, not replaces,
                    statistics and CRM truth.
                  </p>
                </CardContent>
              </Card>
            </div>
            <ChecklistPanel checkedIds={checkedIds} onToggle={toggle} onReset={resetChecks} />
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            The experiments hub shares one layout: subnav links plus the page body. Use this map so you always know where
            a tool lives.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {navItems.map(({ href, label, icon: Icon, note }) => (
              <Card key={href} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    {label}
                  </CardTitle>
                  <CardDescription className="text-xs">{note}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ButtonLink href={href} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Experiment detail page (`/admin/experiments/[id]`)</CardTitle>
              <CardDescription>Open any row in the table to reach the full readout.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-foreground">Channel links</strong> — tie Google/Meta campaigns, email sends,
                  or web paths to the experiment (and optional variant).
                </li>
                <li>
                  <strong className="text-foreground">PPC performance</strong> — when links exist, shows snapshot totals
                  aligned with Paid Growth data.
                </li>
                <li>
                  <strong className="text-foreground">Experiment score</strong> — composite preview from conversion spread,
                  revenue index, sample strength (explicitly not a formal significance test).
                </li>
                <li>
                  <strong className="text-foreground">Optimization preview</strong> — rule-based hints from the same
                  rollups you see in the table.
                </li>
                <li>
                  <strong className="text-foreground">Content &amp; campaign AI insights</strong> — structured summary,
                  suggested copy/CTA moves, caveats; optional email metrics fields for newsletter contexts.
                </li>
                <li>
                  <strong className="text-foreground">Variants + rollups + stored insights</strong> — audit trail and daily
                  metric preview at the bottom.
                </li>
              </ul>
              <p className="text-xs">
                Subnav also links to <strong className="text-foreground">Website analytics</strong> (
                <Link href="/admin/analytics" className="text-primary underline-offset-2 hover:underline">
                  /admin/analytics
                </Link>
                ) for site-wide context outside a single experiment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="scenario-select">Pick a scenario (interactive)</Label>
              <Select value={scenario} onValueChange={(v) => setScenario(v as ScenarioId)}>
                <SelectTrigger id="scenario-select" className="w-full sm:w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing">Landing page</SelectItem>
                  <SelectItem value="email">Newsletter / email</SelectItem>
                  <SelectItem value="paid">Paid ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scenarioDetail.title}</CardTitle>
              <CardDescription>Concrete wording you can paste or adapt — check accuracy against your tracking setup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Hypothesis</p>
                <p className="text-foreground leading-relaxed">{scenarioDetail.hypothesis}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Variants to define in admin</p>
                <ul className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  {scenarioDetail.variants.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">What “winning” measures</p>
                <p className="text-muted-foreground leading-relaxed">{scenarioDetail.metric}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Wiring &amp; attribution notes</p>
                <p className="text-muted-foreground leading-relaxed">{scenarioDetail.wiring}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mini illustration: calculator numbers</CardTitle>
              <CardDescription>
                The overview &ldquo;A/B testing tools&rdquo; card expects visitors and conversions per arm. Example only.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="grid sm:grid-cols-2 gap-3 font-mono text-xs bg-muted/40 rounded-lg p-3 border">
                <div>
                  <p className="font-sans font-medium text-foreground mb-1">Arm A (control)</p>
                  <p>Visitors: 1,000</p>
                  <p>Conversions: 120 → 12.0%</p>
                </div>
                <div>
                  <p className="font-sans font-medium text-foreground mb-1">Arm B (variant)</p>
                  <p>Visitors: 1,000</p>
                  <p>Conversions: 150 → 15.0%</p>
                </div>
              </div>
              <p className="mt-3 leading-relaxed">
                Enter those into the live calculator to see a p-value and confidence interval from the implemented
                two-proportion z-test. If your rollups show unequal traffic, mirror those exact counts — don’t assume 50/50
                splits unless your weights and traffic sources make that true.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deep" className="mt-6 space-y-4">
          <Accordion type="multiple" defaultValue={["glossary", "mistakes"]} className="w-full">
            <AccordionItem value="variant-api">
              <AccordionTrigger className="text-left text-sm font-medium">
                Variant API (public) — request shape
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  Endpoint: <code className="text-xs bg-muted px-1 rounded">GET /api/growth-intelligence/variant</code>
                </p>
                <p>
                  Required query parameters: <code className="text-xs bg-muted px-1 rounded">experiment</code> (the
                  experiment key string) and <code className="text-xs bg-muted px-1 rounded">visitorId</code> (stable id
                  for the browser or app install). Optional: <code className="text-xs bg-muted px-1 rounded">sessionId</code>.
                </p>
                <p>
                  Response JSON includes <code className="text-xs bg-muted px-1 rounded">variantKey</code> and{" "}
                  <code className="text-xs bg-muted px-1 rounded">config</code> (from the variant row). Your frontend chooses
                  which headline, component, or route to render based on <code className="text-xs bg-muted px-1 rounded">variantKey</code>.
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200/90">
                  Do not embed secrets in public pages; this route is intentionally unauthenticated so marketing sites can
                  bucket visitors.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="glossary">
              <AccordionTrigger className="text-left text-sm font-medium">Glossary (terms on this screen)</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-foreground font-medium">Control</dt>
                    <dd>Baseline variant — usually current experience. Compare challengers against it.</dd>
                  </div>
                  <div>
                    <dt className="text-foreground font-medium">Allocation weight</dt>
                    <dd>Relative traffic share for new assignments. Higher weight ≠ guaranteed equal visitors if traffic is low.</dd>
                  </div>
                  <div>
                    <dt className="text-foreground font-medium">Rollup</dt>
                    <dd>Sum of daily metric rows per variant for the experiment; detail page shows totals for dimension &ldquo;total&rdquo;.</dd>
                  </div>
                  <div>
                    <dt className="text-foreground font-medium">p-value (calculator)</dt>
                    <dd>From a pooled two-proportion z-test in `app/lib/aee/abTestMath.ts`. Typical cutoffs (0.05) are organizational choices.</dd>
                  </div>
                  <div>
                    <dt className="text-foreground font-medium">Experiment score</dt>
                    <dd>Heuristic 0–100 composite in `aeeScores.ts` — informative, not a license to skip CRM verification.</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mistakes">
              <AccordionTrigger className="text-left text-sm font-medium">Common mistakes to avoid</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Changing the experiment key after traffic starts — treats assignments as a new test.</li>
                  <li>Peeking once at p &lt; 0.05 and stopping immediately without accounting for multiple looks (optional: use a fixed sample size plan).</li>
                  <li>Ignoring unequal traffic or seasonality — paid and organic mix can bias apparent conversion rates.</li>
                  <li>Treating AI narrative as ground truth; it only rephrases the numbers you already have.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="related">
              <AccordionTrigger className="text-left text-sm font-medium">Where newsletters &amp; Content Studio fit</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  Creative drafts and sends often start in{" "}
                  <Link href="/admin/content-studio" className="text-primary underline-offset-2 hover:underline">
                    Content Studio
                  </Link>{" "}
                  or{" "}
                  <Link href="/admin/newsletters" className="text-primary underline-offset-2 hover:underline">
                    Newsletters
                  </Link>
                  . This experiments hub measures outcomes once variants and tracking are wired; use the AI panel to
                  translate rollup results into suggested subject lines or landing tweaks, then implement there.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 flex flex-wrap items-center gap-3 text-sm">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
          <p className="text-muted-foreground min-w-0">
            Ready to try it?{" "}
            <Link href="/admin/experiments/new" className="font-medium text-primary inline-flex items-center gap-1">
              Create an experiment <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      Open
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}
