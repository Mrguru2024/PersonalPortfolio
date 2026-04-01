"use client";

import Link from "next/link";
import { Calendar, Settings, List, Clock, Tags, UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSchedulingHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking &amp; reminders setup</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Tune how public booking works: meeting types, your hours, emails, and whether the book-a-time page is on. For
          the calendar, inbox, and shareable booking links, open{" "}
          <Link href="/admin/scheduler" className="text-primary underline-offset-4 hover:underline font-medium">
            Meetings &amp; calendar
          </Link>
          . To connect Google Calendar or other tools, use{" "}
          <Link href="/admin/integrations" className="text-primary underline-offset-4 hover:underline">
            Integrations
          </Link>
          . Confirmation and reminder emails send automatically while booking stays enabled.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Settings &amp; templates
            </CardTitle>
            <CardDescription>Timezone, time-slot steps, email wording, optional booking assistant, and public on/off.</CardDescription>
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
            <CardDescription>Durations and which meeting types guests can choose when they book.</CardDescription>
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
            <CardDescription>Weekly hours, overrides, and an optional assistant to turn a description into rules.</CardDescription>
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
              Your personal hours and blocked dates when guests book with you—or when you are the only available host.
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
              Public booking page
            </CardTitle>
            <CardDescription>Preview what visitors see when they choose a time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/book" target="_blank" rel="noreferrer">
                Open booking page
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <List className="h-5 w-5" />
              Operations hub
            </CardTitle>
            <CardDescription>Calendar, appointment list, and branded booking links live in one place.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/admin/scheduler">Open Meetings &amp; calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
