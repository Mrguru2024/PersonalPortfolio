import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulerRoutingRulesPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Routing</CardTitle>
        <CardDescription>
          Route new bookings by skill, region, or priority host—designed to complement how you already run Growth OS, so
          rules stay in one mental model.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming soon: round robin, priority host, manual override, and saved rule sets per booking page.
      </CardContent>
    </Card>
  );
}
