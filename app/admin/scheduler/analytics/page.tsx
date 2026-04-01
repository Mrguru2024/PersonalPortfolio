import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulerAnalyticsPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>
          Funnels from page visit through booking and show rate, plus simple breakdowns by source and time slot, are
          planned here once core booking flows are stable end to end.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Nothing to configure yet—check back after your team is actively using Meetings &amp; calendar.
      </CardContent>
    </Card>
  );
}
