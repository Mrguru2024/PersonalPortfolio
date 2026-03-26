"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, Mail, PenLine, Megaphone, BarChart3, Newspaper, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function CommunicationsDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ["/api/admin/communications/analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        totals: {
          campaigns: number;
          sent: number;
          opened: number;
          clicked: number;
          openRate: number;
          clickRate: number;
          clickToOpenRate: number;
        };
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user || !user.isAdmin || !user.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const campaignCount = analytics?.totals.campaigns ?? 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby="comm-overview-heading" className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="comm-overview-heading" className="text-lg font-semibold tracking-tight">
              At a glance
            </h2>
            <p className="text-sm text-muted-foreground">
              Numbers include CRM-targeted campaigns only. Hover the tabs above for a quick reminder of what each area
              does.
            </p>
          </div>
          {!aLoading && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{campaignCount}</span>{" "}
              {campaignCount === 1 ? "campaign" : "campaigns"} on record ·{" "}
              <Link className="text-primary underline-offset-4 hover:underline font-medium" href="/admin/communications/campaigns">
                Manage
              </Link>
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>Emails delivered</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {aLoading ? "—" : analytics?.totals.sent ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground leading-relaxed">
              Total messages sent from tracked campaigns (each recipient counts once).
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>Open rate</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {aLoading ? "—" : `${analytics?.totals.openRate ?? 0}%`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground leading-relaxed">
              Share of delivered emails that were opened, when tracking picks it up.
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>Click rate</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {aLoading ? "—" : `${analytics?.totals.clickRate ?? 0}%`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground leading-relaxed">
              Share of delivered emails where someone clicked a tracked link.
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardDescription>Clicks among readers</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {aLoading ? "—" : `${analytics?.totals.clickToOpenRate ?? 0}%`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground leading-relaxed">
              Of people who opened, how many also clicked — useful for creative quality.
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="comm-actions-heading" className="space-y-3">
        <h2 id="comm-actions-heading" className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden />
          What do you want to do?
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Jump in with one tap — each card opens the right screen so you spend less time hunting through the admin menu.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/communications/designs/new"
            className={cn(
              "group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
              "hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PenLine className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Create a new email design
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Start from blocks you can reuse in any campaign — subject lines, hero, body, buttons.
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  Open designer <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/communications/campaigns/new"
            className={cn(
              "group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
              "hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Start a campaign
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Pick a design, narrow your audience from CRM (tags, source, offer), preview size, then send when you&apos;re
                  ready.
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  New campaign <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/communications/analytics"
            className={cn(
              "group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
              "hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Review results
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Campaign-by-campaign breakdowns so you can see what resonated before the next send.
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  Open analytics <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/newsletters"
            className={cn(
              "group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
              "hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                <Newspaper className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Newsletter subscribers
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Public signup lists and newsletter sends live here — separate from one-to-many CRM campaigns.
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  Go to newsletters <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              Keeps CRM context in one place
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              After a send, activity shows up on the lead&apos;s timeline so sales and ops see the same story — no need to
              cross-check an email tool and the CRM by hand.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="transition-transform hover:scale-[1.02] active:scale-100">
                <Link href="/admin/communications/designs">
                  Browse designs <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/crm">Open CRM</Link>
              </Button>
            </div>
            <Collapsible className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium text-foreground hover:underline">
                <span>Technical details for admins</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sends are recorded per lead (including <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">communication_events</code>{" "}
                  and activity). Opens and clicks use tracked links via{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">/api/track/email/*</code> with a unique id per
                  delivery.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CRM campaigns vs. newsletters</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              <strong className="font-semibold text-foreground">This section</strong> is for targeted email to people already
              in your CRM — filter by tags, lead source, downloads, and more, and keep a structured history per campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/newsletters">
                Newsletters
              </Link>{" "}
              stay on the list you built from the website: broadcasts to subscribers, not the same audience rules as CRM
              segments.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/newsletters">Open newsletters</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
