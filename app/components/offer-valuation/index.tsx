"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Lock, LineChart, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { fireOfferValuationConversion } from "@/lib/offerValuationConversions";
import { STRATEGY_CALL_PATH } from "@/lib/funnelCtas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { OfferScoreBand, OfferValueInputs } from "@shared/offerValuation";
import type { OfferValuationMode } from "@shared/offerValuation";

type ToolSurface = "internal" | "public";

interface OfferValuationSettingsShape {
  accessMode: OfferValuationMode;
  clientAccessEnabled: boolean;
  publicAccessEnabled: boolean;
  paidModeEnabled: boolean;
  aiDefaultEnabled: boolean;
  requireLeadCapture: boolean;
}

interface OfferValuationToolProps {
  surface: ToolSurface;
}

interface OfferValuationApiResult {
  id: number;
  finalScore: number;
  rawScore: number;
  scoreBand: OfferScoreBand;
  aiUsed: boolean;
  insights: {
    scoreBreakdown: Record<
      string,
      { score: number; explanation: string }
    >;
    offerDiagnosis: { strengths: string[]; weaknesses: string[] };
    strategicFixes: string[];
    upgradedOffer: string;
    suggestedBonuses: string[];
    suggestedGuarantees: string[];
    positioningImprovements: string[];
    monetizationInsight: string;
    recommendationTier: "correction" | "optimization" | "scaling";
    aiGenerated: boolean;
  };
}

const PERSONA_OPTIONS = [
  "B2B Founder",
  "Local Service Business",
  "Agency Owner",
  "Coach / Consultant",
  "SaaS Operator",
  "Ecommerce Brand",
  "Custom",
] as const;

const MODE_LABELS: Record<OfferValuationMode, string> = {
  internal_tool: "Internal Tool",
  client_tool: "Client Tool",
  lead_magnet: "Lead Magnet",
  paid_tool: "Paid Tool (future)",
};

function scoreBandColor(scoreBand: OfferScoreBand) {
  if (scoreBand === "low") return "destructive";
  if (scoreBand === "mid") return "secondary";
  return "default";
}

function scoreBandMessage(scoreBand: OfferScoreBand): string {
  if (scoreBand === "low") return "Strong correction recommended";
  if (scoreBand === "mid") return "Optimization recommended";
  return "Scaling recommended";
}

function sliderValue(v: number) {
  return [v];
}

interface ScoreSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function ScoreSlider({ id, label, value, onChange }: ScoreSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Badge variant="outline">{value}</Badge>
      </div>
      <Slider
        id={id}
        min={1}
        max={10}
        step={1}
        value={sliderValue(value)}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
    </div>
  );
}

function accessRoleFromUser(user: ReturnType<typeof useAuth>["user"]) {
  if (user?.isAdmin && user?.adminApproved) return "ADMIN";
  if (user) return "CLIENT";
  return "PUBLIC";
}

export default function OfferValuationTool({ surface }: OfferValuationToolProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { track, getAttributionSnapshot } = useVisitorTracking();
  const { toast } = useToast();
  const [settings, setSettings] = useState<OfferValuationSettingsShape | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [persona, setPersona] = useState<string>("B2B Founder");
  const [customPersona, setCustomPersona] = useState("");
  const [offerName, setOfferName] = useState("");
  const [description, setDescription] = useState("");
  const [scores, setScores] = useState<OfferValueInputs>({
    dreamOutcome: 6,
    perceivedLikelihood: 5,
    timeDelay: 6,
    effortAndSacrifice: 6,
  });
  const [aiEnabled, setAiEnabled] = useState(false);
  const [result, setResult] = useState<OfferValuationApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startedTracking, setStartedTracking] = useState(false);

  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadCapture, setLeadCapture] = useState({
    name: "",
    email: "",
    businessType: "",
  });
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    if (settingsLoaded) return;
    setSettingsLoading(true);
    fetch("/api/offer-valuation/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data as OfferValuationSettingsShape);
        setAiEnabled(Boolean(data.aiDefaultEnabled));
      })
      .catch(() => {
        toast({
          title: "Could not load tool settings",
          description: "Try refreshing the page.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setSettingsLoaded(true);
        setSettingsLoading(false);
      });
  }, [settingsLoaded, toast]);

  const role = accessRoleFromUser(user);
  const selectedPersona = useMemo(
    () => (persona === "Custom" ? customPersona.trim() || "Custom" : persona),
    [persona, customPersona],
  );

  const modeText = settings ? MODE_LABELS[settings.accessMode] : "Loading";
  const canUse =
    settings &&
    ((surface === "public" &&
      (settings.publicAccessEnabled || settings.accessMode === "lead_magnet") &&
      !(settings.accessMode === "paid_tool" && settings.paidModeEnabled)) ||
      (surface === "internal" &&
        (role === "ADMIN" ||
          ((role === "CLIENT" || role === "PUBLIC") &&
            settings.clientAccessEnabled))));

  const isAdmin = role === "ADMIN";

  const onAnyInteraction = () => {
    if (!startedTracking) {
      setStartedTracking(true);
      track("calculator_start", {
        pageVisited: surface === "public" ? "/offer-audit" : "/offer-valuation",
        metadata: { tool: "offer_valuation_engine" },
      });
      if (surface === "public") {
        fireOfferValuationConversion("offer_audit_started");
      }
    }
  };

  async function runAiSuggestion() {
    if (!offerName.trim() || description.trim().length < 20) {
      toast({
        title: "Add offer details first",
        description: "AI suggestions need an offer name and clear description.",
      });
      return;
    }
    onAnyInteraction();
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/offer-valuation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: selectedPersona,
          offerName,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI analysis failed");
      if (data.suggestedScores) {
        setScores(data.suggestedScores as OfferValueInputs);
      }
      toast({
        title: "AI suggestions applied",
        description:
          typeof data.summary === "string"
            ? data.summary
            : "Starting scores were generated from your offer description.",
      });
    } catch (error) {
      toast({
        title: "AI analysis failed",
        description: error instanceof Error ? error.message : "Try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function submitValuation(includeLeadCapture: boolean) {
    if (!offerName.trim() || description.trim().length < 20) {
      toast({
        title: "Offer details required",
        description: "Add a clear offer name and description before valuing.",
      });
      return;
    }
    onAnyInteraction();
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        persona: selectedPersona,
        offerName: offerName.trim(),
        description: description.trim(),
        scores,
        aiEnabled,
        attribution: {
          ...getAttributionSnapshot(),
          landing_page: surface === "public" ? "/offer-audit" : "/offer-valuation",
        },
      };
      if (includeLeadCapture) {
        payload.leadCapture = {
          name: leadCapture.name.trim(),
          email: leadCapture.email.trim(),
          businessType: leadCapture.businessType.trim() || undefined,
        };
      }
      const res = await fetch("/api/offer-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Valuation failed");

      if (data.gated) {
        setPendingPayload(payload);
        setShowLeadGate(true);
        setResult(null);
        return;
      }

      track("calculator_complete", {
        pageVisited: surface === "public" ? "/offer-audit" : "/offer-valuation",
        metadata: {
          tool: "offer_valuation_engine",
          scoreBand: data.scoreBand,
          finalScore: data.finalScore,
        },
      });
      setResult(data as OfferValuationApiResult);
      setShowLeadGate(false);
      setPendingPayload(null);
      toast({
        title: "Valuation complete",
        description: "Your offer diagnosis and strategic recommendations are ready.",
      });
    } catch (error) {
      toast({
        title: "Could not run valuation",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitLeadGate() {
    if (!leadCapture.name.trim() || !leadCapture.email.trim()) {
      toast({
        title: "Contact details required",
        description: "Please add your name and email to unlock full results.",
      });
      return;
    }
    if (!pendingPayload) {
      toast({
        title: "Session expired",
        description: "Please run the valuation again.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/offer-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingPayload,
          leadCapture: {
            name: leadCapture.name.trim(),
            email: leadCapture.email.trim(),
            businessType: leadCapture.businessType.trim() || undefined,
          },
          attribution: {
            ...((pendingPayload.attribution as Record<string, unknown>) || {}),
            ...getAttributionSnapshot(),
            landing_page: "/offer-audit",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      track("form_submit", {
        pageVisited: "/offer-audit",
        metadata: { form: "offer_audit_gate" },
      });
      track("calculator_complete", {
        pageVisited: "/offer-audit",
        metadata: {
          tool: "offer_valuation_engine",
          scoreBand: data.scoreBand,
          finalScore: data.finalScore,
        },
      });
      setResult(data as OfferValuationApiResult);
      setShowLeadGate(false);
      setPendingPayload(null);
      toast({
        title: "Results unlocked",
        description: "Your full offer audit is now available below.",
      });
    } catch (error) {
      toast({
        title: "Could not unlock results",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateSettings(
    patch: Partial<OfferValuationSettingsShape>,
    successLabel: string,
  ) {
    try {
      const res = await fetch("/api/offer-valuation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setSettings(data as OfferValuationSettingsShape);
      toast({ title: successLabel });
    } catch (error) {
      toast({
        title: "Settings update failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    }
  }

  if (settingsLoading || authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (surface === "internal" && !user) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            The internal Offer Valuation Engine requires authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth?redirect=/offer-valuation">Sign in to continue</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!canUse) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Offer valuation unavailable</CardTitle>
          <CardDescription>
            This mode is currently disabled for your access level.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Current mode: {modeText}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <p className="font-medium">Offer Valuation Engine</p>
          </div>
          <Badge variant="outline">{modeText}</Badge>
        </CardContent>
      </Card>

      {isAdmin && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mode and access controls</CardTitle>
            <CardDescription>
              Configure internal, client, lead-magnet, and future paid mode behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product mode</Label>
              <Select
                value={settings.accessMode}
                onValueChange={(v) =>
                  updateSettings(
                    { accessMode: v as OfferValuationMode },
                    "Mode updated",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_tool">Internal Tool</SelectItem>
                  <SelectItem value="client_tool">Client Tool</SelectItem>
                  <SelectItem value="lead_magnet">Lead Magnet</SelectItem>
                  <SelectItem value="paid_tool">Paid Tool (future)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Client access enabled</span>
                <Switch
                  checked={settings.clientAccessEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings(
                      { clientAccessEnabled: checked },
                      "Client access updated",
                    )
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Public access enabled</span>
                <Switch
                  checked={settings.publicAccessEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings(
                      { publicAccessEnabled: checked },
                      "Public access updated",
                    )
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Lead capture required</span>
                <Switch
                  checked={settings.requireLeadCapture}
                  onCheckedChange={(checked) =>
                    updateSettings(
                      { requireLeadCapture: checked },
                      "Lead capture requirement updated",
                    )
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Paid mode enabled</span>
                <Switch
                  checked={settings.paidModeEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings(
                      { paidModeEnabled: checked },
                      "Paid mode flag updated",
                    )
                  }
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Evaluate your offer</CardTitle>
          <CardDescription>
            Score your offer with the 100M value equation and unlock targeted fixes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select
                value={persona}
                onValueChange={(v) => {
                  onAnyInteraction();
                  setPersona(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONA_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {persona === "Custom" && (
              <div className="space-y-2">
                <Label htmlFor="customPersona">Custom persona</Label>
                <Input
                  id="customPersona"
                  value={customPersona}
                  onChange={(e) => {
                    onAnyInteraction();
                    setCustomPersona(e.target.value);
                  }}
                  placeholder="Example: Franchise owner with 3+ locations"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="offerName">Offer name</Label>
            <Input
              id="offerName"
              value={offerName}
              onChange={(e) => {
                onAnyInteraction();
                setOfferName(e.target.value);
              }}
              placeholder="Example: 90-Day Pipeline Rebuild"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offerDescription">Offer description</Label>
            <Textarea
              id="offerDescription"
              rows={5}
              value={description}
              onChange={(e) => {
                onAnyInteraction();
                setDescription(e.target.value);
              }}
              placeholder="Describe what the buyer gets, how fast, how it works, and what proof exists."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={aiEnabled}
                onCheckedChange={(checked) => {
                  onAnyInteraction();
                  setAiEnabled(checked);
                }}
              />
              <Label>Enable AI analysis</Label>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={runAiSuggestion}
              disabled={isAnalyzing || !aiEnabled}
              className="gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Suggest scores with AI
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreSlider
              id="dreamOutcome"
              label="Dream Outcome"
              value={scores.dreamOutcome}
              onChange={(v) => {
                onAnyInteraction();
                setScores((prev) => ({ ...prev, dreamOutcome: v }));
              }}
            />
            <ScoreSlider
              id="perceivedLikelihood"
              label="Perceived Likelihood"
              value={scores.perceivedLikelihood}
              onChange={(v) => {
                onAnyInteraction();
                setScores((prev) => ({ ...prev, perceivedLikelihood: v }));
              }}
            />
            <ScoreSlider
              id="timeDelay"
              label="Time Delay"
              value={scores.timeDelay}
              onChange={(v) => {
                onAnyInteraction();
                setScores((prev) => ({ ...prev, timeDelay: v }));
              }}
            />
            <ScoreSlider
              id="effortAndSacrifice"
              label="Effort & Sacrifice"
              value={scores.effortAndSacrifice}
              onChange={(v) => {
                onAnyInteraction();
                setScores((prev) => ({ ...prev, effortAndSacrifice: v }));
              }}
            />
          </div>

          <Button
            onClick={() => submitValuation(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running valuation...
              </>
            ) : (
              "Run valuation"
            )}
          </Button>

          {showLeadGate && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Unlock your full results
                </CardTitle>
                <CardDescription>
                  Share your contact details to view the complete diagnosis and
                  strategy output.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leadName">Name</Label>
                  <Input
                    id="leadName"
                    value={leadCapture.name}
                    onChange={(e) =>
                      setLeadCapture((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadEmail">Email</Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    value={leadCapture.email}
                    onChange={(e) =>
                      setLeadCapture((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="leadBusinessType">Business type (optional)</Label>
                  <Input
                    id="leadBusinessType"
                    value={leadCapture.businessType}
                    onChange={(e) =>
                      setLeadCapture((prev) => ({
                        ...prev,
                        businessType: e.target.value,
                      }))
                    }
                    placeholder="Example: Home services, SaaS, agency"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    onClick={submitLeadGate}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Unlock full results"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Offer valuation results
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant={scoreBandColor(result.scoreBand)}>
                {result.finalScore}/10
              </Badge>
              <span>{scoreBandMessage(result.scoreBand)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="font-semibold mb-2">1) Score breakdown</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(result.insights.scoreBreakdown).map(([k, v]) => (
                  <div key={k} className="rounded-md border p-3">
                    <p className="font-medium">
                      {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:{" "}
                      <span className="text-primary">{v.score}/10</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {v.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">2) Offer diagnosis</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-1">Strengths</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {result.insights.offerDiagnosis.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Weaknesses</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {result.insights.offerDiagnosis.weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">3) Strategic fixes</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {result.insights.strategicFixes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">4) Upgraded offer</h3>
              <p className="text-sm text-muted-foreground">
                {result.insights.upgradedOffer}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-medium mb-1">Suggested bonuses</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.insights.suggestedBonuses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Suggested guarantees</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.insights.suggestedGuarantees.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Positioning improvements</h4>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {result.insights.positioningImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <h4 className="font-medium mb-1">5) Monetization insight</h4>
              <p className="text-sm text-muted-foreground">
                {result.insights.monetizationInsight}
              </p>
            </div>

            {surface === "public" && (
              <div className="rounded-md border p-4">
                <p className="font-medium mb-2">Fix your offer with Ascendra</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Turn this diagnosis into a conversion-focused execution plan.
                </p>
                <Button asChild>
                  <Link
                    href={STRATEGY_CALL_PATH}
                    onClick={() => {
                      track("cta_click", {
                        pageVisited: "/offer-audit",
                        metadata: {
                          cta: "strategy_call",
                          tool: "offer_valuation_engine",
                        },
                      });
                      fireOfferValuationConversion("strategy_call_clicked");
                    }}
                  >
                    Book a strategy call
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

