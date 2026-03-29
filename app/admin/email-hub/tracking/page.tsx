"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2,
  Activity,
  MailOpen,
  MousePointerClick,
  AlertTriangle,
  Target,
  Users,
  Radio,
  ExternalLink,
  Send,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import type { EmailHubTrackingPagePayload } from "@shared/emailHubTrackingPayload";

function pctLabel(v: number | null, empty = "—"): string {
  if (v == null) return empty;
  return `${v}%`;
}

function StatBlock({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}

export default function EmailHubTrackingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const qc = useQueryClient();

  const [localOpen, setLocalOpen] = useState(true);
  const [localClick, setLocalClick] = useState(true);
  const [localUnsub, setLocalUnsub] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/email-hub/tracking"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/tracking");
      if (!res.ok) throw new Error("tracking");
      return (await res.json()) as EmailHubTrackingPagePayload;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    if (!data?.defaults) return;
    setLocalOpen(data.defaults.defaultTrackingOpen);
    setLocalClick(data.defaults.defaultTrackingClick);
    setLocalUnsub(data.defaults.defaultUnsubFooter);
  }, [data?.defaults]);

  const savePatch = useMutation({
    mutationFn: async (patch: {
      defaultTrackingOpen?: boolean;
      defaultTrackingClick?: boolean;
      defaultUnsubFooter?: boolean;
    }) => {
      const res = await apiRequest("PATCH", "/api/admin/email-hub/tracking", patch);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "Save failed");
      return body as EmailHubTrackingPagePayload;
    },
    onSuccess: (payload) => {
      qc.setQueryData(["/api/admin/email-hub/tracking"], payload);
    },
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ins = data?.insights;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Tracking</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {isSuper ?
            <>
              Email Hub stores opens, clicks, and bounces reported by Brevo so you can see who engaged before you close a
              conversation. Link a CRM contact when you compose to tie every signal to a lead.
            </>
          : "See who opened and clicked your outbound mail so you know when to follow up. Link a CRM contact in Compose to tie each send to a lead."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4" />
              {isSuper ? "Connection & delivery" : "Delivery status"}
            </CardTitle>
            <CardDescription>
              {isSuper ?
                <>
                  Open and click tracking is applied by Brevo when enabled. Events are stored in{" "}
                  <code className="text-xs bg-muted px-1 rounded">email_hub_events</code>; configure the Brevo inbound
                  notification secret like your other transactional events.
                </>
              : "Open and click tracking is handled by your Brevo account when those options are on. Your team should confirm Brevo is connected if engagement data looks empty."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading || !data ?
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            : <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={data.connection.brevoApiConfigured ? "default" : "destructive"}>
                    Brevo API {data.connection.brevoApiConfigured ? "OK" : "missing"}
                  </Badge>
                  <Badge variant={data.connection.webhookSecretConfigured ? "default" : "outline"}>
                    Webhook secret {data.connection.webhookSecretConfigured ? "set" : "not set"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Tracking domain (env):{" "}
                  <span className="text-foreground font-medium">{data.connection.trackingDomain || "default Brevo"}</span>
                </p>
                <Button variant="outline" size="sm" asChild className="rounded-xl">
                  <Link href="/admin/email-hub/settings">Email Hub settings</Link>
                </Button>
              </>
            }
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Defaults for new sends</CardTitle>
            <CardDescription>
              Applied when you open Compose until you change the toggles there. Brevo adds an unsubscribe footer only when
              you enable it—useful for nurture-style mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !data ?
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            : <>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
                  <div>
                    <Label htmlFor="t-open" className="text-sm font-medium">
                      Open tracking
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Know when a lead read your message.</p>
                  </div>
                  <Switch
                    id="t-open"
                    checked={localOpen}
                    onCheckedChange={(v) => {
                      setLocalOpen(v);
                      savePatch.mutate({ defaultTrackingOpen: v });
                    }}
                    disabled={savePatch.isPending}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
                  <div>
                    <Label htmlFor="t-click" className="text-sm font-medium">
                      Click tracking
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">See CTA and link engagement (strong buying signal).</p>
                  </div>
                  <Switch
                    id="t-click"
                    checked={localClick}
                    onCheckedChange={(v) => {
                      setLocalClick(v);
                      savePatch.mutate({ defaultTrackingClick: v });
                    }}
                    disabled={savePatch.isPending}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
                  <div>
                    <Label htmlFor="t-unsub" className="text-sm font-medium">
                      Unsubscribe footer
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Adds list-style opt-out (off for one-to-one sales mail).</p>
                  </div>
                  <Switch
                    id="t-unsub"
                    checked={localUnsub}
                    onCheckedChange={(v) => {
                      setLocalUnsub(v);
                      savePatch.mutate({ defaultUnsubFooter: v });
                    }}
                    disabled={savePatch.isPending}
                  />
                </div>
              </>
            }
          </CardContent>
        </Card>
      </div>

      {isError ?
        <p className="text-sm text-destructive">Could not load tracking analytics.</p>
      : null}

      {ins ?
        <>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Engagement (last {ins.windowDays} days)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Denominator = outbound Email Hub sends in this window. Rates use distinct messages with at least one open or
              click.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatBlock
                title="Sends"
                value={String(ins.sentLast30d)}
                hint="All Email Hub messages marked sent"
                icon={Send}
              />
              <StatBlock
                title="Opened"
                value={`${ins.distinctOpens30d} · ${pctLabel(ins.openRatePct)}`}
                hint="Messages with ≥1 open"
                icon={MailOpen}
              />
              <StatBlock
                title="Clicked"
                value={`${ins.distinctClicks30d} · ${pctLabel(ins.clickRatePct)}`}
                hint="Messages with ≥1 click"
                icon={MousePointerClick}
              />
              <StatBlock
                title="Clicks / opens"
                value={pctLabel(ins.clickThroughOfOpensPct, ins.distinctOpens30d === 0 ? "n/a" : "—")}
                hint="Of messages that opened, share that also clicked"
                icon={Target}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              CRM-linked outreach
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Sends where you attached a CRM contact in Compose. Use this slice to judge quality of 1:1 pipeline mail—not
              generic blasts.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatBlock
                title="CRM sends"
                value={String(ins.crmLinkedSent30d)}
                hint="Sent with related contact"
                icon={Send}
              />
              <StatBlock
                title="CRM opened"
                value={`${ins.crmDistinctOpens30d} · ${pctLabel(ins.crmOpenRatePct)}`}
                hint="Those contacts who opened"
                icon={MailOpen}
              />
              <StatBlock
                title="CRM clicked"
                value={`${ins.crmDistinctClicks30d} · ${pctLabel(ins.crmClickRatePct)}`}
                hint="High intent: follow up while warm"
                icon={MousePointerClick}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatBlock
              title="Bounces (window)"
              value={String(ins.bounces30d)}
              hint="From Brevo — clean or verify addresses before the next touch"
              icon={AlertTriangle}
            />
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next step</p>
              <p className="mt-2 text-sm text-foreground">
                Sort by <span className="font-medium">click</span> first in the table below, then call or book while the
                thread is fresh.
              </p>
              <Button variant="link" className="h-auto p-0 mt-2 justify-start" asChild>
                <Link href="/admin/email-hub/sent">
                  Open Sent → message timeline
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Who to call first</CardTitle>
              <CardDescription>
                Recent open/click signals on mail tied to a CRM contact (deduped by contact; clicks prioritized).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 pb-6">
              {ins.priorityFollowUps.length === 0 ?
                <p className="text-sm text-muted-foreground px-6 py-4">
                  No CRM-linked engagement in this window. Link a contact in Compose to populate this list.
                </p>
              : (
                <div className="overflow-x-auto border-t border-border/60 sm:border sm:rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Signal</TableHead>
                        <TableHead className="hidden md:table-cell">Intent / score</TableHead>
                        <TableHead className="hidden lg:table-cell">Stage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ins.priorityFollowUps.map((row) => (
                        <TableRow key={row.contactId}>
                          <TableCell>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">{row.email}</div>
                            {row.company ?
                              <div className="text-xs text-muted-foreground">{row.company}</div>
                            : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.lastSignal === "click" ? "default" : "secondary"}>
                              {row.lastSignal}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(row.lastSignalAt), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {row.intentLevel ?? "—"}
                            {row.leadScore != null ?
                              <span className="text-foreground"> · score {row.leadScore}</span>
                            : null}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {row.status ?? "—"}
                            {row.lifecycleStage ?
                              <span className="block text-xs">{row.lifecycleStage}</span>
                            : null}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <Button variant="outline" size="sm" className="rounded-lg h-8" asChild>
                                <Link href={`/admin/crm/${row.contactId}`}>CRM</Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="rounded-lg h-8" asChild>
                                <Link href={`/admin/email-hub/compose?contactId=${row.contactId}`}>Compose</Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent events
              </CardTitle>
              <CardDescription>
                {isSuper ? "Latest provider events across your visible messages." : "Recent opens, clicks, and bounces on your mail."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 pb-6">
              <div className="overflow-x-auto border-t border-border/60 sm:border sm:rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="hidden sm:table-cell">Subject</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead className="text-right">Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ins.recentActivity.length === 0 ?
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground text-sm">
                          {isSuper ?
                            "No events yet. Confirm Brevo inbound notifications reach this app (see deployment docs)."
                          : "No engagement yet. If this persists, ask your administrator to verify the Brevo connection."}
                        </TableCell>
                      </TableRow>
                    : ins.recentActivity.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {e.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{e.recipientEmail}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                            {e.subject ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {e.at ? formatDistanceToNow(new Date(e.at), { addSuffix: true }) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg" asChild>
                              <Link href={`/admin/email-hub/sent#${e.messageId}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      : isLoading ?
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      : null}
    </div>
  );
}
