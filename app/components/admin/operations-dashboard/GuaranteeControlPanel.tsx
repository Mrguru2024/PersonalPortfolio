"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { GuaranteePreviewCalculator } from "@/components/admin/operations-dashboard/GuaranteePreviewCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GuaranteeControlFilter = "all" | "not_met" | "at_risk" | "performing";
type GuaranteeActionType =
  | "optimize_funnel"
  | "adjust_offer"
  | "increase_traffic"
  | "fix_conversion_flow";

type GuaranteeControlRow = {
  clientId: number;
  clientLabel: string;
  qualifiedLeadsCount: number;
  bookedJobsCount: number;
  conversionRate: number;
  roiPercentage: number;
  dashboardStatus: "met" | "in_progress" | "action_required";
  dashboardColor: "green" | "yellow" | "red";
  compliance: { isCompliant: boolean; reasons: string[] };
  suggestedActions: GuaranteeActionType[];
};

type GuaranteeControlPayload = {
  filter: GuaranteeControlFilter;
  rows: GuaranteeControlRow[];
};

const ACTION_LABELS: Record<GuaranteeActionType, string> = {
  optimize_funnel: "Optimize Funnel",
  adjust_offer: "Adjust Offer",
  increase_traffic: "Increase Traffic",
  fix_conversion_flow: "Fix Conversion Flow",
};

function colorVariant(color: GuaranteeControlRow["dashboardColor"]) {
  if (color === "green") return "success";
  if (color === "yellow") return "warning";
  return "destructive";
}

function statusLabel(status: GuaranteeControlRow["dashboardStatus"]) {
  if (status === "met") return "Performing";
  if (status === "in_progress") return "At risk";
  return "Not met";
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function GuaranteeControlPanel() {
  const [filter, setFilter] = useState<GuaranteeControlFilter>("all");
  const queryClient = useQueryClient();

  const query = useQuery<GuaranteeControlPayload>({
    queryKey: ["/api/admin/guarantee-control", filter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guarantee-control?filter=${filter}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load guarantee control panel");
      return (await res.json()) as GuaranteeControlPayload;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (input: { clientId: number; action: GuaranteeActionType }) => {
      const res = await fetch("/api/admin/guarantee-control", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Could not trigger guarantee action");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guarantee-control"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
    },
  });

  const rows = query.data?.rows ?? [];
  const summary = useMemo(() => {
    return {
      performing: rows.filter((r) => r.dashboardStatus === "met").length,
      atRisk: rows.filter((r) => r.dashboardStatus === "in_progress").length,
      notMet: rows.filter((r) => r.dashboardStatus === "action_required").length,
    };
  }, [rows]);

  return (
    <section className="space-y-3">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Guarantee Control Panel
              </CardTitle>
              <CardDescription>
                View guarantee statuses and trigger optimization actions.
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as GuaranteeControlFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                <SelectItem value="not_met">Not met</SelectItem>
                <SelectItem value="at_risk">At risk</SelectItem>
                <SelectItem value="performing">Performing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Performing: {summary.performing}</Badge>
            <Badge variant="warning">At risk: {summary.atRisk}</Badge>
            <Badge variant="destructive">Not met: {summary.notMet}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading guarantee data...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guarantee rows found for this filter.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.clientId} className="rounded-lg border p-3 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.clientLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Leads {row.qualifiedLeadsCount} · Jobs {row.bookedJobsCount} · Conversion{" "}
                        {pct(row.conversionRate)} · ROI {row.roiPercentage.toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant={colorVariant(row.dashboardColor)}>{statusLabel(row.dashboardStatus)}</Badge>
                  </div>
                  {!row.compliance.isCompliant && row.compliance.reasons.length > 0 ? (
                    <div className="rounded-md border border-destructive/35 bg-destructive/10 p-2 text-xs text-muted-foreground">
                      <p className="inline-flex items-center gap-1 font-medium text-foreground">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Client Non-Compliance
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {row.compliance.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {row.suggestedActions.map((action) => (
                      <Button
                        key={`${row.clientId}-${action}`}
                        size="sm"
                        variant="outline"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({
                            clientId: row.clientId,
                            action,
                          })
                        }
                      >
                        {ACTION_LABELS[action]}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <GuaranteePreviewCalculator />
    </section>
  );
}

