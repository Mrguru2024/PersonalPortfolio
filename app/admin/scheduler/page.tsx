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
    title: "Calendar",
    description: "Day, week, month, and agenda views for everything on the books.",
    icon: CalendarDays,
  },
  {
    href: "/admin/scheduler/appointments",
    title: "Appointments",
    description: "Sortable list of bookings with status, notes, and follow-up context.",
    icon: Inbox,
  },
  {
    href: "/admin/scheduler/booking-pages",
    title: "Booking pages",
    description: "Branded links for each offer or campaign—each gets its own shareable address.",
    icon: FileStack,
  },
  {
    href: "/admin/scheduler/event-types",
    title: "Meeting types",
    description: "Durations and labels—edited alongside Booking & reminders setup so data stays in sync.",
    icon: Tags,
  },
  {
    href: "/admin/scheduler/availability",
    title: "Availability",
    description: "Open the setup screens for weekly hours, overrides, and host calendars.",
    icon: Clock,
  },
  {
    href: "/admin/scheduler/team",
    title: "Team",
    description: "Who takes meetings, their hours, and how work is assigned.",
    icon: Users,
  },
] as const;

export default function AdminSchedulerHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-sm font-semibold tracking-wide text-foreground">Meetings &amp; calendar</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your booking command center</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          See who booked, manage times on the calendar, and share the right link for each campaign. Email templates,
          meeting types, and open hours are configured under{" "}
          <Link href="/admin/scheduling" className="text-primary font-medium underline-offset-4 hover:underline">
            Booking &amp; reminders setup
          </Link>
          .
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
          <CardTitle className="text-lg">More tools</CardTitle>
          <CardDescription>
            Routing, automated follow-ups, payments, and summary reports—use these when you are ready to tighten how
            bookings move through your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/routing-rules">Routing</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/workflows">Automations</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/payments">Payments</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/scheduler/analytics">Reports</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
