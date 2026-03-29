"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RecommendationItem = {
  kind: string;
  title: string;
  detail: string;
  evidence?: Record<string, unknown>;
};

export interface RecommendationPanelProps {
  items: RecommendationItem[];
  className?: string;
}

export function RecommendationPanel({ items, className }: RecommendationPanelProps) {
  if (!items.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimization preview
          </CardTitle>
          <CardDescription>No recommendations yet — add traffic or link CRM outcomes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Optimization preview
        </CardTitle>
        <CardDescription>Heuristics from experiment metrics — admin approval before scaling spend or changing live copy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((r, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px]">
                {r.kind}
              </Badge>
              <span className="text-sm font-medium text-foreground">{r.title}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
