"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Activity, ArrowRight, Layers, LineChart, Sparkles } from "lucide-react";
import type { ClientGrowthSnapshot, GrowthLineItem } from "@shared/clientGrowthSnapshot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function lineStatusVariant(s: GrowthLineItem["status"]): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "done":
    case "active":
      return "default";
    case "in_progress":
      return "secondary";
    case "pending":
      return "outline";
    default:
      return "outline";
  }
}

function stepLabel(state: string): string {
  if (state === "locked") return "Locked";
  if (state === "complete") return "Complete";
  if (state === "active") return "Active";
  if (state === "in_progress") return "In progress";
  if (state === "not_started") return "Not started";
  if (state === "optimizing") return "Optimizing";
  return state;
}

export interface GrowthSnapshotViewProps {
  snapshot: ClientGrowthSnapshot;
}

export function GrowthSnapshotView({ snapshot }: GrowthSnapshotViewProps) {
  const { step, diagnose, build, scale, activity } = snapshot;
  const health = diagnose.healthScore0to100;

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      <header className="space-y-2">
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{snapshot.growthStatusLine}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{snapshot.businessLabel}</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">{diagnose.statusSummary}</p>
      </header>

      {/* Step tracker */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
            Your path
          </CardTitle>
          <CardDescription>Diagnose → Build → Scale</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { n: 1 as const, title: "Diagnose", state: step.diagnose },
              { n: 2 as const, title: "Build", state: step.build },
              { n: 3 as const, title: "Scale", state: step.scale },
            ].map(({ n, title, state }) => (
              <li
                key={n}
                className={`rounded-lg border p-3 sm:p-4 transition-colors ${
                  step.current === n ?
                    "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
                  : "border-border/80 bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold">
                    {n}. {title}
                  </span>
                  <Badge variant={step.current === n ? "default" : "secondary"} className="text-xs shrink-0">
                    {stepLabel(state)}
                  </Badge>
                </div>
                {step.current === n && <p className="text-xs text-muted-foreground">You are here</p>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Diagnose */}
      <section id="diagnose" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-teal-600 shrink-0" aria-hidden />
          <h2 className="text-lg sm:text-xl font-semibold">Diagnose</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {health != null ?
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Business health (blended)</span>
                  <span className="font-medium">{health}/100</span>
                </div>
                <Progress value={health} className="h-2" />
              </div>
            : null}
            <div>
              <p className="text-sm font-medium text-destructive/90 dark:text-destructive">Primary focus</p>
              <p className="text-sm text-muted-foreground mt-1">{diagnose.primaryIssue}</p>
            </div>
            <p className="text-sm text-muted-foreground border-l-2 border-amber-500/50 pl-3">{diagnose.missedOpportunityHint}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {(
                [
                  ["Market", diagnose.market],
                  ["Website & funnel", diagnose.website],
                  ["Offer", diagnose.offer],
                ] as const
              ).map(([label, band]) => (
                <div key={label} className="rounded-lg border bg-card/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold mt-1">{band.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{band.summary}</p>
                </div>
              ))}
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={diagnose.nextCta.href}>
                {diagnose.nextCta.label}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Build */}
      <section id="build" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 shrink-0" aria-hidden />
          <h2 className="text-lg sm:text-xl font-semibold">Build</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <p className="text-sm text-muted-foreground">{build.activationSummary}</p>
            <LineItemBlock title="Funnel" items={build.funnel} />
            <LineItemBlock title="Messaging" items={build.messaging} />
            <LineItemBlock title="Capture" items={build.capture} />
            <LineItemBlock title="Follow-up" items={build.followUp} />
            <Button variant="secondary" asChild className="w-full sm:w-auto">
              <Link href={build.nextCta.href}>
                {build.nextCta.label}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Scale */}
      <section id="scale" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
          <h2 className="text-lg sm:text-xl font-semibold">Scale</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Metric label="Leads (est. week)" value={scale.leadsThisWeekApprox} />
              <Metric label="Bookings tracked" value={scale.bookingsCount} />
              <div className="rounded-lg border bg-card/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Top channel signal</p>
                <p className="text-sm font-semibold mt-1">{scale.topChannelLabel ?? "—"}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{scale.trendHint}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {scale.improvementBullets.map((t, idx) => (
                <li key={`${idx}-${t.slice(0, 40)}`}>{t}</li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full sm:w-auto border-emerald-500/40">
              <Link href={scale.nextCta.href}>{scale.nextCta.label}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Activity */}
      {activity.length > 0 ?
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {activity.map((row, i) => (
                  <li key={`${row.at}-${row.kind}-${i}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{row.kind.replace(/_/g, " ")}</p>
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {format(new Date(row.at), "MMM d, yyyy · p")}
                    </time>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      : null}
    </div>
  );
}

function LineItemBlock({ title, items }: { title: string; items: GrowthLineItem[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={lineStatusVariant(item.status)} className="text-[10px] uppercase">
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            {item.detail ?
              <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
            : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1 tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
