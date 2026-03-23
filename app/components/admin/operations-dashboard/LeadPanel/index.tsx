import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeadSnapshotItem } from "@/lib/operations-dashboard/types";

interface LeadPanelProps {
  leads: LeadSnapshotItem[];
  onStartFollowUp: (lead: LeadSnapshotItem) => void;
  onAction: (action: string, lead: LeadSnapshotItem) => void;
}

export function LeadPanel({ leads, onStartFollowUp, onAction }: LeadPanelProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Leads &amp; Opportunities</CardTitle>
          <CardDescription>High-potential leads from diagnostics and funnels</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No qualified leads available yet.</p>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 10).map((lead) => (
                <div key={lead.contactId} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lead.leadName}</p>
                      <p className="text-xs text-muted-foreground">{lead.business}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{lead.source}</Badge>
                      <Badge variant="secondary">{lead.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm mt-2">Opportunity: {lead.opportunity}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Button variant="outline" size="sm" asChild onClick={() => onAction("view_lead", lead)}>
                      <Link href={`/admin/crm/${lead.contactId}`}>View Lead</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild onClick={() => onAction("update_status", lead)}>
                      <Link href={`/admin/crm/${lead.contactId}`}>Update Status</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild onClick={() => onAction("open_diagnostic", lead)}>
                      <Link href={lead.diagnosticHref} target="_blank" rel="noopener noreferrer">
                        Open Diagnostic
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onAction("start_follow_up", lead);
                        onStartFollowUp(lead);
                      }}
                    >
                      Start Follow-Up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
