"use client";

import { Dna } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ContentDNAPanelProps {
  className?: string;
}

/**
 * Winning pattern detection (hooks, CTA styles, angles) ties to Content Studio + insight runs.
 */
export function ContentDNAPanel({ className }: ContentDNAPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Dna className="h-4 w-4" />
          Content DNA
        </CardTitle>
        <CardDescription>
          Will aggregate from experiment configs, internal content scores, and comms A/B outcomes — no mock NLP output.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Patterns library pending rollup integration.</CardContent>
    </Card>
  );
}
