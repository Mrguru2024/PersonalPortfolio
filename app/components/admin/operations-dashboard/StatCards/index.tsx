import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OperationsSummaryStats } from "@/lib/operations-dashboard/types";

interface StatCardsProps {
  summary: OperationsSummaryStats;
}

const STAT_LABELS: Array<{ key: keyof OperationsSummaryStats; label: string }> = [
  { key: "newDiagnosticsToReview", label: "New Diagnostics to Review" },
  { key: "qualifiedLeads", label: "Qualified Leads" },
  { key: "draftCaseStudies", label: "Draft Case Studies" },
  { key: "publishedCaseStudies", label: "Published Case Studies" },
  { key: "contentMissingKeyElements", label: "Content Missing Key Elements" },
  { key: "itemsReadyToPublish", label: "Items Ready to Publish" },
];

export function StatCards({ summary }: StatCardsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Operations Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {STAT_LABELS.map((item) => (
          <Card key={item.key} className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold tabular-nums">{summary[item.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
