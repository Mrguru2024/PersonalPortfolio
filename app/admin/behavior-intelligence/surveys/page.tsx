"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, Loader2, Settings2, Wrench } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useEffect, useMemo, useState } from "react";
import { visitorAliasFromSessionId } from "@/lib/behaviorVisitorAlias";
import { AdminDevOnly } from "@/components/admin/AdminDevOnly";
import { useToast } from "@/hooks/use-toast";

type SurveyRow = {
  id: number;
  question: string;
  triggerType: string;
  triggerConfigJson: Record<string, unknown> | null;
  active: boolean;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ResponseRow = {
  id: number;
  sessionId: string;
  response: string;
  createdAt: string;
};

const TRIGGERS = [
  { value: "time_based", label: "Time-based (after delay)" },
  { value: "scroll_based", label: "Scroll-based (depth)" },
  { value: "exit_intent", label: "Exit intent" },
  { value: "form_abandon", label: "Form abandon (idle)" },
] as const;

const RESPONSE_LIMITS = [50, 100, 200, 500] as const;

function readTriggerHints(cfg: Record<string, unknown> | null | undefined) {
  const c = cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
  return {
    delaySec:
      typeof (c as { delayMs?: unknown }).delayMs === "number" ?
        Math.max(3, (c as { delayMs: number }).delayMs / 1000)
      : 20,
    scrollPct:
      typeof (c as { scrollPercent?: unknown }).scrollPercent === "number" ?
        Math.max(5, (c as { scrollPercent: number }).scrollPercent)
      : 50,
    formIdleSec:
      typeof (c as { idleMs?: unknown }).idleMs === "number" ?
        Math.max(5, (c as { idleMs: number }).idleMs / 1000)
      : 30,
  };
}

function buildTriggerConfig(
  triggerType: string,
  delaySec: number,
  scrollPct: number,
  formIdleSec: number,
): Record<string, unknown> | null {
  if (triggerType === "time_based") {
    const delayMs = Math.min(600_000, Math.max(3_000, Math.round(delaySec * 1000)));
    return { delayMs };
  }
  if (triggerType === "scroll_based") {
    const scrollPercent = Math.min(95, Math.max(5, Math.round(scrollPct)));
    return { scrollPercent };
  }
  if (triggerType === "form_abandon") {
    const idleMs = Math.min(600_000, Math.max(5_000, Math.round(formIdleSec * 1000)));
    return { idleMs };
  }
  return null;
}

function exportSurveyResponsesCsv(survey: SurveyRow, rows: ResponseRow[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const head = ["response_id", "created_at", "visitor_label", "session_id", "response_text"];
  const lines = [
    head.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.createdAt,
        esc(visitorAliasFromSessionId(r.sessionId)),
        r.sessionId,
        esc(r.response),
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `survey-${survey.id}-responses.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function BehaviorSurveysPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [triggerType, setTriggerType] = useState<string>("time_based");
  const [newActive, setNewActive] = useState(true);
  const [newBusinessId, setNewBusinessId] = useState("");
  const [newDelaySec, setNewDelaySec] = useState(20);
  const [newScrollPct, setNewScrollPct] = useState(50);
  const [newFormIdleSec, setNewFormIdleSec] = useState(30);
  const [advOpen, setAdvOpen] = useState(false);

  const [expandedSurveyId, setExpandedSurveyId] = useState<number | null>(null);
  const [expandedTab, setExpandedTab] = useState<"builder" | "responses">("responses");
  const [responseLimit, setResponseLimit] = useState<number>(100);
  const [responseSearch, setResponseSearch] = useState("");

  const listQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/surveys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/surveys");
      return res.json() as Promise<SurveyRow[]>;
    },
  });

  const responsesQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/surveys", expandedSurveyId, "responses", responseLimit],
    queryFn: async () => {
      if (expandedSurveyId == null) return [];
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/surveys/${expandedSurveyId}/responses?limit=${responseLimit}`,
      );
      return res.json() as Promise<ResponseRow[]>;
    },
    enabled: expandedSurveyId != null && expandedTab === "responses",
  });

  const expandedSurvey = useMemo(
    () => listQuery.data?.find((s) => s.id === expandedSurveyId),
    [listQuery.data, expandedSurveyId],
  );

  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftTrigger, setDraftTrigger] = useState("time_based");
  const [draftActive, setDraftActive] = useState(true);
  const [draftBusinessId, setDraftBusinessId] = useState("");
  const [draftDelaySec, setDraftDelaySec] = useState(20);
  const [draftScrollPct, setDraftScrollPct] = useState(50);
  const [draftFormIdleSec, setDraftFormIdleSec] = useState(30);

  useEffect(() => {
    if (!expandedSurvey) return;
    const hints = readTriggerHints(expandedSurvey.triggerConfigJson);
    setDraftQuestion(expandedSurvey.question);
    setDraftTrigger(expandedSurvey.triggerType);
    setDraftActive(expandedSurvey.active);
    setDraftBusinessId(expandedSurvey.businessId ?? "");
    setDraftDelaySec(hints.delaySec);
    setDraftScrollPct(hints.scrollPct);
    setDraftFormIdleSec(hints.formIdleSec);
  }, [expandedSurvey]);

  const createMut = useMutation({
    mutationFn: async () => {
      const triggerConfigJson = buildTriggerConfig(triggerType, newDelaySec, newScrollPct, newFormIdleSec);
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/surveys", {
        question,
        triggerType,
        active: newActive,
        businessId: newBusinessId.trim() || null,
        triggerConfigJson,
      });
      return (await res.json()) as SurveyRow;
    },
    onSuccess: (row) => {
      setQuestion("");
      toast({ title: "Survey created", description: `Survey #${row.id} is ready to use.` });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/surveys"] });
      setExpandedSurveyId(row.id);
      setExpandedTab("builder");
    },
    onError: (e: Error) => toast({ title: "Could not create", description: e.message, variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: async (input: { id: number; body: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/admin/behavior-intelligence/surveys/${input.id}`, input.body);
      return (await res.json()) as SurveyRow;
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/surveys"] });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const onToggleActive = useCallback(
    (s: SurveyRow, next: boolean) => {
      patchMut.mutate({ id: s.id, body: { active: next } });
    },
    [patchMut],
  );

  const saveSurveyBuilder = useCallback(() => {
    if (!expandedSurveyId) return;
    const triggerConfigJson = buildTriggerConfig(draftTrigger, draftDelaySec, draftScrollPct, draftFormIdleSec);
    patchMut.mutate({
      id: expandedSurveyId,
      body: {
        question: draftQuestion.trim(),
        triggerType: draftTrigger,
        active: draftActive,
        businessId: draftBusinessId.trim() || null,
        triggerConfigJson,
      },
    });
  }, [
    draftActive,
    draftBusinessId,
    draftDelaySec,
    draftFormIdleSec,
    draftQuestion,
    draftScrollPct,
    draftTrigger,
    expandedSurveyId,
    patchMut,
  ]);

  const filteredResponses = useMemo(() => {
    const rows = responsesQuery.data ?? [];
    const q = responseSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.response.toLowerCase().includes(q) ||
        visitorAliasFromSessionId(r.sessionId).toLowerCase().includes(q) ||
        r.sessionId.toLowerCase().includes(q),
    );
  }, [responsesQuery.data, responseSearch]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Surveys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            In-product questions with client-side triggers. Tune timing and depth, then read responses here.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New survey</CardTitle>
          <CardDescription>
            Write a short question and choose when it may appear.
            <AdminDevOnly>
              <span className="block mt-1">
                Answers are stored via ingest payload key{" "}
                <code className="text-xs bg-muted px-1 rounded">surveyResponses</code> with <code className="text-xs bg-muted px-1 rounded">surveyId</code>.
              </span>
            </AdminDevOnly>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <Label htmlFor="bi-survey-q">Question</Label>
            <Textarea
              id="bi-survey-q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="What almost stopped you today?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Trigger type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6 sm:pt-8">
              <Switch id="new-survey-active" checked={newActive} onCheckedChange={setNewActive} />
              <Label htmlFor="new-survey-active" className="text-sm font-normal cursor-pointer">
                Active (eligible to show)
              </Label>
            </div>
          </div>

          <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="gap-2">
                {advOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Wrench className="h-4 w-4" />
                Advanced tools
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">
                Optional tuning stored with the survey. Your front-end should read these hints when deciding when to show the
                prompt (defaults are sensible if you do not wire them yet).
              </p>
              <div className="space-y-1">
                <Label htmlFor="new-biz-id">Workspace / business id (optional)</Label>
                <Input
                  id="new-biz-id"
                  value={newBusinessId}
                  onChange={(e) => setNewBusinessId(e.target.value)}
                  placeholder="e.g. multi-tenant key — leave blank for default"
                />
              </div>
              {triggerType === "time_based" ?
                <div className="space-y-1 max-w-xs">
                  <Label htmlFor="new-delay">Delay before prompt (seconds)</Label>
                  <Input
                    id="new-delay"
                    type="number"
                    min={3}
                    max={600}
                    value={newDelaySec}
                    onChange={(e) => setNewDelaySec(Number(e.target.value) || 3)}
                  />
                </div>
              : null}
              {triggerType === "scroll_based" ?
                <div className="space-y-1 max-w-xs">
                  <Label htmlFor="new-scroll">Scroll depth (% of page)</Label>
                  <Input
                    id="new-scroll"
                    type="number"
                    min={5}
                    max={95}
                    value={newScrollPct}
                    onChange={(e) => setNewScrollPct(Number(e.target.value) || 5)}
                  />
                </div>
              : null}
              {triggerType === "form_abandon" ?
                <div className="space-y-1 max-w-xs">
                  <Label htmlFor="new-idle">Idle before “abandon” (seconds)</Label>
                  <Input
                    id="new-idle"
                    type="number"
                    min={5}
                    max={600}
                    value={newFormIdleSec}
                    onChange={(e) => setNewFormIdleSec(Number(e.target.value) || 5)}
                  />
                </div>
              : null}
            </CollapsibleContent>
          </Collapsible>

          <Button type="button" disabled={!question.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ? "Saving…" : "Create survey"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey definitions</CardTitle>
          <CardDescription>Edit or pause surveys, export responses, and filter by keyword.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(listQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No surveys yet.</p>
          : <ul className="space-y-3 text-sm">
              {listQuery.data.map((s) => {
                const isOpen = expandedSurveyId === s.id;
                return (
                  <li key={s.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex flex-wrap gap-3 items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{s.id}</span>
                          <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                            {s.triggerType.replace(/_/g, " ")}
                          </span>
                          {s.active ?
                            <span className="text-xs text-green-600 dark:text-green-400">active</span>
                          : <span className="text-xs text-muted-foreground">paused</span>}
                        </div>
                        <p className="font-medium leading-snug">{s.question}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`survey-active-${s.id}`}
                            checked={s.active}
                            onCheckedChange={(c) => onToggleActive(s, c)}
                            disabled={patchMut.isPending}
                          />
                          <Label htmlFor={`survey-active-${s.id}`} className="text-xs cursor-pointer">
                            Active
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant={isOpen && expandedTab === "builder" ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setExpandedSurveyId(s.id);
                            setExpandedTab("builder");
                          }}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Builder
                        </Button>
                        <Button
                          type="button"
                          variant={isOpen && expandedTab === "responses" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setExpandedSurveyId(s.id);
                            setExpandedTab("responses");
                          }}
                        >
                          Responses
                        </Button>
                      </div>
                    </div>

                    {isOpen && expandedTab === "builder" ?
                      <div className="border-t pt-3 space-y-3 bg-muted/10 -mx-3 px-3 py-3 rounded-b-md">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Survey builder</h4>
                        <div className="space-y-1">
                          <Label htmlFor={`dq-${s.id}`}>Question</Label>
                          <Textarea id={`dq-${s.id}`} rows={3} value={draftQuestion} onChange={(e) => setDraftQuestion(e.target.value)} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Trigger</Label>
                            <Select value={draftTrigger} onValueChange={setDraftTrigger}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRIGGERS.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Switch id={`da-${s.id}`} checked={draftActive} onCheckedChange={setDraftActive} />
                            <Label htmlFor={`da-${s.id}`} className="text-sm font-normal cursor-pointer">
                              Active
                            </Label>
                          </div>
                        </div>
                        <div className="rounded-md border p-3 space-y-3">
                          <p className="text-xs font-medium text-muted-foreground">Trigger tuning</p>
                          <div className="space-y-1">
                            <Label htmlFor={`db-${s.id}`}>Workspace / business id (optional)</Label>
                            <Input id={`db-${s.id}`} value={draftBusinessId} onChange={(e) => setDraftBusinessId(e.target.value)} />
                          </div>
                          {draftTrigger === "time_based" ?
                            <div className="space-y-1 max-w-[200px]">
                              <Label>Delay (seconds)</Label>
                              <Input
                                type="number"
                                min={3}
                                max={600}
                                value={draftDelaySec}
                                onChange={(e) => setDraftDelaySec(Number(e.target.value) || 3)}
                              />
                            </div>
                          : null}
                          {draftTrigger === "scroll_based" ?
                            <div className="space-y-1 max-w-[200px]">
                              <Label>Scroll %</Label>
                              <Input
                                type="number"
                                min={5}
                                max={95}
                                value={draftScrollPct}
                                onChange={(e) => setDraftScrollPct(Number(e.target.value) || 5)}
                              />
                            </div>
                          : null}
                          {draftTrigger === "form_abandon" ?
                            <div className="space-y-1 max-w-[200px]">
                              <Label>Idle (seconds)</Label>
                              <Input
                                type="number"
                                min={5}
                                max={600}
                                value={draftFormIdleSec}
                                onChange={(e) => setDraftFormIdleSec(Number(e.target.value) || 5)}
                              />
                            </div>
                          : null}
                        </div>
                        <Button type="button" size="sm" disabled={!draftQuestion.trim() || patchMut.isPending} onClick={saveSurveyBuilder}>
                          {patchMut.isPending ? "Saving…" : "Save changes"}
                        </Button>
                        <AdminDevOnly>
                          <p className="text-[11px] text-muted-foreground font-mono break-all">
                            trigger_config_json: {JSON.stringify(expandedSurvey?.triggerConfigJson ?? {})}
                          </p>
                        </AdminDevOnly>
                      </div>
                    : null}

                    {isOpen && expandedTab === "responses" ?
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex flex-wrap gap-2 items-center">
                            <Label className="text-xs text-muted-foreground">Load</Label>
                            <Select
                              value={String(responseLimit)}
                              onValueChange={(v) => setResponseLimit(Number(v))}
                            >
                              <SelectTrigger className="h-8 w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESPONSE_LIMITS.map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n} rows
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className="h-8 max-w-[200px]"
                              placeholder="Search responses…"
                              value={responseSearch}
                              onChange={(e) => setResponseSearch(e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!(responsesQuery.data?.length)}
                            onClick={() => s && exportSurveyResponsesCsv(s, responsesQuery.data ?? [])}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export CSV
                          </Button>
                        </div>
                        {responsesQuery.isLoading ?
                          <Loader2 className="h-5 w-5 animate-spin" />
                        : !filteredResponses.length ?
                          <p className="text-xs text-muted-foreground">No matching responses.</p>
                        : <ul className="space-y-2 max-h-72 overflow-y-auto">
                            {filteredResponses.map((r) => (
                              <li key={r.id} className="text-xs border-b border-border/50 pb-2">
                                <p className="text-[11px] text-muted-foreground mb-0.5">
                                  <span className="font-medium text-foreground">
                                    {visitorAliasFromSessionId(r.sessionId)}
                                  </span>
                                  <span className="mx-1">·</span>
                                  {new Date(r.createdAt).toLocaleString()}
                                </p>
                                <p>{r.response}</p>
                              </li>
                            ))}
                          </ul>
                        }
                      </div>
                    : null}
                  </li>
                );
              })}
            </ul>
          }
        </CardContent>
      </Card>
    </div>
  );
}
