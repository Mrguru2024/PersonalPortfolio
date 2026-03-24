import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OperationsQuickAction } from "@/lib/operations-dashboard/types";

interface QuickActionCardsProps {
  actions: OperationsQuickAction[];
  onActionClick: (action: OperationsQuickAction) => void;
}

export function QuickActionCards({ actions, onActionClick }: QuickActionCardsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {actions.map((action) => (
          <Card key={action.key} className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{action.label}</CardTitle>
              <CardDescription className="text-xs">{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                className="w-full justify-between"
                onClick={() => onActionClick(action)}
              >
                <Link href={action.href}>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
