"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Inbox,
  Sparkles,
  Download,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import type { LeadIntakeKind } from "@shared/leadIntakeTypes";
import { Input } from "@/components/ui/input";
import { matchesLiveSearch } from "@/lib/matchesLiveSearch";

interface IntakeItem {
  kind: LeadIntakeKind;
  id: number;
  email: string | null;
  name: string | null;
  company: string | null;
  summary: string;
  scoreLabel: string | null;
  createdAt: string;
  crmContactId: number | null;
  inCrm: boolean;
}

const KIND_LABEL: Record<LeadIntakeKind, string> = {
  growth_diagnosis: "Growth diagnosis (URL audit)",
  funnel_lead: "Funnel quiz + apply",
  assessment: "Project assessment",
};

function itemKey(k: LeadIntakeKind, id: number) {
  return `${k}:${id}`;
}

function AdminLeadIntakePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "all";
  const validTabs = ["all", "growth_diagnosis", "funnel_lead", "assessment"] as const;
  const activeTab = (validTabs.includes(tabParam as (typeof validTabs)[number]) ? tabParam : "all") as
    | "all"
    | LeadIntakeKind;

  const [tab, setTab] = useState(activeTab);
  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listSearch, setListSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/lead-intake"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lead-intake?limitPerSource=50");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ items: IntakeItem[]; aiConfigured: boolean }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const items = data?.items ?? [];
  const aiConfigured = data?.aiConfigured ?? false;

  const filteredItems = useMemo(
    () =>
      items.filter((i) =>
        matchesLiveSearch(listSearch, [
          i.email,
          i.name,
          i.company,
          i.summary,
          i.scoreLabel,
          KIND_LABEL[i.kind],
        ]),
      ),
    [items, listSearch],
  );

  const toggle = useCallback((k: LeadIntakeKind, id: number) => {
    const key = itemKey(k, id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const importMutation = useMutation({
    mutationFn: async (payload: { items: { kind: LeadIntakeKind; id: number }[]; useAi: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/lead-intake/import", payload);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { message?: string }).message ?? "Import failed");
      return j as {
        results: Array<{
          kind: LeadIntakeKind;
          id: number;
          ok: boolean;
          crmContactId?: number;
          error?: string;
          aiUsed?: boolean;
        }>;
      };
    },
    onSuccess: (body) => {
      const ok = body.results.filter((r) => r.ok).length;
      const fail = body.results.length - ok;
      toast({
        title: "CRM import finished",
        description: `${ok} succeeded${fail ? `, ${fail} failed` : ""}.`,
        variant: fail ? "destructive" : "default",
      });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-intake"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
    },
    onError: (e: Error) => {
      toast({ title: "Import error", description: e.message, variant: "destructive" });
    },
  });

  const runImport = (useAi: boolean) => {
    const parsed: { kind: LeadIntakeKind; id: number }[] = [];
    for (const key of selected) {
      const [kind, idStr] = key.split(":");
      const id = parseInt(idStr, 10);
      if (!kind || Number.isNaN(id)) continue;
      if (kind === "growth_diagnosis" || kind === "funnel_lead" || kind === "assessment") {
        parsed.push({ kind, id });
      }
    }
    if (parsed.length === 0) {
      toast({ title: "Nothing selected", description: "Select at least one row." });
      return;
    }
    if (useAi && !aiConfigured) {
      toast({
        title: "AI not configured",
        description: "AI import is currently unavailable. Import without AI to continue.",
        title: "Enhanced import unavailable",
        description: "Use standard import for now or enable enhanced import in settings.",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate({ items: parsed, useAi });
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user.isAdmin || !user.adminApproved) {
    return (
      <div className="container max-w-lg py-10 px-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Button variant="link" asChild>
          <Link href="/admin/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Inbox className="h-7 w-7" />
              Lead intake hub
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Audits, diagnosis reports, funnel quiz submissions, and project assessments in one place. Import into CRM
              with optional AI enrichment for intent, lifecycle stage, tags, and notes.
              with optional enhanced tagging and summary notes. Matches existing contacts by email to avoid duplicate
              records.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/crm/import">CSV import</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/growth-diagnosis" target="_blank" rel="noopener noreferrer" className="gap-1 inline-flex items-center">
              <ExternalLink className="h-3.5 w-3.5" />
              Public diagnosis tool
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-primary/15 bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bulk actions</CardTitle>
          <CardDescription>
            Select rows below, then import to CRM. AI import adds tags, intent, lifecycle stage, industry, and a short
            internal note.
            {!aiConfigured && " AI import is currently unavailable in this environment."}
            Select rows below, then import. Enhanced import adds tags, intent, lifecycle, industry, and a short
            summary note. {!aiConfigured && " Enhanced import is currently off."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => runImport(false)}
            disabled={importMutation.isPending || selected.size === 0}
            className="gap-2"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Import selected
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => runImport(true)}
            disabled={importMutation.isPending || selected.size === 0 || !aiConfigured}
            className="gap-2"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Import selected with AI
            Import selected + enhanced import
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh list
          </Button>
        </CardContent>
      </Card>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          placeholder="Filter submissions as you type (email, name, summary…)"
          className="pl-9"
          aria-label="Filter lead intake"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as typeof tab;
          setTab(next);
          router.replace(`/admin/lead-intake?tab=${encodeURIComponent(next)}`, { scroll: false });
        }}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="growth_diagnosis">Growth diagnosis</TabsTrigger>
          <TabsTrigger value="funnel_lead">Funnel quiz</TabsTrigger>
          <TabsTrigger value="assessment">Assessments</TabsTrigger>
        </TabsList>

        {(["all", "growth_diagnosis", "funnel_lead", "assessment"] as const).map((tabValue) => {
          const rows =
            tabValue === "all" ? filteredItems : filteredItems.filter((i) => i.kind === tabValue);
          return (
            <TabsContent key={tabValue} value={tabValue} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submissions</CardTitle>
                  <CardDescription>
                    {rows.length} row{rows.length === 1 ? "" : "s"} in this tab
                    {listSearch.trim() && items.length !== filteredItems.length
                      ? ` (filtered from ${tabValue === "all" ? items.length : items.filter((i) => i.kind === tabValue).length} total)`
                      : ""}
                    . Full assessment tooling remains on the{" "}
                    <Link href="/admin/dashboard" className="text-primary underline underline-offset-2">
                      dashboard
                    </Link>
                    ; this hub is for cross-source review and CRM import.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : rows.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">No submissions in this category yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left">
                            <th className="p-2 w-10" />
                            <th className="p-2 font-medium">Type</th>
                            <th className="p-2 font-medium">Contact</th>
                            <th className="p-2 font-medium">Summary</th>
                            <th className="p-2 font-medium">Score / status</th>
                            <th className="p-2 font-medium">CRM</th>
                            <th className="p-2 font-medium">When</th>
                            <th className="p-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => {
                            const key = itemKey(row.kind, row.id);
                            const canImport = !!row.email?.trim();
                            return (
                              <tr key={key} className="border-b border-border/60 hover:bg-muted/20">
                                <td className="p-2 align-top">
                                  <Checkbox
                                    checked={selected.has(key)}
                                    onCheckedChange={() => toggle(row.kind, row.id)}
                                    disabled={!canImport}
                                    aria-label={`Select ${KIND_LABEL[row.kind]} #${row.id}`}
                                  />
                                </td>
                                <td className="p-2 align-top">
                                  <Badge variant="outline" className="font-normal whitespace-nowrap">
                                    {KIND_LABEL[row.kind]}
                                  </Badge>
                                </td>
                                <td className="p-2 align-top min-w-[140px]">
                                  <div className="font-medium">{row.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground break-all">{row.email || "No email"}</div>
                                  {row.company && <div className="text-xs text-muted-foreground">{row.company}</div>}
                                </td>
                                <td className="p-2 align-top max-w-[240px]">
                                  <span className="line-clamp-2">{row.summary}</span>
                                </td>
                                <td className="p-2 align-top whitespace-nowrap">{row.scoreLabel ?? "—"}</td>
                                <td className="p-2 align-top">
                                  {row.inCrm && row.crmContactId ? (
                                    <Link
                                      href={`/admin/crm/${row.crmContactId}`}
                                      className="text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      #{row.crmContactId}
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground inline-flex items-center gap-1">
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      Not linked
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 align-top whitespace-nowrap text-muted-foreground">
                                  {format(new Date(row.createdAt), "MMM d, yyyy")}
                                </td>
                                <td className="p-2 align-top text-right space-y-1">
                                  <div className="flex flex-col sm:flex-row gap-1 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      disabled={!canImport || importMutation.isPending}
                                      onClick={() =>
                                        importMutation.mutate({ items: [{ kind: row.kind, id: row.id }], useAi: false })
                                      }
                                    >
                                      Import
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="h-8"
                                      disabled={!canImport || importMutation.isPending || !aiConfigured}
                                      onClick={() =>
                                        importMutation.mutate({ items: [{ kind: row.kind, id: row.id }], useAi: true })
                                      }
                                    >
                                      Enhanced
                                    </Button>
                                  </div>
                                  {row.kind === "growth_diagnosis" && (
                                    <span className="flex flex-col items-end gap-0.5 text-xs">
                                      <a
                                        href={`/api/admin/growth-diagnosis/reports/${row.id}/export?format=json`}
                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                        download
                                      >
                                        <Download className="h-3 w-3" />
                                        JSON
                                      </a>
                                      <a
                                        href={`/api/admin/growth-diagnosis/reports/${row.id}/export?format=text`}
                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                        download
                                      >
                                        <Download className="h-3 w-3" />
                                        Text
                                      </a>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export default function AdminLeadIntakePageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminLeadIntakePage />
    </Suspense>
  );
}
