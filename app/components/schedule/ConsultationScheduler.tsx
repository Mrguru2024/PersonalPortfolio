"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CONSULTATION_DURATIONS,
  DEFAULT_CONSULTATION_DURATION,
} from "@shared/consultationSchema";

interface AvailabilitySlot {
  startIso: string;
  endIso: string;
  label: string;
  hostLabel: string;
}

interface AvailabilityResponse {
  success: boolean;
  date: string;
  timezone: string;
  hostTimezone: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
}

interface BookingSuccessPayload {
  bookingId: number;
  scheduledAt: string;
  endAt: string;
  timezone: string;
  googleCalendarEventLink: string | null;
}

const browserTimeZone =
  typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

const commonTimeZones = Array.from(
  new Set([
    browserTimeZone,
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "UTC",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Australia/Sydney",
  ])
);

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ConsultationScheduler() {
  const [timezone, setTimezone] = useState(browserTimeZone);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    DEFAULT_CONSULTATION_DURATION
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<BookingSuccessPayload | null>(null);

  const selectedDateIso = useMemo(
    () => (selectedDate ? toIsoDate(selectedDate) : null),
    [selectedDate]
  );

  useEffect(() => {
    if (!selectedDateIso) {
      setAvailability(null);
      setSelectedSlot(null);
      return;
    }

    let ignore = false;
    const loadAvailability = async () => {
      setLoadingSlots(true);
      setAvailabilityError(null);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/schedule/availability?date=${encodeURIComponent(
            selectedDateIso
          )}&timezone=${encodeURIComponent(
            timezone
          )}&durationMinutes=${durationMinutes}`,
          { credentials: "include", cache: "no-store" }
        );
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.message || "Failed to load availability.");
        }
        if (!ignore) {
          setAvailability(payload as AvailabilityResponse);
        }
      } catch (err) {
        if (!ignore) {
          setAvailability(null);
          setAvailabilityError(
            err instanceof Error
              ? err.message
              : "Unable to load available consultation times."
          );
        }
      } finally {
        if (!ignore) {
          setLoadingSlots(false);
        }
      }
    };

    loadAvailability();
    return () => {
      ignore = true;
    };
  }, [selectedDateIso, timezone, durationMinutes]);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    Boolean(topic.trim()) &&
    Boolean(selectedSlot) &&
    consent &&
    !submitting;

  const handleSubmit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/schedule/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          timezone,
          startIso: selectedSlot.startIso,
          durationMinutes,
          topic: topic.trim(),
          notes: notes.trim() || undefined,
          consent,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to schedule consultation.");
      }
      setSuccess(payload as BookingSuccessPayload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to book this time. Please try another slot."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const start = DateTime.fromISO(success.scheduledAt, { zone: "utc" }).setZone(
      success.timezone
    );
    const end = DateTime.fromISO(success.endAt, { zone: "utc" }).setZone(
      success.timezone
    );

    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Consultation Scheduled</CardTitle>
            <CardDescription>
              Your meeting is confirmed. Reminders are set via email and Google
              Calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Badge variant="secondary">Booking ID: {success.bookingId}</Badge>
            <p>
              <strong>
                {start.toFormat("cccc, LLL d, yyyy")} · {start.toFormat("h:mm a")} –{" "}
                {end.toFormat("h:mm a")} ({success.timezone})
              </strong>
            </p>
            {success.googleCalendarEventLink ? (
              <a
                className="inline-flex items-center text-primary hover:underline"
                href={success.googleCalendarEventLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google Calendar event
              </a>
            ) : null}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  setSelectedSlot(null);
                }}
              >
                Schedule another consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarClock className="h-7 w-7 text-primary" />
          Schedule a Consultation
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose your date, time, and timezone. We’ll send reminders to email
          and create a Google Calendar event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
              Tell us what you’d like to discuss during the consultation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Website URL</Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Consultation Topic *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should we focus on in this call?"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional context, links, or business goals."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
            <CardDescription>
              Interactive scheduling powered by timezone-aware availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimeZones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  Duration
                </Label>
                <Select
                  value={String(durationMinutes)}
                  onValueChange={(value) =>
                    setDurationMinutes(Number.parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTATION_DURATIONS.map((duration) => (
                      <SelectItem key={duration} value={String(duration)}>
                        {duration} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const max = new Date();
                  max.setDate(max.getDate() + 60);
                  return date < now || date > max;
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Available times{" "}
                {selectedDate ? `for ${selectedDate.toLocaleDateString()}` : ""} (
                {timezone})
              </p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available slots...
                </div>
              ) : availabilityError ? (
                <p className="text-sm text-destructive">{availabilityError}</p>
              ) : availability?.slots?.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availability.slots.map((slot) => (
                    <Button
                      key={slot.startIso}
                      type="button"
                      variant={
                        selectedSlot?.startIso === slot.startIso
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No open slots for this date. Select another day.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              I agree to be contacted regarding this consultation and understand
              reminders will be sent by email and calendar.
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              type="button"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Confirm Consultation"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
