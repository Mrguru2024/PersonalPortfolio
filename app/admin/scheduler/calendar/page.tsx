import { SchedulerMasterCalendar } from "@/components/scheduler/SchedulerMasterCalendar";

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
      <SchedulerMasterCalendar />
    </div>
  );
}
