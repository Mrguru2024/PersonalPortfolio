"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

type Step = "landing" | "profile" | "systems" | "pain" | "revenue" | "scoring" | "results";

interface DiagnosticFormState {
  fullName: string;
  email: string;
  companyName: string;
  businessType: string;
  persona: string;
  systems: {
    visibility: number;
    conversion: number;
    trust: number;
    followUp: number;
    capture: number;
    retention: number;
  };
  pains: string[];
  monthlyRevenue: number;
  avgDealValue: number;
  monthlyLeads: number;
  closeRatePercent: number;
}

interface DiagnosticResultPayload {
  categoryScores: Record<string, number>;
  websitePerformanceScore: number;
  startupWebsiteScore: number;
  overallScore: number;
  topBottlenecks: string[];
  revenueOpportunityEstimate: number;
  recommendation: {
    systemKey: string;
    label: string;
    reason: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
  };
}

const SYSTEM_FIELDS: Array<{
  key: keyof DiagnosticFormState["systems"];
  label: string;
  hint: string;
}> = [
  { key: "visibility", label: "Visibility", hint: "How discoverable are you to qualified buyers?" },
  { key: "conversion", label: "Conversion", hint: "How effectively do leads become booked opportunities?" },
  { key: "trust", label: "Trust", hint: "How strong is your proof and credibility on first visit?" },
  { key: "followUp", label: "Follow-Up", hint: "How reliable is your speed and consistency after inquiries?" },
  { key: "capture", label: "Capture", hint: "How well are you capturing lead intent and contact data?" },
  { key: "retention", label: "Retention", hint: "How consistently do you create repeat revenue?" },
];

const PAIN_OPTIONS = [
  "Leads are inconsistent",
  "Too many inquiries go cold",
  "Follow-up is manual and delayed",
  "Website traffic is not converting",
  "Pricing conversations stall",
  "Clients do not return or refer consistently",
];

const INITIAL_STATE: DiagnosticFormState = {
  fullName: "",
  email: "",
  companyName: "",
  businessType: "",
  persona: "operators",
  systems: {
    visibility: 2,
    conversion: 2,
    trust: 2,
    followUp: 2,
    capture: 2,
    retention: 2,
  },
  pains: [],
  monthlyRevenue: 0,
  avgDealValue: 0,
  monthlyLeads: 0,
  closeRatePercent: 0,
};

export default function RevenueDiagnosticPage() {
  const [step, setStep] = useState<Step>("landing");
  const [formState, setFormState] = useState<DiagnosticFormState>(INITIAL_STATE);
  const [result, setResult] = useState<DiagnosticResultPayload | null>(null);
  const [progress, setProgress] = useState(15);
  const { toast } = useToast();
  const { track, getVisitorId } = useVisitorTracking();

  const stepProgress = useMemo(() => {
    const map: Record<Step, number> = {
      landing: 0,
      profile: 16,
      systems: 33,
      pain: 50,
      revenue: 66,
      scoring: 83,
      results: 100,
    };
    return map[step];
  }, [step]);

  function updateField<K extends keyof DiagnosticFormState>(key: K, value: DiagnosticFormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function updateSystemField(
    key: keyof DiagnosticFormState["systems"],
    value: DiagnosticFormState["systems"][keyof DiagnosticFormState["systems"]],
  ) {
    setFormState((prev) => ({
      ...prev,
      systems: {
        ...prev.systems,
        [key]: value,
      },
    }));
  }

  function togglePain(value: string) {
    setFormState((prev) => ({
      ...prev,
      pains: prev.pains.includes(value)
        ? prev.pains.filter((item) => item !== value)
        : [...prev.pains, value],
    }));
  }

  async function submitDiagnostic() {
    setStep("scoring");
    setProgress(20);

    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 8));
    }, 220);

    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const response = await fetch("/api/revenue-diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          attribution: {
            utm_source: params?.get("utm_source"),
            utm_medium: params?.get("utm_medium"),
            utm_campaign: params?.get("utm_campaign"),
            referrer: typeof document !== "undefined" ? document.referrer : null,
            landing_page: "/revenue-diagnostic",
            visitorId: getVisitorId(),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || "Could not complete diagnostic");
      }

      setResult(payload.result as DiagnosticResultPayload);
      setProgress(100);
      setStep("results");
      track("diagnostic_complete", {
        pageVisited: "/revenue-diagnostic",
        metadata: {
          overallScore: payload.result?.overallScore,
          recommendation: payload.result?.recommendation?.systemKey,
        },
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not complete diagnostic",
        description: "Please review your inputs and try again.",
        variant: "destructive",
      });
      setStep("revenue");
    } finally {
      window.clearInterval(interval);
    }
  }

  if (step === "landing") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <p className="text-sm uppercase tracking-wide text-primary font-semibold">Revenue Opportunity Diagnostic</p>
            <CardTitle className="text-3xl md:text-4xl">
              Find Out Where Your Business Is Losing Money
            </CardTitle>
            <CardDescription className="text-base md:text-lg">
              Most businesses don&apos;t have a traffic problem — they have a system problem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Diagnose bottlenecks, estimate lost revenue opportunity, and get a system recommendation aligned to your business stage.
            </p>
            <Button
              size="lg"
              onClick={() => {
                track("diagnostic_start", { pageVisited: "/revenue-diagnostic" });
                setStep("profile");
              }}
            >
              Start My Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "scoring") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Running live scoring...
            </CardTitle>
            <CardDescription>
              Mapping your inputs to bottlenecks, opportunity estimate, and system recommendation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Diagnostic Results</h1>
          <Button variant="outline" onClick={() => setStep("profile")}>
            Run Full Diagnosis
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Score Overview</CardTitle>
            <CardDescription>Overall system score: {result.overallScore}/100</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(result.categoryScores).map(([key, value]) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium capitalize">{key}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-sm font-medium">Website Performance Score</p>
              <p className="text-2xl font-bold">{result.websitePerformanceScore}</p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-sm font-medium">Startup Website Score</p>
              <p className="text-2xl font-bold">{result.startupWebsiteScore}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Opportunity Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${result.revenueOpportunityEstimate.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Estimated annual opportunity currently leaking from system gaps.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Bottlenecks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {result.topBottlenecks.map((bottleneck) => (
                  <li key={bottleneck}>{bottleneck}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Recommendation</CardTitle>
            <CardDescription>{result.recommendation.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{result.recommendation.reason}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link
                  href={result.recommendation.primaryCtaHref}
                  onClick={() =>
                    track("conversion_complete", {
                      pageVisited: "/revenue-diagnostic",
                      metadata: { cta: result.recommendation.primaryCtaLabel },
                    })
                  }
                >
                  {result.recommendation.primaryCtaLabel}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/strategy-call">Book Strategy Call</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/case-studies">See Proof</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This diagnostic provides directional insight. For full accuracy, book a strategy session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="space-y-2">
        <Progress value={stepProgress} />
        <p className="text-sm text-muted-foreground">Step progress: {stepProgress}%</p>
      </div>

      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Tell us who you are and which persona best matches your business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={formState.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formState.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formState.businessType}
                  onChange={(event) => updateField("businessType", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona">Persona</Label>
              <select
                id="persona"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={formState.persona}
                onChange={(event) => updateField("persona", event.target.value)}
              >
                <option value="trades">Trades</option>
                <option value="freelancers">Freelancers</option>
                <option value="founders">Founders</option>
                <option value="operators">Operators</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "systems" && (
        <Card>
          <CardHeader>
            <CardTitle>Systems Check</CardTitle>
            <CardDescription>Rate each revenue system area from 1 (weak) to 5 (strong).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {SYSTEM_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{field.label}</Label>
                  <span className="text-sm text-muted-foreground">{formState.systems[field.key]}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={formState.systems[field.key]}
                  onChange={(event) => updateSystemField(field.key, Number(event.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {step === "pain" && (
        <Card>
          <CardHeader>
            <CardTitle>Pain Detection</CardTitle>
            <CardDescription>Select the bottlenecks currently costing you the most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAIN_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={formState.pains.includes(option)}
                  onChange={() => togglePain(option)}
                />
                {option}
              </label>
            ))}
            <div className="pt-2">
              <Label htmlFor="extraPain">Anything else?</Label>
              <Textarea
                id="extraPain"
                placeholder="Optional: describe additional constraints"
                onBlur={(event) => {
                  const text = event.target.value.trim();
                  if (!text) return;
                  togglePain(text);
                  event.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "revenue" && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Inputs</CardTitle>
            <CardDescription>Provide baseline numbers for opportunity estimation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
              <Input
                id="monthlyRevenue"
                type="number"
                min={0}
                value={formState.monthlyRevenue}
                onChange={(event) => updateField("monthlyRevenue", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgDealValue">Average Deal Value ($)</Label>
              <Input
                id="avgDealValue"
                type="number"
                min={0}
                value={formState.avgDealValue}
                onChange={(event) => updateField("avgDealValue", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyLeads">Monthly Leads</Label>
              <Input
                id="monthlyLeads"
                type="number"
                min={0}
                value={formState.monthlyLeads}
                onChange={(event) => updateField("monthlyLeads", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeRatePercent">Close Rate (%)</Label>
              <Input
                id="closeRatePercent"
                type="number"
                min={0}
                max={100}
                value={formState.closeRatePercent}
                onChange={(event) => updateField("closeRatePercent", Number(event.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const backMap: Record<Step, Step> = {
              landing: "landing",
              profile: "landing",
              systems: "profile",
              pain: "systems",
              revenue: "pain",
              scoring: "revenue",
              results: "revenue",
            };
            setStep(backMap[step]);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={() => {
            if (step === "profile") {
              if (!formState.fullName || !formState.email) {
                toast({ title: "Missing required fields", description: "Name and email are required.", variant: "destructive" });
                return;
              }
              setStep("systems");
              return;
            }
            if (step === "systems") {
              setStep("pain");
              return;
            }
            if (step === "pain") {
              setStep("revenue");
              return;
            }
            if (step === "revenue") {
              void submitDiagnostic();
            }
          }}
        >
          {step === "revenue" ? "Calculate Results" : "Next"}
          {step !== "revenue" && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
