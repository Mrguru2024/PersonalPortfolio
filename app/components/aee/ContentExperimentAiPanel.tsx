"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Channel = "web" | "newsletter" | "social" | "paid" | "mixed";

type ContentAiInsightsPayload = {
  executiveSummary: string;
  insights: Array<{ title: string; detail: string; confidence?: "high" | "medium" | "low" }>;
  recommendedContentChanges: Array<{ surface: string; action: string; rationale: string }>;
  nextMeasurementSteps: string[];
  caveats: string[];
};

export interface ContentExperimentAiPanelProps {
  experimentId: string;
  defaultGoal?: string | null;
  className?: string;
}

export function ContentExperimentAiPanel({
  experimentId,
  defaultGoal,
  className,
}: ContentExperimentAiPanelProps) {
  const [goal, setGoal] = useState(defaultGoal?.trim() || "");
  const [primaryChannel, setPrimaryChannel] = useState<Channel>("mixed");
  const [openRatePct, setOpenRatePct] = useState("");
  const [clickRatePct, setClickRatePct] = useState("");
  const [sendCount, setSendCount] = useState("");
  const [channelNotes, setChannelNotes] = useState("");
  const [result, setResult] = useState<ContentAiInsightsPayload | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const openN = openRatePct.trim() === "" ? undefined : Number.parseFloat(openRatePct);
      const clickN = clickRatePct.trim() === "" ? undefined : Number.parseFloat(clickRatePct);
      const sendsN = sendCount.trim() === "" ? undefined : Number.parseInt(sendCount, 10);

      const channelMetrics =
        openN !== undefined ||
        clickN !== undefined ||
        (sendsN !== undefined && Number.isFinite(sendsN)) ||
        channelNotes.trim()
          ? {
              ...(openN !== undefined && Number.isFinite(openN) ? { openRate: openN / 100 } : {}),
              ...(clickN !== undefined && Number.isFinite(clickN) ? { clickRate: clickN / 100 } : {}),
              ...(sendsN !== undefined && Number.isFinite(sendsN) ? { sendCount: sendsN } : {}),
              ...(channelNotes.trim() ? { notes: channelNotes.trim() } : {}),
            }
          : undefined;

      const res = await apiRequest(
        "POST",
        `/api/admin/experiments/${experimentId}/content-ai-insights`,
        {
          goal: goal.trim() || undefined,
          primaryChannel: primaryChannel === "mixed" ? undefined : primaryChannel,
          channelMetrics,
        },
      );
      const data = (await res.json()) as { insights: ContentAiInsightsPayload };
      return data.insights;
    },
    onSuccess: (data) => setResult(data),
  });

  const confidenceBadge = (c?: string) => {
    if (c === "high") return <Badge variant="default">High confidence</Badge>;
    if (c === "low") return <Badge variant="secondary">Low confidence</Badge>;
    if (c === "medium") return <Badge variant="outline">Medium</Badge>;
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Content & campaign AI insights
        </CardTitle>
        <CardDescription>
          Summaries use this experiment&apos;s rollups and your goal. Optional email metrics refine newsletter-oriented
          tests. Same data as the table below — the model does not invent traffic. Update copy in{" "}
          <Link href="/admin/newsletters" className="underline underline-offset-2 hover:text-foreground">
            Newsletters
          </Link>
          ,{" "}
          <Link href="/admin/content-studio" className="underline underline-offset-2 hover:text-foreground">
            Content Studio
          </Link>
          , or run another variant in{" "}
          <Link href="/admin/experiments" className="underline underline-offset-2 hover:text-foreground">
            Experiments
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exp-ai-goal">Primary goal (optional)</Label>
          <Textarea
            id="exp-ai-goal"
            placeholder="e.g. More booked demos from this landing page variant; higher reply rate on nurture."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            className="resize-y min-h-[72px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Primary surface</Label>
          <Select value={primaryChannel} onValueChange={(v) => setPrimaryChannel(v as Channel)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixed / not sure</SelectItem>
              <SelectItem value="web">Web / landing</SelectItem>
              <SelectItem value="newsletter">Newsletter / email</SelectItem>
              <SelectItem value="social">Social organic</SelectItem>
              <SelectItem value="paid">Paid ads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <details className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">Optional email metrics (this send or cohort)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="exp-ai-open">Open rate %</Label>
              <Input
                id="exp-ai-open"
                type="number"
                step="0.01"
                placeholder="e.g. 42"
                value={openRatePct}
                onChange={(e) => setOpenRatePct(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-ai-click">Click rate %</Label>
              <Input
                id="exp-ai-click"
                type="number"
                step="0.01"
                placeholder="e.g. 3.5"
                value={clickRatePct}
                onChange={(e) => setClickRatePct(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-ai-sends">Send count</Label>
              <Input
                id="exp-ai-sends"
                type="number"
                min={0}
                placeholder="Recipients"
                value={sendCount}
                onChange={(e) => setSendCount(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <Label htmlFor="exp-ai-notes">Notes</Label>
            <Input
              id="exp-ai-notes"
              placeholder="Subject line tested, list segment, etc."
              value={channelNotes}
              onChange={(e) => setChannelNotes(e.target.value)}
            />
          </div>
        </details>

        <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate insights
            </>
          )}
        </Button>

        {mutation.isError ? (
          <p className="text-sm text-destructive">
            {mutation.error instanceof Error ? mutation.error.message : "Request failed"}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-4 pt-2 border-t">
            <div>
              <h4 className="text-sm font-medium mb-1">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.executiveSummary}</p>
            </div>

            {result.insights.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Insights</h4>
                <ul className="space-y-2 text-sm">
                  {result.insights.map((ins, i) => (
                    <li key={i} className="rounded-md border p-3 bg-card">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">{ins.title}</span>
                        {confidenceBadge(ins.confidence)}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{ins.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.recommendedContentChanges.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested content actions</h4>
                <ul className="space-y-2 text-sm">
                  {result.recommendedContentChanges.map((r, i) => (
                    <li key={i} className="rounded-md border p-3">
                      <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{r.surface}</p>
                      <p className="mt-1">{r.action}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{r.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.nextMeasurementSteps.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-1">Next measurements</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.nextMeasurementSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.caveats.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-1">Caveats</h4>
                <ul className="list-disc pl-5 text-sm text-amber-700 dark:text-amber-400/90 space-y-1">
                  {result.caveats.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
