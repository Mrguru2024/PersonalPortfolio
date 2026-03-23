"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Copy,
  Download,
  Loader2,
  Save,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OfferValuationInsights } from "@shared/schema";

type Mode = "admin" | "client";

interface OfferValuationWorkspaceProps {
  mode: Mode;
}

interface AccessResponse {
  canAccess: boolean;
  isAdmin: boolean;
  makeAvailableToClient: boolean;
  visibility: string;
  clientExperienceMode: "free_tool" | "paid_product" | "included_service";
}

interface PersonaOption {
  id: string;
  displayName: string;
  segment: string | null;
  summary: string | null;
}

interface ValuationRow {
  id: number;
  userId: number;
  persona: string;
  offerName: string;
  description: string | null;
  dreamOutcomeScore: number;
  likelihoodScore: number;
  timeDelayScore: number;
  effortScore: number;
  finalScore: number;
  insights: OfferValuationInsights;
  createdAt: string;
  updatedAt: string;
}

interface CalculationResult {
  rawScore: number;
  finalScore: number;
  insights: OfferValuationInsights;
}

interface FormState {
  persona: string;
  offerName: string;
  description: string;
  dreamOutcomeScore: number;
  likelihoodScore: number;
  timeDelayScore: number;
  effortScore: number;
}

const DEFAULT_FORM: FormState = {
  persona: "",
  offerName: "",
  description: "",
  dreamOutcomeScore: 6,
  likelihoodScore: 6,
  timeDelayScore: 5,
  effortScore: 5,
};

const SCORE_FIELD_HINTS: Array<{
  key: keyof Pick<
    FormState,
    "dreamOutcomeScore" | "likelihoodScore" | "timeDelayScore" | "effortScore"
  >;
  label: string;
  help: string;
}> = [
  {
    key: "dreamOutcomeScore",
    label: "Dream Outcome",
    help: "How desirable and compelling the promised end result feels to the buyer.",
  },
  {
    key: "likelihoodScore",
    label: "Perceived Likelihood of Achievement",
    help: "How confident the buyer is that your process will actually deliver the result.",
  },
  {
    key: "timeDelayScore",
    label: "Time Delay",
    help: "How long it feels before the buyer gets a meaningful win.",
  },
  {
    key: "effortScore",
    label: "Effort & Sacrifice",
    help: "How much work, discipline, or behavior change the buyer thinks this requires.",
  },
];

const MODE_LABELS = {
  free_tool: "Free tool (lead magnet)",
  paid_product: "Paid product (offer audit)",
  included_service: "Included in service package",
} as const;

function scoreBadgeVariant(score: number): "destructive" | "secondary" | "default" {
  if (score < 5) return "destructive";
  if (score < 8) return "secondary";
  return "default";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function downloadJsonFile(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OfferValuationWorkspace({ mode }: OfferValuationWorkspaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdminMode = mode === "admin";
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<CalculationResult | null>(null);
  const [search, setSearch] = useState("");

  const accessQuery = useQuery<AccessResponse>({
    queryKey: ["/api/offer-valuation/access"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/offer-valuation/access");
      return res.json();
    },
  });

  const settingsQuery = useQuery<AccessResponse>({
    queryKey: ["/api/admin/offer-valuation/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-valuation/settings");
      return res.json();
    },
    enabled: isAdminMode,
  });

  const personasQuery = useQuery<{ personas: PersonaOption[] }>({
    queryKey: ["/api/offer-valuation/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/offer-valuation/personas");
      return res.json();
    },
    enabled: Boolean(accessQuery.data?.canAccess),
  });

  const valuationsQuery = useQuery<{ valuations: ValuationRow[] }>({
    queryKey: ["/api/offer-valuation/valuations", isAdminMode ? "all" : "mine"],
    queryFn: async () => {
      const url = isAdminMode
        ? "/api/offer-valuation/valuations?scope=all"
        : "/api/offer-valuation/valuations";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: Boolean(accessQuery.data?.canAccess),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: {
      makeAvailableToClient?: boolean;
      clientExperienceMode?: "free_tool" | "paid_product" | "included_service";
    }) => {
      const res = await apiRequest(
        "PATCH",
        "/api/admin/offer-valuation/settings",
        updates,
      );
      return res.json() as Promise<AccessResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/offer-valuation/settings"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/offer-valuation/access"] });
      toast({ title: "Offer Valuation settings saved" });
    },
    onError: (e: Error) => {
      toast({
        title: "Failed to save settings",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const res = await apiRequest("POST", "/api/offer-valuation/calculate", payload);
      return res.json() as Promise<CalculationResult>;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({ title: "Offer valuation analyzed" });
    },
    onError: (e: Error) => {
      toast({
        title: "Analysis failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      if (editingId) {
        const res = await apiRequest(
          "PATCH",
          `/api/offer-valuation/valuations/${editingId}`,
          payload,
        );
        return (await res.json()) as { valuation: ValuationRow };
      }
      const res = await apiRequest("POST", "/api/offer-valuation/valuations", payload);
      return (await res.json()) as { valuation: ValuationRow };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-valuation/valuations"] });
      setEditingId(data.valuation.id);
      setAnalysis({
        rawScore: data.valuation.finalScore,
        finalScore: data.valuation.finalScore,
        insights: data.valuation.insights,
      });
      toast({
        title: editingId ? "Valuation updated" : "Valuation saved",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/offer-valuation/valuations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-valuation/valuations"] });
      toast({ title: "Valuation deleted" });
    },
    onError: (e: Error) => {
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const valuations = valuationsQuery.data?.valuations ?? [];
  const personas = personasQuery.data?.personas ?? [];

  const filteredValuations = useMemo(() => {
    if (!search.trim()) return valuations;
    const q = search.toLowerCase();
    return valuations.filter(
      (v) =>
        v.offerName.toLowerCase().includes(q) || v.persona.toLowerCase().includes(q),
    );
  }, [search, valuations]);

  const runAnalyze = () => {
    if (!form.persona.trim() || !form.offerName.trim()) {
      toast({
        title: "Persona and offer name are required",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(form);
  };

  const runSave = () => {
    if (!form.persona.trim() || !form.offerName.trim()) {
      toast({
        title: "Persona and offer name are required",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(form);
  };

  const loadValuation = (row: ValuationRow) => {
    setEditingId(row.id);
    setForm({
      persona: row.persona,
      offerName: row.offerName,
      description: row.description ?? "",
      dreamOutcomeScore: row.dreamOutcomeScore,
      likelihoodScore: row.likelihoodScore,
      timeDelayScore: row.timeDelayScore,
      effortScore: row.effortScore,
    });
    setAnalysis({
      rawScore: row.finalScore,
      finalScore: row.finalScore,
      insights: row.insights,
    });
  };

  const cloneValuation = (row: ValuationRow) => {
    setEditingId(null);
    setForm({
      persona: row.persona,
      offerName: `${row.offerName} (Clone)`,
      description: row.description ?? "",
      dreamOutcomeScore: row.dreamOutcomeScore,
      likelihoodScore: row.likelihoodScore,
      timeDelayScore: row.timeDelayScore,
      effortScore: row.effortScore,
    });
    setAnalysis({
      rawScore: row.finalScore,
      finalScore: row.finalScore,
      insights: row.insights,
    });
    toast({ title: "Clone loaded. Save to create a new test." });
  };

  if (accessQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!accessQuery.data?.canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offer Valuation is not available</CardTitle>
          <CardDescription>
            This workspace is admin-controlled and is currently restricted.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const adminSettings = settingsQuery.data;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {isAdminMode && adminSettings ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Client access controls
              </CardTitle>
              <CardDescription>
                Admin controls whether clients can access this valuation workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Make valuation available to client</p>
                  <p className="text-sm text-muted-foreground">
                    When disabled, only admin users can run and view valuations.
                  </p>
                </div>
                <Switch
                  checked={adminSettings.makeAvailableToClient}
                  onCheckedChange={(v) =>
                    updateSettingsMutation.mutate({ makeAvailableToClient: v })
                  }
                  disabled={updateSettingsMutation.isPending}
                />
              </div>

              <div className="space-y-2 max-w-md">
                <Label>Client product mode</Label>
                <Select
                  value={adminSettings.clientExperienceMode}
                  onValueChange={(v) =>
                    updateSettingsMutation.mutate({
                      clientExperienceMode:
                        v as "free_tool" | "paid_product" | "included_service",
                    })
                  }
                  disabled={updateSettingsMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_tool">
                      {MODE_LABELS.free_tool}
                    </SelectItem>
                    <SelectItem value="paid_product">
                      {MODE_LABELS.paid_product}
                    </SelectItem>
                    <SelectItem value="included_service">
                      {MODE_LABELS.included_service}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current visibility:{" "}
                  <span className="font-medium">{adminSettings.visibility}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Offer Valuation</CardTitle>
            <CardDescription>
              Value = (Dream Outcome × Likelihood) / (Time Delay × Effort &
              Sacrifice), normalized to a 0–10 score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <h3 className="font-semibold text-base">1) Inputs</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Persona selector</Label>
                  <Select
                    value={personas.some((p) => p.displayName === form.persona) ? form.persona : "__custom__"}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setForm((prev) => ({ ...prev, persona: "" }));
                        return;
                      }
                      setForm((prev) => ({ ...prev, persona: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((p) => (
                        <SelectItem key={p.id} value={p.displayName}>
                          {p.displayName}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom persona</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Persona (editable)</Label>
                  <Input
                    placeholder="e.g. Owner-operator with small team"
                    value={form.persona}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, persona: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Offer name</Label>
                <Input
                  placeholder="e.g. Growth Sprint Program"
                  value={form.offerName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, offerName: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Offer description</Label>
                <Textarea
                  placeholder="Describe your offer, delivery model, timeline, and key outcomes."
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="font-semibold text-base">2) Value equation inputs (1–10)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {SCORE_FIELD_HINTS.map((field) => (
                  <div key={field.key} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-medium">{field.label}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">
                            Help
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          {field.help}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[form[field.key]]}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, [field.key]: value[0] }))
                        }
                      />
                      <Badge variant="secondary" className="min-w-10 justify-center">
                        {form[field.key]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="font-semibold text-base">3) Auto calculation engine</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={runAnalyze}
                  disabled={analyzeMutation.isPending || saveMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  Analyze
                </Button>
                <Button
                  variant="secondary"
                  onClick={runSave}
                  disabled={saveMutation.isPending || analyzeMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Update valuation" : "Save valuation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(DEFAULT_FORM);
                    setAnalysis(null);
                  }}
                >
                  New test
                </Button>
                {analysis ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      downloadJsonFile(
                        `${form.offerName || "offer"}-valuation.json`,
                        {
                          form,
                          analysis,
                          generatedAt: new Date().toISOString(),
                        },
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                ) : null}
              </div>

              {analysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Offer diagnosis result
                    </CardTitle>
                    <CardDescription>{analysis.insights.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={scoreBadgeVariant(analysis.finalScore)}>
                        Final Score: {analysis.finalScore.toFixed(2)} / 10
                      </Badge>
                      <Badge variant="outline">
                        Band: {analysis.insights.band.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Strengths</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                          {analysis.insights.strengths.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Weaknesses</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                          {analysis.insights.weaknesses.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Strategic recommendations</h4>
                      <div className="space-y-3">
                        {analysis.insights.strategicRecommendations.map((rec, idx) => (
                          <div key={idx} className="rounded-md border p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-medium text-sm">{rec.title}</p>
                              <Badge variant="outline">{rec.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border p-4 space-y-3">
                      <h4 className="font-medium">Offer upgrade suggestions</h4>
                      <p className="text-sm">
                        <span className="font-medium">New positioning statement:</span>{" "}
                        {analysis.insights.upgradeSuggestions.positioningStatement}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Improved offer wording:</span>{" "}
                        {analysis.insights.upgradeSuggestions.improvedOfferWording}
                      </p>
                      <div>
                        <p className="text-sm font-medium">Suggested bonuses:</p>
                        <ul className="list-disc ml-4 text-sm text-muted-foreground">
                          {analysis.insights.upgradeSuggestions.suggestedBonuses.map(
                            (bonus, idx) => (
                              <li key={idx}>{bonus}</li>
                            ),
                          )}
                        </ul>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Suggested guarantee:</span>{" "}
                        {analysis.insights.upgradeSuggestions.suggestedGuarantee}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved valuations</CardTitle>
            <CardDescription>
              Edit past runs, clone an offer test, and export results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Input
                placeholder="Search by offer or persona"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {valuationsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredValuations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved valuations yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredValuations.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.offerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Persona: {row.persona}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {formatDate(row.createdAt)}
                        </p>
                      </div>
                      <Badge variant={scoreBadgeVariant(row.finalScore)}>
                        {row.finalScore.toFixed(2)} / 10
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadValuation(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cloneValuation(row)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadJsonFile(
                            `${row.offerName}-valuation-${row.id}.json`,
                            row,
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(row.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
