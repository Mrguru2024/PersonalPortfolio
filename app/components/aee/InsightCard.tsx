"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface InsightCardProps {
  title: string;
  body: string;
  insightType?: string;
  severity?: string;
  confidence0to100?: number;
  className?: string;
}

export function InsightCard({ title, body, insightType, severity, confidence0to100, className }: InsightCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {insightType ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {insightType}
            </Badge>
          ) : null}
          {severity ? (
            <Badge variant={severity === "fail" ? "destructive" : severity === "watch" ? "secondary" : "outline"} className="text-[10px]">
              {severity}
            </Badge>
          ) : null}
          {confidence0to100 != null ? (
            <span className="text-xs text-muted-foreground">confidence {confidence0to100}</span>
          ) : null}
        </div>
        <CardDescription className="text-xs">Evidence-backed; review underlying CRM and traffic before acting.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{body}</CardContent>
    </Card>
  );
}
