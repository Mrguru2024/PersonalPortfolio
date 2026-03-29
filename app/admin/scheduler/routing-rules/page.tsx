import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulerRoutingRulesPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Routing rules</CardTitle>
        <CardDescription>
          Skill-based, geographic, and score-driven assignment lands in Phase 2 so it can reuse Growth OS automation
          hooks without duplicating workflow engines.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Planned: round robin, priority host, manual override, and rule packs per booking page.
      </CardContent>
    </Card>
  );
}
