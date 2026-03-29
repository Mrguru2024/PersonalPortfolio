import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllWorkflows } from "@server/services/workflows/registry";

const SCHEDULER_TRIGGERS = new Set([
  "appointment_booked",
  "appointment_cancelled",
  "appointment_completed",
  "appointment_no_show",
]);

export default function SchedulerWorkflowsPage() {
  const schedulingWorkflows = getAllWorkflows().filter((w) => SCHEDULER_TRIGGERS.has(w.trigger));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking automations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          When someone books or you change a meeting&apos;s status, the same workflow engine as the CRM runs:
          activity notes always; tags, tasks, and alerts when the booking is linked to a CRM contact (matched by
          email).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Triggers</CardTitle>
          <CardDescription>
            Fired automatically — no extra setup. Tune behavior by changing CRM workflow definitions in code
            (`server/services/workflows/registry.ts`) or extend actions there.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <span className="font-mono text-foreground">appointment_booked</span> — public booking created
              (confirmed).
            </li>
            <li>
              <span className="font-mono text-foreground">appointment_cancelled</span> — guest link or admin sets
              status to cancelled.
            </li>
            <li>
              <span className="font-mono text-foreground">appointment_completed</span> — admin marks completed.
            </li>
            <li>
              <span className="font-mono text-foreground">appointment_no_show</span> — admin marks no-show.
            </li>
          </ul>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/calendar">View calendar &amp; recent runs</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active definitions</CardTitle>
          <CardDescription>Each row is one workflow; several can share the same trigger.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 divide-y divide-border/50 text-sm">
            {schedulingWorkflows.map((w) => (
              <div key={w.key} className="px-3 py-2.5 space-y-1">
                <div className="font-medium text-foreground">{w.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{w.key}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  Trigger: {w.trigger.replace(/_/g, " ")} · {w.actions.length} action(s)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
