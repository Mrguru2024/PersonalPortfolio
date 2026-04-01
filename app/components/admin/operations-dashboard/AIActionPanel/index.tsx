import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AiActionItem } from "@/lib/operations-dashboard/types";

interface AIActionPanelProps {
  actions: AiActionItem[];
  onActionClick: (action: AiActionItem) => void;
}

export function AIActionPanel({ actions, onActionClick }: AIActionPanelProps) {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Studio</CardTitle>
          <CardDescription>Create, improve, and repurpose content faster</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant="outline"
              className="justify-start h-auto min-h-12 py-2.5 whitespace-normal"
              asChild
              onClick={() => onActionClick(action)}
            >
              <Link href={action.href}>
                <span className="text-left">
                  <span className="block text-sm font-medium">{action.label}</span>
                  <span className="block text-xs text-muted-foreground">{action.description}</span>
                </span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
