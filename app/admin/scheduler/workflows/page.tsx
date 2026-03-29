import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerWorkflowsPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Workflow automations</CardTitle>
        <CardDescription>
          Booking lifecycle triggers (created, confirmed, cancelled, no-show) should fan into your existing Growth OS /
          email systems rather than a parallel automation editor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Phase 2: emit structured webhooks or reuse internal automation routes when an appointment changes.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/growth-os">Growth OS overview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
