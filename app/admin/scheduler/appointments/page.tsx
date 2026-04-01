import { SchedulerAppointmentsInbox } from "@/components/scheduler/SchedulerAppointmentsInbox";

export default function SchedulerAppointmentsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointments inbox</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Operational triage: filter by value, quality, payment, and risk. Row click opens the same detail drawer as
          the calendar.
        </p>
      </div>
      <SchedulerAppointmentsInbox />
    </div>
  );
}
