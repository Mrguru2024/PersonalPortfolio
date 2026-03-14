import { Card, CardContent } from "@/components/ui/card";

export interface BreakdownSectionProps {
  title: string;
  items: string[];
  /** Optional variant for styling (e.g. "positive" for what works) */
  variant?: "default" | "positive" | "improvement" | "opportunity";
}

const variantClasses = {
  default: "border-border bg-card",
  positive: "border-green-500/20 bg-green-500/5 dark:bg-green-500/10",
  improvement: "border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10",
  opportunity: "border-primary/20 bg-primary/5 dark:bg-primary/10",
};

export function BreakdownSection({
  title,
  items,
  variant = "default",
}: BreakdownSectionProps) {
  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-5 sm:p-6">
        {title ? (
          <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
        ) : null}
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-foreground shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
