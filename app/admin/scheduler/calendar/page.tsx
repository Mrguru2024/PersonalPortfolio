import { SchedulerMasterCalendar } from "@/components/scheduler/SchedulerMasterCalendar";
import { SchedulerWorkflowActivityCard } from "@/components/scheduler/SchedulerWorkflowActivityCard";

export default function SchedulerCalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Master calendar</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Operational calendar across hosts. Click any block to open the full context drawer — CRM link, answers,
          score, and history.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-start">
        <SchedulerMasterCalendar />
        <div className="xl:sticky xl:top-4 space-y-4">
          <SchedulerWorkflowActivityCard />
        </div>
      </div>
    </div>
  );
}
