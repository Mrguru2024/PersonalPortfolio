"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

type SurveyRow = {
  id: number;
  question: string;
  triggerType: string;
  active: boolean;
  businessId: string | null;
  createdAt: string;
};

type ResponseRow = {
  id: number;
  sessionId: string;
  response: string;
  createdAt: string;
};

const TRIGGERS = [
  { value: "time_based", label: "Time-based" },
  { value: "scroll_based", label: "Scroll-based" },
  { value: "exit_intent", label: "Exit intent" },
  { value: "form_abandon", label: "Form abandon" },
];

export default function BehaviorSurveysPage() {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [triggerType, setTriggerType] = useState("time_based");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const listQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/surveys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/surveys");
      return res.json() as Promise<SurveyRow[]>;
    },
  });

  const responsesQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/surveys", expandedId, "responses"],
    queryFn: async () => {
      if (expandedId == null) return [];
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/surveys/${expandedId}/responses?limit=200`,
      );
      return res.json() as Promise<ResponseRow[]>;
    },
    enabled: expandedId != null,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/surveys", {
        question,
        triggerType,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setQuestion("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/surveys"] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Surveys</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New survey</CardTitle>
          <p className="text-sm text-muted-foreground">
            Trigger logic runs in your client bundle (not shipped to unrelated tenants). Post answers with{" "}
            <code className="text-xs bg-muted px-1 rounded">surveyResponses</code> on ingest using the survey id below.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-w-lg">
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
          <Button type="button" disabled={!question.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ? "Saving…" : "Create survey"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Definitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(listQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No surveys yet.</p>
          : <ul className="space-y-2 text-sm">
              {listQuery.data.map((s) => (
                <li key={s.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground">#{s.id}</span>
                    <span className="text-xs uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">{s.triggerType}</span>
                    {s.active ?
                      <span className="text-xs text-green-600 dark:text-green-400">active</span>
                    : <span className="text-xs text-muted-foreground">inactive</span>}
                  </div>
                  <p>{s.question}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {expandedId === s.id ? "Hide responses" : "View responses"}
                  </Button>
                  {expandedId === s.id ?
                    <div className="border-t pt-2 mt-2 space-y-2">
                      {responsesQuery.isLoading ?
                        <Loader2 className="h-5 w-5 animate-spin" />
                      : !(responsesQuery.data?.length) ?
                        <p className="text-xs text-muted-foreground">No responses.</p>
                      : <ul className="space-y-1 max-h-48 overflow-y-auto">
                          {responsesQuery.data.map((r) => (
                            <li key={r.id} className="text-xs border-b border-border/50 pb-1">
                              <span className="font-mono text-[10px] text-muted-foreground">{r.sessionId}</span>
                              <p>{r.response}</p>
                            </li>
                          ))}
                        </ul>
                      }
                    </div>
                  : null}
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>
    </div>
  );
}
