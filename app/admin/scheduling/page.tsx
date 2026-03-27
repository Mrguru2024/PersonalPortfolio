import Link from "next/link";
import { Calendar, Settings, List, Clock, Tags, UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSchedulingHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scheduling</h1>
        <p className="text-muted-foreground mt-1">
          Native booking on Ascendra—confirmations and reminder emails. Optional: connect Google Calendar or Calendly in{" "}
          <Link href="/admin/integrations" className="text-primary underline-offset-4 hover:underline">
            Integrations
          </Link>
          (planned sync); cron runs reminders via <code className="text-xs">/api/cron/scheduling</code> or Growth OS cron.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Settings & templates
            </CardTitle>
            <CardDescription>Timezone, slot step, email copy, AI assistant, public on/off.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/scheduling/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tags className="h-5 w-5" />
              Meeting types
            </CardTitle>
            <CardDescription>Durations, slugs, and active flags for /book.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/admin/scheduling/booking-types">Edit types</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Availability
            </CardTitle>
            <CardDescription>Weekly windows, per-type overrides, AI parse &amp; save.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/admin/scheduling/availability">Edit availability</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle className="h-5 w-5" />
              My availability
            </CardTitle>
            <CardDescription>
              Per–founder hours and blocked dates for public /book (when guests choose you or you&apos;re the only host).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/admin/scheduling/my-availability">Edit my calendar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Public book page
            </CardTitle>
            <CardDescription>Share <code className="text-xs">/book</code> with prospects.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/book" target="_blank" rel="noreferrer">
                Preview /book
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <List className="h-5 w-5" />
              Appointments API
            </CardTitle>
            <CardDescription>List bookings: GET /api/admin/scheduling/appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/api/admin/scheduling/appointments" target="_blank" rel="noreferrer">
                Open JSON (auth required)
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
