"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Flame,
  Clock,
  Users,
  PhoneMissed,
  ListTodo,
  ArrowRight,
  LayoutDashboard,
  Plug,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeLeadControlPriority, leadControlPriorityLabel } from "@shared/leadControlPriority";
import type { CrmContact } from "@shared/crmSchema";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";
import { intentLevelLabel } from "@/lib/crm-intent";

interface SummaryResponse {
  totals: {
    crmContacts: number;
    activeLeads: number;
    newLeads: number;
    p1Urgent: number;
    p2High: number;
    hotIntent: number;
    bookedCalls: number;
    needsFirstTouch: number;
    followUpNeeded: number;
    overdueTasks: number;
    proposalReady: number;
  };
}

function priorityBadgeClass(p: string): string {
  if (p === "P1") return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
  if (p === "P2") return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
  if (p === "P3") return "bg-slate-500/10 text-foreground border-border";
  if (p === "P4") return "bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-500/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function AdminLeadCommandCenterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const recomputeBatch = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/lead-control/recompute", {
        updatePriority: true,
        updateRoutingHint: true,
      });
      return res.json() as Promise<{ updated: number; scanned: number }>;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/summary"] });
      toast({ title: `Updated ${r.updated} of ${r.scanned} leads (priority + routing hint)` });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/admin/lead-control/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lead-control/summary");
      return res.json() as Promise<SummaryResponse>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", { leadQueue: 1 }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/contacts?limit=200");
      return res.json() as Promise<CrmContact[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const rows = useMemo(() => {
    const leads = contacts.filter((c) => c.type === "lead");
    const q = search.trim().toLowerCase();
    const filtered = q
      ? leads.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company ?? "").toLowerCase().includes(q),
        )
      : leads;

    return filtered
      .map((c) => {
        const p = (c.leadControlPriority as string | null) || computeLeadControlPriority(c);
        return { contact: c, priority: p as ReturnType<typeof computeLeadControlPriority> };
      })
      .sort((a, b) => {
        const order = (x: string) => (["P1", "P2", "P3", "P4", "P5"].indexOf(x) >= 0 ? ["P1", "P2", "P3", "P4", "P5"].indexOf(x) : 99);
        const d = order(a.priority) - order(b.priority);
        if (d !== 0) return d;
        const ta = new Date(a.contact.createdAt).getTime();
        const tb = new Date(b.contact.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 80);
  }, [contacts, search]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const t = summary?.totals;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8" data-tour="lead-command-center">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <h1 className="text-2xl font-bold tracking-tight">Lead command center</h1>
            <AdminHelpTip
              content="One place to see **urgency and queue health**. Records live in **CRM** — open a lead for full profile, Lead Control actions, and timeline."
              ariaLabel="Help: Lead command center"
            />
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Inbound lead operations: priority, first-touch gaps, and follow-up load. No duplicate lead database — data is{" "}
            <Link href="/admin/crm" className="text-primary underline-offset-4 hover:underline">
              CRM-backed
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/leads/settings">
              <Settings className="h-4 w-4 mr-2" />
              Routing rules
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/crm/tasks">
              <ListTodo className="h-4 w-4 mr-2" />
              CRM tasks
            </Link>
          </Button>
          <Button
            variant="secondary"
            className="gap-1"
            disabled={recomputeBatch.isPending}
            onClick={() => {
              if (
                !confirm(
                  "Recompute Lead Control priority and routing hints for up to 2000 CRM leads? This only updates crm_contacts fields.",
                )
              )
                return;
              recomputeBatch.mutate();
            }}
          >
            {recomputeBatch.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Batch recompute
          </Button>
        </div>
      </div>

      <Card className="border-dashed bg-muted/25 dark:bg-muted/10">
        <CardHeader className="py-3 px-4 space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plug className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            Plugs into Ascendra OS
            <AdminHelpTip
              content="Lead Control is **not** a second CRM. It sits on **CRM contacts** and the same funnel, campaigns, booking, and analytics stack — extend those systems instead of replacing them."
              ariaLabel="Help: ecosystem integration"
            />
          </CardTitle>
          <CardDescription className="text-xs">
            Same leads as CRM; funnel, comms, scheduler, and analytics stay in their existing tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          <nav
            className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
            aria-label="Related Ascendra OS areas"
          >
            <Link href="/admin/dashboard" className="text-primary underline-offset-4 hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/lead-intake" className="text-primary underline-offset-4 hover:underline">
              Lead intake
            </Link>
            <Link href="/admin/crm" className="text-primary underline-offset-4 hover:underline">
              CRM
            </Link>
            <Link href="/admin/funnel" className="text-primary underline-offset-4 hover:underline">
              Funnel
            </Link>
            <Link href="/admin/newsletters" className="text-primary underline-offset-4 hover:underline">
              Newsletters
            </Link>
            <Link href="/admin/paid-growth" className="text-primary underline-offset-4 hover:underline">
              Paid growth
            </Link>
            <Link href="/admin/scheduler" className="text-primary underline-offset-4 hover:underline">
              Scheduler
            </Link>
            <Link href="/admin/analytics" className="text-primary underline-offset-4 hover:underline">
              Analytics
            </Link>
            <Link href="/admin/experiments" className="text-primary underline-offset-4 hover:underline">
              Experiments (AEE)
            </Link>
          </nav>
        </CardContent>
      </Card>

      {summaryLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : t ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                P1 + P2 leads
                <AdminHelpTip
                  content="**P1** = urgent (overdue follow-up or hot + new). **P2** = high-value / hot intent. Rules live in code (`shared/leadControlPriority.ts`) so you can tune them."
                  ariaLabel="Help: P1 P2"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {t.p1Urgent + t.p2High}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({t.p1Urgent} urgent / {t.p2High} high)
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PhoneMissed className="h-4 w-4 text-amber-600" />
                Needs first touch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{t.needsFirstTouch}</p>
              <p className="text-xs text-muted-foreground mt-1">New status, no logged outbound yet</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-up load
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{t.followUpNeeded}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.overdueTasks} overdue CRM tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pipeline snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">{t.newLeads}</span> new leads
              </p>
              <p>
                <span className="font-medium text-foreground">{t.bookedCalls}</span> with booked call
              </p>
              <p>
                <span className="font-medium text-foreground">{t.proposalReady}</span> proposal-ready deals
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <CardTitle>Lead queue</CardTitle>
            <CardDescription>
              Sorted by Lead Control priority (P1 first). Opens the CRM record with **Lead Control** actions and timeline.
            </CardDescription>
          </div>
          <Input
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead className="max-w-[120px]">
                      Routing
                      <AdminHelpTip
                        content="From **routing rules** (`/admin/leads/settings`), stored on the CRM contact as `lead_routing_hint`."
                        ariaLabel="Help: routing hint column"
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No leads match. Try clearing search or import from{" "}
                        <Link href="/admin/lead-intake" className="text-primary underline">
                          Lead intake
                        </Link>
                        .
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(({ contact: c, priority: p }) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant="outline" className={priorityBadgeClass(p)} title={leadControlPriorityLabel(p)}>
                            {p}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                          {c.company ? <div className="text-xs text-muted-foreground">{c.company}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm">{c.intentLevel ? intentLevelLabel(c.intentLevel) : "—"}</TableCell>
                        <TableCell
                          className="text-xs text-muted-foreground max-w-[140px] truncate"
                          title={c.leadRoutingHint ?? undefined}
                        >
                          {c.leadRoutingHint ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{c.status ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/crm/${c.id}`}>
                              Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
