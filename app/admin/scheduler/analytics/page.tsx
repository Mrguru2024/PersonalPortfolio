import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulerAnalyticsPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Scheduler analytics</CardTitle>
        <CardDescription>
          Phase 2: funnels from page view → booking → show rate, cohorts by source, slot heatmaps, and value tiers —
          fed from <code className="text-xs">bookingSource</code> and completed timestamps already on appointments.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Operational reports ship after payment + webhook parity.</CardContent>
    </Card>
  );
}
