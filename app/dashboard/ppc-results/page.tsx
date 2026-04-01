"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Lightbulb,
  Megaphone,
  PhoneCall,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { ClientPpcSummaryResponse } from "@shared/clientPpcSummary";

function HelpTip({
  label,
  children,
  side = "top",
  className,
}: {
  /** Short title for screen readers */
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            className,
          )}
          aria-label={`Help: ${label}`}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-left leading-snug font-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ClientPpcResultsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/portal?redirect=/dashboard/ppc-results");
    }
  }, [user, authLoading, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/client/ppc-summary"],
    queryFn: async (): Promise<ClientPpcSummaryResponse | { error?: string }> => {
      const res = await fetch("/api/client/ppc-summary", { credentials: "include" });
      const json = (await res.json()) as ClientPpcSummaryResponse | { error?: string };
      if (!res.ok && "error" in json) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not load");
      }
      return json as ClientPpcSummaryResponse;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <BarChart3 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your advertising results</h1>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                  A simple view of leads and booked calls tied to your paid ads—no technical jargon required.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Collapsible className="rounded-xl border-2 border-teal-500/25 bg-gradient-to-r from-teal-500/[0.06] to-emerald-500/[0.06] dark:from-teal-500/10 dark:to-emerald-500/10 px-4 py-3 sm:px-5">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left group">
            <span className="flex items-center gap-2 font-medium text-sm sm:text-base">
              <BookOpen className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              How to read this page
            </span>
            <ChevronDown
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              <strong className="text-foreground font-medium">Qualified leads</strong> are people who reached out through
              your ads and look like real fit opportunities (not spam or junk).
            </p>
            <p>
              <strong className="text-foreground font-medium">Calls booked</strong> counts consultations or calls that got
              scheduled from those leads—an important step toward new business.
            </p>
            <p>
              <strong className="text-foreground font-medium">New customers</strong> is when our team marks a lead as won
              or sold after your sales process—not the same as a click on an ad.
            </p>
            <p className="text-xs border-t border-border/60 pt-3">
              Numbers depend on forms, phone tracking, and how leads are recorded in your system—they update as we classify
              new activity. This page is a snapshot, not a replacement for contracts or invoices.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-9 w-9 animate-spin text-teal-600" aria-label="Loading results" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base">Something went wrong</CardTitle>
              <CardDescription>Try refreshing the page or return to your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && data && "mode" in data && (
          <>
            {data.mode === "disabled" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-muted-foreground" aria-hidden />
                    {data.headline}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">{data.body}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/dashboard">Back to dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {(data.mode === "pending" || data.mode === "ready") && (
              <>
                {data.mode === "pending" && (
                  <Card className="border-amber-500/35 bg-amber-500/[0.04] dark:bg-amber-500/10">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{data.headline}</CardTitle>
                      <CardDescription className="text-sm sm:text-base leading-relaxed">{data.body}</CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {data.mode === "ready" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <Card className="border-teal-500/25 overflow-hidden">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <UserCheck className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
                            <CardTitle className="text-sm font-medium leading-tight">Qualified leads</CardTitle>
                          </div>
                          <HelpTip label="What counts as a qualified lead?" side="left">
                            Real inquiries from your ads that we treat as good-fit—not spam or obvious junk. Your team may
                            adjust this as we learn your market.
                          </HelpTip>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold tabular-nums">{data.primary.qualifiedLeads}</p>
                          <p className="text-xs text-muted-foreground mt-1">People who look worth following up with</p>
                        </CardContent>
                      </Card>

                      <Card className="border-teal-500/25 overflow-hidden">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <PhoneCall className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
                            <CardTitle className="text-sm font-medium leading-tight">Calls booked</CardTitle>
                          </div>
                          <HelpTip label="What is a booked call?" side="left">
                            A meeting or consultation that was scheduled from a lead that came through your campaigns—often a
                            strong signal that ads are working.
                          </HelpTip>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold tabular-nums">{data.primary.bookedCalls}</p>
                          <p className="text-xs text-muted-foreground mt-1">Consultations or calls on the calendar</p>
                        </CardContent>
                      </Card>

                      <Card className="border-teal-500/25 overflow-hidden">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
                            <CardTitle className="text-sm font-medium leading-tight">New customers</CardTitle>
                          </div>
                          <HelpTip label="What is a new customer here?" side="left">
                            Leads your Ascendra team marked as sold or won after your sales process. This is not automatic
                            from the ad platform—it reflects outcomes your team confirms.
                          </HelpTip>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold tabular-nums">{data.primary.newCustomers}</p>
                          <p className="text-xs text-muted-foreground mt-1">Closed wins attributed in our system</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-teal-600" aria-hidden />
                            Your campaigns
                          </CardTitle>
                          <CardDescription>
                            Plain-English status only—you don’t need to log into Google or Meta to understand the headline.
                          </CardDescription>
                        </div>
                        <HelpTip label="Campaign status" side="bottom">
                          &quot;Live&quot; means ads can run (they may still pause for budget or scheduling). &quot;In
                          setup&quot; means we are still configuring. Ask your strategist if something says it needs
                          attention.
                        </HelpTip>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {data.campaigns.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-card/80 px-3 py-3 sm:px-4"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{c.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <Badge variant="secondary">{c.statusLabel}</Badge>
                                {c.growthRouteLabel ?
                                  <span className="text-xs text-muted-foreground">{c.growthRouteLabel}</span>
                                : null}
                              </div>
                              {c.readinessScore != null ?
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                  <span>
                                    Setup readiness score:{" "}
                                    <strong className="text-foreground font-medium">{c.readinessScore}</strong>
                                  </span>
                                  <HelpTip
                                    label="Readiness score"
                                    className="h-5 w-5"
                                    side="bottom"
                                  >
                                    A 0–100 checklist-style score we use before scaling spend. Higher usually means landing
                                    pages, tracking, and follow-up are in better shape—not a grade on your business.
                                  </HelpTip>
                                </div>
                              : null}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {data.recommendations.length > 0 && (
                      <Card className="border-violet-500/25">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-violet-500" aria-hidden />
                            Ideas for better results
                          </CardTitle>
                          <CardDescription>
                            <div className="flex flex-wrap items-start gap-2">
                              <span className="flex-1 min-w-[12rem]">
                                Short suggestions from your account team and our quality checks—not a to-do list you must
                                complete alone.
                              </span>
                              <HelpTip label="About these suggestions" side="left">
                                These combine automated checks (like lead quality patterns) with optimization notes. Your
                                strategist can explain any line in a call or email.
                              </HelpTip>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {data.recommendations.map((line, i) => (
                              <li key={i} className="leading-relaxed">
                                {line}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center sm:text-left pb-6">
          Questions? Use <Link href="/dashboard" className="underline hover:text-foreground">Feedback</Link> on your
          dashboard or reach out to your Ascendra contact.
        </p>
      </div>
    </TooltipProvider>
  );
}
