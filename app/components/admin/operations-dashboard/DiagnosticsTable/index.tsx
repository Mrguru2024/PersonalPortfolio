import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DiagnosticActivityRow } from "@/lib/operations-dashboard/types";

interface DiagnosticsTableProps {
  diagnostics: DiagnosticActivityRow[];
  onMarkFollowUp: (row: DiagnosticActivityRow) => void;
  onAction: (action: string, row: DiagnosticActivityRow) => void;
}

export function DiagnosticsTable({ diagnostics, onMarkFollowUp, onAction }: DiagnosticsTableProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Recent Diagnostic Activity</CardTitle>
          <CardDescription>Businesses that need attention or follow-up</CardDescription>
        </CardHeader>
        <CardContent>
          {diagnostics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No diagnostic activity found yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-2 font-medium">Business Type</th>
                    <th className="p-2 font-medium">Score</th>
                    <th className="p-2 font-medium">Revenue Opportunity</th>
                    <th className="p-2 font-medium">Recommended System</th>
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.map((row) => (
                    <tr key={`${row.kind}:${row.id}`} className="border-b border-border/60 align-top">
                      <td className="p-2">
                        <p className="font-medium">{row.businessType}</p>
                        <p className="text-xs text-muted-foreground">{row.kind === "growth_diagnosis" ? "Automated diagnosis" : "Diagnostic quiz"}</p>
                      </td>
                      <td className="p-2">{row.score ?? "—"}</td>
                      <td className="p-2">{row.revenueOpportunity}</td>
                      <td className="p-2">{row.recommendedSystem}</td>
                      <td className="p-2 whitespace-nowrap text-muted-foreground" suppressHydrationWarning>
                        {format(new Date(row.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button variant="outline" size="sm" asChild onClick={() => onAction("view_breakdown", row)}>
                            <Link href={row.breakdownHref} target="_blank" rel="noopener noreferrer">
                              View Breakdown
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!row.crmContactId}
                            onClick={() => {
                              onAction("mark_follow_up", row);
                              onMarkFollowUp(row);
                            }}
                          >
                            Mark for Follow-Up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={!row.crmContactId}
                            onClick={() => onAction("open_lead", row)}
                          >
                            <Link href={row.crmContactId ? `/admin/crm/${row.crmContactId}` : "/admin/crm"}>
                              Open Lead
                            </Link>
                          </Button>
                          <Button variant="secondary" size="sm" asChild onClick={() => onAction("view_recommendation", row)}>
                            <Link href={row.recommendationHref} target="_blank" rel="noopener noreferrer">
                              View Recommendation
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
