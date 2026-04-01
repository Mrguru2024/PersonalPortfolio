import { Card, CardContent } from "@/components/ui/card";

export interface InsightHighlightProps {
  /** Short pull quote or key takeaway */
  children: React.ReactNode;
  /** Optional label, e.g. "Key takeaway" */
  label?: string;
}

export function InsightHighlight({ children, label }: InsightHighlightProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="px-5 py-5 sm:px-7 sm:py-6">
        {label && (
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            {label}
          </p>
        )}
        <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
          {children}
        </p>
      </CardContent>
    </Card>
  );
}
