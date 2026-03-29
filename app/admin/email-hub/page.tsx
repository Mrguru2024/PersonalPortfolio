"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, MousePointerClick, MailOpen, AlertTriangle, Send, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { formatLocaleDateTime } from "@/lib/localeDateTime";

type Overview = {
  sentToday: number;
  scheduledCount: number;
  draftCount: number;
  openRatePct: number | null;
  clickRatePct: number | null;
  bounceCount30d: number;
  replyCountManual: number;
  bySender: { senderId: number; name: string; email: string; sent: number; opens: number; clicks: number }[];
  recentActivity: {
    id: number;
    type: string;
    messageId: number;
    recipientEmail: string;
    at: string;
    subject?: string;
  }[];
};

export default function EmailHubOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/overview");
      if (!res.ok) throw new Error("Failed to load overview");
      return (await res.json()) as Overview;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/email-hub/compose">
            <PlusCircle className="h-4 w-4 mr-2" />
            New email
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/templates">New template</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/assets">Upload asset</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/contacts">Contacts</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/settings">Connect sender / settings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/tracking">Tracking</Link>
        </Button>
      </div>

      {isLoading || !data ? (
        <p className="text-muted-foreground">Loading metrics…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Sent today" value={String(data.sentToday)} icon={Send} hint="Email Hub messages" />
            <MetricCard
              title="Open rate (30d)"
              value={data.openRatePct != null ? `${data.openRatePct}%` : "—"}
              icon={MailOpen}
              hint={isSuper ? "Distinct sent messages with ≥1 open" : "Share of sent mail that was opened"}
            />
            <MetricCard
              title="Click rate (30d)"
              value={data.clickRatePct != null ? `${data.clickRatePct}%` : "—"}
              icon={MousePointerClick}
              hint={isSuper ? "Distinct sent messages with ≥1 click" : "Share of sent mail with a link click"}
            />
            <MetricCard
              title="Bounces (30d)"
              value={String(data.bounceCount30d)}
              icon={AlertTriangle}
              hint={isSuper ? "From Brevo webhook payloads" : "Addresses that could not be delivered"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Queue</CardTitle>
                <CardDescription>Scheduled + drafts</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-6 text-2xl font-bold tabular-nums">
                <div>
                  <p className="text-xs font-normal text-muted-foreground">Scheduled</p>
                  {data.scheduledCount}
                </div>
                <div>
                  <p className="text-xs font-normal text-muted-foreground">Drafts</p>
                  {data.draftCount}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/60 shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Founder / sender performance (30d)</CardTitle>
                <CardDescription>Sent volume and engagement by sender identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data.bySender.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No senders yet.{" "}
                    <Link href="/admin/email-hub/settings" className="text-primary underline font-medium">
                      Add a verified sender in Settings
                    </Link>{" "}
                    — any approved admin can create one for their own use.
                  </p>
                ) : (
                  data.bySender.map((s) => (
                    <div
                      key={s.senderId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 text-sm last:border-0"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="flex gap-3 tabular-nums text-xs text-muted-foreground">
                        <span>{s.sent} sent</span>
                        <span>{s.opens} opens</span>
                        <span>{s.clicks} clicks</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>
                {isSuper ? "Provider events mapped to Email Hub messages" : "Latest opens, clicks, and bounces"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isSuper ?
                    <>
                      No events recorded yet. In Brevo, point inbound notifications at{" "}
                      <code className="text-xs bg-muted px-1 rounded">/api/webhooks/brevo</code>.
                    </>
                  : "No engagement data yet. Your administrator can confirm Brevo is connected if this stays empty."}
                </p>
              ) : (
                data.recentActivity.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Badge variant="secondary" className="mb-1 text-[10px]">
                        {a.type}
                      </Badge>
                      <p className="truncate text-muted-foreground">{a.recipientEmail}</p>
                      {a.subject ? <p className="truncate font-medium">{a.subject}</p> : null}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {a.at ? formatLocaleDateTime(a.at, "monthDayTime", "") : ""}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/email-hub/sent?msg=${a.messageId}`}>View</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Send;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-md overflow-hidden bg-card/90">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      </CardContent>
    </Card>
  );
}
