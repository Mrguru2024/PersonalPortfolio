"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  ExternalLink,
  Download,
  FileText,
  Gauge,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";

interface ReportRow {
  id: number;
  reportId: string;
  url: string;
  email: string | null;
  businessType: string | null;
  primaryGoal: string | null;
  status: string;
  pagesAnalyzed: number | null;
  overallScore: number | null;
  createdAt: string;
}

export default function AdminGrowthDiagnosisPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [emailFilter, setEmailFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: listData, isLoading: listLoading } = useQuery<{ reports: ReportRow[] }>({
    queryKey: ["/api/admin/growth-diagnosis/reports", emailFilter, urlFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (emailFilter) params.set("email", emailFilter);
      if (urlFilter) params.set("url", urlFilter);
      const res = await apiRequest("GET", `/api/admin/growth-diagnosis/reports?${params}`);
      if (!res.ok) throw new Error("Failed to load reports");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<{
    report: Record<string, unknown>;
    diagnostics: { verification: { verified: number; partial: number; lowConfidence: number; total: number }; reportId: string; pagesAnalyzed: number | null; overallScore: number | null };
  }>({
    queryKey: ["/api/admin/growth-diagnosis/reports", selectedId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/growth-diagnosis/reports/${selectedId}`);
      if (!res.ok) throw new Error("Failed to load report");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!selectedId,
  });

  const reports = listData?.reports ?? [];

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user.isAdmin || !user.adminApproved) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link href="/admin/dashboard">
          <Button variant="link">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="mb-6 space-y-3">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">Growth Diagnosis monitoring</h1>
            <p className="text-muted-foreground text-sm">
              View persisted audit reports, verification diagnostics, and export. Re-run from the public tool.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto gap-2">
            <Link href="/growth-diagnosis" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Run diagnosis
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter by email or URL (optional)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Email"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="URL contains"
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Reports
          </CardTitle>
          <CardDescription>
            Persisted reports from the Growth Diagnosis Engine. Each run is stored when a report is generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">No reports yet. Run a diagnosis from the public tool.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.email || "—"} · {r.pagesAnalyzed ?? 0} pages · {r.overallScore != null ? `Score ${r.overallScore}` : "—"} · {format(new Date(r.createdAt), "PPp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={r.overallScore != null && r.overallScore >= 60 ? "secondary" : "destructive"}>
                      {r.overallScore ?? "—"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedId(String(r.id))}
                    >
                      View & diagnostics
                    </Button>
                    <a
                      href={`/api/admin/growth-diagnosis/reports/${r.id}/export?format=json`}
                      download
                      className="inline-flex"
                      title="Download report as JSON"
                      aria-label="Download report as JSON"
                    >
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report details & diagnostics</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {detailData.diagnostics.verification.verified}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Partial</p>
                  <p className="font-semibold flex items-center gap-1">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                    {detailData.diagnostics.verification.partial}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Low confidence</p>
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    {detailData.diagnostics.verification.lowConfidence}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Overall score</p>
                  <p className="font-semibold">{detailData.diagnostics.overallScore ?? "—"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={`/api/admin/growth-diagnosis/reports/${selectedId}/export?format=json`} download>
                    <FileText className="h-4 w-4" />
                    Export JSON
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={`/api/admin/growth-diagnosis/reports/${selectedId}/export?format=text`} download>
                    <FileText className="h-4 w-4" />
                    Export narrative (text)
                  </a>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link href={`/growth-diagnosis?url=${encodeURIComponent((detailData.report?.request as { url?: string })?.url ?? "")}`} target="_blank" rel="noopener noreferrer">
                    <RefreshCw className="h-4 w-4" />
                    Re-run this URL
                  </Link>
                </Button>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="summary">
                  <AccordionTrigger>Summary</AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify((detailData.report as { summary?: unknown })?.summary ?? {}, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="issues">
                  <AccordionTrigger>Findings ({((detailData.report as { issues?: unknown[] })?.issues ?? []).length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      {((detailData.report as { issues?: Array<{ id?: string; title: string; verificationStatus?: string; severity?: string }> })?.issues ?? []).map((issue) => (
                        <li key={issue.id ?? issue.title} className="flex items-start gap-2 border-b pb-2 last:border-0">
                          <Badge variant="outline" className="shrink-0">{issue.verificationStatus ?? "—"}</Badge>
                          <span>{issue.title}</span>
                          {issue.severity && <Badge variant="secondary" className="shrink-0">{issue.severity}</Badge>}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
