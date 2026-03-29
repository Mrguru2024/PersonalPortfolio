import Link from "next/link";
import {
  CalendarDays,
  Inbox,
  FileStack,
  Tags,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tiles = [
  {
    href: "/admin/scheduler/calendar",
    title: "Master calendar",
    description: "Day, week, month, and agenda views with operational coloring.",
    icon: CalendarDays,
  },
  {
    href: "/admin/scheduler/appointments",
    title: "Appointments inbox",
    description: "Sortable pipeline table — score, intent, payment, and no-show risk.",
    icon: Inbox,
  },
  {
    href: "/admin/scheduler/booking-pages",
    title: "Booking pages",
    description: "Conversion-focused links per offer; public URLs at /book/[slug].",
    icon: FileStack,
  },
  {
    href: "/admin/scheduler/event-types",
    title: "Event types",
    description: "Durations and slugs shared with native /book (classic editor).",
    icon: Tags,
  },
  {
    href: "/admin/scheduler/availability",
    title: "Availability",
    description: "Weekly windows, overrides, and host calendars.",
    icon: Clock,
  },
  {
    href: "/admin/scheduler/team",
    title: "Team scheduling",
    description: "Per-host hours and assignment surface.",
    icon: Users,
  },
] as const;

export default function AdminSchedulerHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-sm font-semibold tracking-wide uppercase">Ascendra Scheduler</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Scheduling operations</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Internal layer connecting qualification signals to the calendar: who booked, whether they&apos;re worth the
          slot, who should own the call, and what happens next. Builds on existing native scheduling and CRM links —
          no duplicate booking engine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(({ href, title, description, icon: Icon }) => (
          <Card key={href} className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm" className="gap-1">
                <Link href={href}>
                  Open
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Phase 2 modules</CardTitle>
          <CardDescription>
            Routing rules, workflow automations, payments settlement, and analytics rollups plug in here without
            changing your appointments table.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/routing-rules">Routing rules</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/workflows">Workflows</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/payments">Payments</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/analytics">Analytics</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
