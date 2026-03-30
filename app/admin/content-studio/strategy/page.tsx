"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import type { ContentStrategyWorkflowConfig } from "@shared/contentStrategyWorkflowConfig";
import type { EditorialStrategyMeta } from "@shared/editorialStrategyMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentStrategyBriefPanel } from "@/components/content-studio/ContentStrategyBriefPanel";
import { Loader2, BookOpen, CalendarDays, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function stripMdBold(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

function briefToMarkdown(workflow: ContentStrategyWorkflowConfig | null, m: EditorialStrategyMeta): string {
  const pillar =
    workflow?.pillars.find((p) => p.id === m.contentPillarId)?.label ?? m.contentPillarId ?? "—";
  const fmt = workflow?.contentFormats.find((f) => f.id === m.contentFormat)?.label ?? m.contentFormat ?? "—";
  const rep =
    (m.repurposeTargets ?? [])
      .map((id) => workflow?.repurposeChannels.find((c) => c.id === id)?.label ?? id)
      .join(", ") || "—";
  return [
    "## Editorial brief (draft)",
    "",
    `- **Pillar:** ${pillar}`,
    `- **Search intent:** ${m.searchIntent ?? "—"}`,
    `- **Primary keyword:** ${m.primaryKeyword?.trim() || "—"}`,
    `- **Format:** ${fmt}`,
    `- **Lifecycle:** ${m.lifecycle ?? "—"}`,
    `- **Success KPI:** ${m.successKpi?.trim() || "—"}`,
    `- **Hook / angle:** ${m.hookAngle?.trim() || "—"}`,
    `- **Repurpose:** ${rep}`,
    "",
    m.internalNotes?.trim() ? `**Notes:** ${m.internalNotes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ContentStudioStrategyPage() {
  const { toast } = useToast();
  const [brief, setBrief] = useState<EditorialStrategyMeta>({});
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/content-studio/strategy-workflow"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content-studio/strategy-workflow", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load strategy");
      return res.json() as Promise<{ config: ContentStrategyWorkflowConfig }>;
    },
  });

  const cfg = data?.config ?? null;

  const markdown = useMemo(() => briefToMarkdown(cfg, brief), [cfg, brief]);

  const copyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast({ title: "Copied briefing to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [markdown, toast]);

  const pdfHref = cfg?.sourceDocument.publicPath ?? "/Content%20Strategy%20Online.pdf";

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight">Editorial content strategy</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
          Pillars, journey framing, and pro checklists align with how senior content managers plan work. Use the{" "}
          <strong className="text-foreground">brief panel</strong> to draft a slot, then paste into docs or attach fields on{" "}
          <Link href="/admin/content-studio/calendar" className="underline font-medium text-foreground">
            Calendar
          </Link>{" "}
          (each row has an optional strategy brief—same fields, stored as <code className="text-xs">strategy_meta</code>
          ).
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" size="sm" asChild>
            <a href={pdfHref} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4 mr-2" />
              Open reference PDF
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/content-studio/calendar">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interactive brief builder</CardTitle>
            <CardDescription>
              Fill the panel, then copy Markdown for writers, clients, or the document editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ContentStrategyBriefPanel value={brief} onChange={setBrief} workflow={cfg} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => void copyMd()}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy Markdown"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setBrief({})}>
                Clear
              </Button>
            </div>
            <pre className="text-[11px] leading-relaxed rounded-md border bg-muted/40 p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {markdown}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pillars &amp; mix</CardTitle>
            <CardDescription>{cfg?.pillarFunnelBridge.join(" ") ?? ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {(cfg?.pillars ?? []).map((p) => (
                <li key={p.id} className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
                  <div className="font-medium">{p.label}</div>
                  <p className="text-xs text-muted-foreground mt-1">{p.objective}</p>
                  {p.exampleAngles?.length ? (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Angles: {p.exampleAngles.join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channel mix</h3>
              <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {(cfg?.channelMixGuidance ?? []).map((line) => (
                  <li key={line.slice(0, 48)}>{stripMdBold(line)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Journey stages &amp; pro checklists</CardTitle>
          <CardDescription>
            Map content to buyer motion; use checklists before marking slots “ready to post.”
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {(cfg?.journeyStages ?? []).map((j) => (
              <div key={j.stage} className="rounded-lg border p-3 text-sm">
                <div className="font-semibold">{j.stage}</div>
                <p className="text-xs text-muted-foreground mt-1">{j.contentJob}</p>
              </div>
            ))}
          </div>
          <Tabs defaultValue="pre">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pre" className="text-xs">
                Pre-publish
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs">
                SEO
              </TabsTrigger>
              <TabsTrigger value="rep" className="text-xs">
                Repurposing
              </TabsTrigger>
              <TabsTrigger value="gov" className="text-xs">
                Governance
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pre" className="mt-3">
              <ul className="list-disc pl-5 text-sm space-y-1">
                {cfg?.proChecklists.prePublish.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="seo" className="mt-3">
              <ul className="list-disc pl-5 text-sm space-y-1">
                {cfg?.proChecklists.seoAndDiscoverability.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="rep" className="mt-3">
              <ul className="list-disc pl-5 text-sm space-y-1">
                {cfg?.proChecklists.repurposing.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="gov" className="mt-3">
              <ul className="list-disc pl-5 text-sm space-y-1">
                {cfg?.proChecklists.governance.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
