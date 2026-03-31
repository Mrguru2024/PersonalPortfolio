"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClientConversionDiagnostics } from "@shared/conversionDiagnosticsTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  LineChart,
  MessageSquareQuote,
  MousePointerClick,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Gauge,
} from "lucide-react";

function pageStatusStyle(status: string): string {
  switch (status) {
    case "strong":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "attention":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "dropoff":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "improving":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function priorityStyle(p: string): "destructive" | "default" | "secondary" {
  if (p === "high") return "destructive";
  if (p === "medium") return "default";
  return "secondary";
}

export interface ConversionDiagnosticsClientProps {
  readonly data: ClientConversionDiagnostics;
}

export function ConversionDiagnosticsClient({ data }: ConversionDiagnosticsClientProps) {
  const isPreview = data.mode === "preview_empty";

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Conversion Diagnostics</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{data.headline}</h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">{data.clientSubtitle}</p>
            <p className="text-sm text-muted-foreground">{data.subhead}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1 shrink-0">
            <p>
              Last updated{" "}
              <time dateTime={data.lastUpdatedIso}>
                {new Date(data.lastUpdatedIso).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </p>
            <p>
              Window: {data.periodDays} days · since {new Date(data.sinceIso).toLocaleDateString()}
            </p>
          </div>
        </div>
        {isPreview ?
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-4 text-sm text-muted-foreground">
              As traffic links to your CRM profile, this dashboard fills in with real visitor stories — no training
              required. Your Ascendra team sees full operational tools in{" "}
              <Link href="/admin/behavior-intelligence" className="text-primary underline-offset-2 hover:underline">
                Growth Intelligence
              </Link>
              .
            </CardContent>
          </Card>
        : null}
      </header>

      {/* K3 Executive summary */}
      <section aria-labelledby="exec-metrics">
        <h2 id="exec-metrics" className="sr-only">
          Executive summary metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {data.executiveMetrics.map((m) => (
            <Card key={m.id} className="shadow-sm border-border/80">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{m.value}</p>
                {m.deltaLabel ?
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{m.deltaLabel}</p>
                : null}
                {m.sublabel ?
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{m.sublabel}</p>
                : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {data.phase2 ?
        <section className="space-y-4" aria-labelledby="phase2-revenue">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h2 id="phase2-revenue" className="text-lg font-semibold tracking-tight">
              Revenue &amp; growth health
            </h2>
          </div>
          <Card className="border-emerald-500/20 bg-emerald-500/[0.04]">
            <CardContent className="pt-6 space-y-3 text-sm">
              <p className="text-2xl font-semibold tabular-nums">{data.phase2.revenueSummary.totalAttributedDisplay}</p>
              <p className="text-muted-foreground">{data.phase2.revenueSummary.periodNote}</p>
              {data.phase2.revenueSummary.stripeLinkedNote ?
                <p className="text-xs text-muted-foreground">{data.phase2.revenueSummary.stripeLinkedNote}</p>
              : null}
              {data.phase2.roiHint ?
                <p className="text-sm text-foreground/90 border-t border-border/60 pt-3">{data.phase2.roiHint}</p>
              : null}
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Conversion health", v: data.phase2.growthScores.conversionHealth, icon: Gauge },
              { label: "Traffic quality", v: data.phase2.growthScores.trafficQuality, icon: BarChart3 },
              { label: "Funnel efficiency", v: data.phase2.growthScores.funnelEfficiency, icon: LineChart },
            ].map(({ label, v, icon: Icon }) => (
              <Card key={label}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Icon className="h-3 w-3" aria-hidden />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-semibold tabular-nums">{v}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Score 0–100 (heuristic)</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              {data.phase2.growthScores.hints.map((h) => (
                <p key={h}>• {h}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Forward-looking nudges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {data.phase2.predictiveNudges.map((n) => (
                <p key={n}>• {n}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-2">Benchmark snapshot</p>
              <p>{data.phase2.benchmarkSnapshot}</p>
              {data.phase2.personaInsight ?
                <p className="mt-3 border-t border-border/60 pt-3">{data.phase2.personaInsight}</p>
              : null}
              {data.phase2.offerInsight ?
                <p className="mt-2">{data.phase2.offerInsight}</p>
              : null}
            </CardContent>
          </Card>
        </section>
      : null}

      {/* K4 Snapshot */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">This period’s conversion snapshot</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "What’s working", body: data.conversionSnapshot.working, icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-400" },
            { title: "What needs attention", body: data.conversionSnapshot.attention, icon: AlertTriangle, tone: "text-amber-700 dark:text-amber-400" },
            { title: "Biggest opportunity", body: data.conversionSnapshot.opportunity, icon: Target, tone: "text-primary" },
            { title: "Recent movement", body: data.conversionSnapshot.movement, icon: TrendingUp, tone: "text-muted-foreground" },
          ].map(({ title, body, icon: Icon, tone }) => (
            <Card key={title} className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", tone)} />
                  <span>{title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trends K15 */}
      {data.trends.length > 1 ?
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Trend reporting</h2>
          </div>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Sessions &amp; interactions over time</CardTitle>
              <CardDescription>Calm view of volume — your strategist pairs this with qualitative replay review.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="cdSess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="hsl(var(--primary))"
                    fill="url(#cdSess)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    name="Interactions"
                    stroke="hsl(var(--muted-foreground))"
                    fill="transparent"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      : null}

      {/* K5 Traffic */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Traffic overview</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Where visitors came from</CardTitle>
              <CardDescription>Uses campaign parameters when your links include them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.trafficSources.length === 0 ?
                <p className="text-sm text-muted-foreground">Source data will appear as UTM-tagged sessions link to your profile.</p>
              : data.trafficSources.map((s) => (
                  <div key={s.label} className="flex justify-between gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{s.label}</p>
                      {s.note ?
                        <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>
                      : null}
                    </div>
                    <span className="tabular-nums text-muted-foreground">{s.sessions}</span>
                  </div>
                ))
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick traffic snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.trafficOverview.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium tabular-nums">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* K6 Behavior */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Visitor behavior highlights</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.behaviorHighlights.map((s) => (
              <p key={s}>• {s}</p>
            ))}
            <Separator className="my-2" />
            <p className="text-sm font-medium text-foreground">{data.intentSummary}</p>
          </CardContent>
        </Card>
      </section>

      {/* K7 Pages */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Page performance</h2>
        {data.pagePerformance.length === 0 ?
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground text-center">
              Page-level stories appear when enough path data exists for your linked sessions.
            </CardContent>
          </Card>
        : <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Page</th>
                    <th className="px-4 py-3 font-medium">Visitors</th>
                    <th className="px-4 py-3 font-medium">Engagement</th>
                    <th className="px-4 py-3 font-medium">Conversions</th>
                    <th className="px-4 py-3 font-medium">Friction</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pagePerformance.map((p) => (
                    <tr key={p.path} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">{p.path}</td>
                      <td className="px-4 py-3 tabular-nums">{p.visitors}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.engagementLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.conversionsLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.frictionLabel}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px] capitalize", pageStatusStyle(p.status))}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        }
      </section>

      {/* K8 CTA / forms */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">CTA &amp; form performance</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {data.formFunnelHints.map((f) => (
            <Card key={f.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{f.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">{f.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* K9 Friction */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Friction points</h2>
        </div>
        {data.frictionPoints.length === 0 ?
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground text-center">
              Great news — we’re not seeing high-priority friction rollups for your linked traffic in this window.
            </CardContent>
          </Card>
        : <div className="grid gap-4">
            {data.frictionPoints.map((f, i) => (
              <Card key={`${f.affectedArea}-${i}`} className="border-amber-500/15">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={priorityStyle(f.priority)} className="capitalize">
                      {f.priority === "high" ? "High priority"
                      : f.priority === "medium" ? "Medium"
                      : "Monitor"}
                    </Badge>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                  <CardDescription className="font-mono text-xs">{f.affectedArea}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>{f.explanation}</p>
                  {f.suggestedNext ?
                    <p className="text-foreground flex gap-2 items-start">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{f.suggestedNext}</span>
                    </p>
                  : null}
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </section>

      {/* K10 Heatmap */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Heatmap highlights</h2>
        {data.heatmapPageSummaries.length > 0 ?
          <div className="grid sm:grid-cols-2 gap-3">
            {data.heatmapPageSummaries.map((h) => (
              <Card key={h.path} className="border-border/80 shadow-sm">
                <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium font-mono truncate" title={h.path}>
                      {h.path}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.heatmapClicks.toLocaleString()} click points in your linked traffic (this window)
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" asChild>
                    <Link
                      href={`/growth-system/page-behavior?path=${encodeURIComponent(h.path)}&days=${data.periodDays}`}
                    >
                      Page detail
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        : null}
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.heatmapHighlights.map((s) => (
              <p key={s}>• {s}</p>
            ))}
            <p className="text-xs border-t pt-3">{data.heatmapHint}</p>
          </CardContent>
        </Card>
      </section>

      {/* K11 Sessions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Session highlights</h2>
        {data.sessionHighlights.length === 0 ?
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground text-center">
              We’ll surface curated session stories as engagement patterns mature — full replay stays with your Ascendra
              team unless you request a shared review.
            </CardContent>
          </Card>
        : <div className="grid gap-3">
            {data.sessionHighlights.map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-2">
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </section>

      {/* K12 Feedback */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Feedback &amp; survey insights</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
            {data.feedbackInsights.map((s) => (
              <p key={s}>• {s}</p>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* K13 Recommendations */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Recommended fixes</h2>
        </div>
        <div className="grid gap-4">
          {data.recommendedActions.map((a, i) => (
            <Card key={`${a.title}-${i}`}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {a.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={priorityStyle(a.priority)} className="capitalize">
                    {a.priority} priority
                  </Badge>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </div>
                <CardDescription>{a.affectedArea}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>{a.why}</p>
                <p className="text-foreground">
                  <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Expected benefit: </span>
                  {a.expectedBenefit}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Legacy narrative blocks */}
      <section className="grid md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              What’s working (detail)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {data.whatsWorking.map((s) => (
              <p key={s}>• {s}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What needs attention (detail)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {data.needsAttention.length === 0 ?
              <p>• No urgent items flagged.</p>
            : data.needsAttention.map((s) => (
                <p key={s}>• {s}</p>
              ))
            }
          </CardContent>
        </Card>
      </section>

      {/* Top pages + surveys */}
      <section className="grid md:grid-cols-2 gap-4">
        {data.topPages.length > 0 ?
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top pages by activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topPages.map((p) => (
                <div key={p.path} className="flex justify-between text-sm border-b border-border/50 py-2 last:border-0">
                  <span className="font-mono text-xs truncate max-w-[65%]">{p.path}</span>
                  <span className="text-muted-foreground tabular-nums">{p.sessions} sessions</span>
                </div>
              ))}
            </CardContent>
          </Card>
        : <Card>
            <CardHeader>
              <CardTitle className="text-base">Top pages</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Path-level activity will list here once available.</CardContent>
          </Card>
        }
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Survey pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {data.surveyThemes.map((s) => (
              <p key={s}>• {s}</p>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* K14 Improvements */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent improvements</h2>
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
            {data.recentProgress.map((s) => (
              <p key={s}>• {s}</p>
            ))}
          </CardContent>
        </Card>
      </section>

      <footer className="text-xs text-muted-foreground border-t border-border pt-8 space-y-3">
        <p>{data.privacyNote}</p>
        <p>
          Need the full operator view? Your team uses{" "}
          <Link href="/admin/behavior-intelligence" className="text-primary underline-offset-2 hover:underline">
            Ascendra Growth Intelligence
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
