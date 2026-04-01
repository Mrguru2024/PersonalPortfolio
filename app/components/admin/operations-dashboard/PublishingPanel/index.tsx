import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublishingQueueItem } from "@/lib/operations-dashboard/types";

interface PublishingPanelProps {
  items: PublishingQueueItem[];
  onPublishToggle: (item: PublishingQueueItem, nextStatus: "published" | "draft") => void;
  onAction: (action: string, item: PublishingQueueItem) => void;
}

export function PublishingPanel({ items, onPublishToggle, onAction }: PublishingPanelProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Publishing &amp; Public Content</CardTitle>
          <CardDescription>Content ready for public visibility or review</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No publishing items found.</p>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 10).map((item) => {
                const previewHref = item.slug ? `/blog/${item.slug}` : `/admin/content-studio/documents/${item.id}`;
                return (
                  <div key={item.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          Updated {format(new Date(item.updatedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.workflowStatus}</Badge>
                        <Badge variant={item.seoReady ? "default" : "secondary"}>
                          SEO {item.seoReady ? "Ready" : "Needs work"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Button variant="outline" size="sm" asChild onClick={() => onAction("preview_public_page", item)}>
                        <Link href={previewHref} target="_blank" rel="noopener noreferrer">
                          Preview Public Page
                        </Link>
                      </Button>
                      {item.workflowStatus === "published" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            onAction("unpublish_item", item);
                            onPublishToggle(item, "draft");
                          }}
                        >
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            onAction("publish_item", item);
                            onPublishToggle(item, "published");
                          }}
                        >
                          Publish
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild onClick={() => onAction("edit_item", item)}>
                        <Link href={`/admin/content-studio/documents/${item.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
