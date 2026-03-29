"use client";

import Link from "next/link";
import { Calendar, Settings, List, Clock, Tags, UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";

export default function AdminSchedulingHomePage() {
  const { user } = useAuth();
  const isSuper = isAuthSuperUser(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scheduling</h1>
        <p className="text-muted-foreground mt-1">
          Native booking on Ascendra—confirmations and reminder emails. Optional: connect Google Calendar or Calendly in{" "}
          <Link href="/admin/integrations" className="text-primary underline-offset-4 hover:underline">
            Integrations
          </Link>
          {isSuper ?
            <>
              {" "}
              (planned sync). Reminder jobs run on a schedule via <code className="text-xs">/api/cron/scheduling</code> or
              Growth OS automation.
            </>
          : " (calendar sync is planned). Reminder emails run on an automated schedule."}
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
            <CardDescription>
              {isSuper ?
                "Durations, slugs, and active flags for /book."
              : "Durations and which meeting types appear on your public booking page."}
            </CardDescription>
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
              {isSuper ?
                "Per–founder hours and blocked dates for public /book (when guests choose you or you're the only host)."
              : "Your personal hours and blocked dates when guests book you—or when you are the only available host."}
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
            <CardDescription>
              {isSuper ?
                <>
                  Share <code className="text-xs">/book</code> with prospects.
                </>
              : "Share your public booking link with prospects."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/book" target="_blank" rel="noreferrer">
                Preview /book
              </Link>
            </Button>
          </CardContent>
        </Card>
        {isSuper ?
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
        : null}
      </div>
    </div>
  );
}
