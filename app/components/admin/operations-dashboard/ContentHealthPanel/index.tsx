import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContentHealthSummary } from "@/lib/operations-dashboard/types";

interface ContentHealthPanelProps {
  summary: ContentHealthSummary;
}

export function ContentHealthPanel({ summary }: ContentHealthPanelProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Content Readiness</CardTitle>
          <CardDescription>Identify what&apos;s missing before publishing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Completion score</span>
              <span className="font-medium tabular-nums">{summary.averageCompletionScore}%</span>
            </div>
            <Progress value={summary.averageCompletionScore} />
          </div>
          <ul className="space-y-1.5 text-sm">
            {summary.issues.map((issue) => (
              <li key={issue.label} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span>{issue.label}</span>
                <span className="tabular-nums text-muted-foreground">{issue.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
