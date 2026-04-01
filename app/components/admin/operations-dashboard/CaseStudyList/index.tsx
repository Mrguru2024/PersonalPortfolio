import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CaseStudyWorkflowItem } from "@/lib/operations-dashboard/types";

interface CaseStudyListProps {
  caseStudies: CaseStudyWorkflowItem[];
  onPublishToggle: (item: CaseStudyWorkflowItem, nextStatus: "published" | "draft") => void;
  onDuplicate: (item: CaseStudyWorkflowItem) => void;
  onAction: (action: string, item: CaseStudyWorkflowItem) => void;
}

export function CaseStudyList({ caseStudies, onPublishToggle, onDuplicate, onAction }: CaseStudyListProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Case Study Pipeline</CardTitle>
          <CardDescription>Turn work into proof and publishable assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {caseStudies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No case-study candidates found in Content Studio yet.</p>
          ) : (
            caseStudies.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 p-3 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Updated {format(new Date(item.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.workflowStatus}</Badge>
                    <Badge variant={item.completionScore >= 70 ? "default" : "secondary"}>
                      Completion {item.completionScore}%
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Missing elements: {item.missingElements.length ? item.missingElements.join(", ") : "None"}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" asChild onClick={() => onAction("edit_case_study", item)}>
                    <Link href={`/admin/content-studio/documents/${item.id}`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild onClick={() => onAction("preview_case_study", item)}>
                    <Link href={`/admin/content-studio/documents/${item.id}`}>Preview</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const nextStatus = item.workflowStatus === "published" ? "draft" : "published";
                      onAction("publish_case_study", item);
                      onPublishToggle(item, nextStatus);
                    }}
                  >
                    {item.workflowStatus === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAction("duplicate_case_study", item);
                      onDuplicate(item);
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" asChild onClick={() => onAction("generate_formats", item)}>
                    <Link href={`/admin/content-studio/documents/${item.id}`}>Generate Formats</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
