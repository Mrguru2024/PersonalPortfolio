import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerSettingsPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Booking settings</CardTitle>
        <CardDescription>
          Time zone, how long each slot is, how far ahead guests can book, email wording, optional booking assistant, and
          whether public booking is turned on—all live under Booking &amp; reminders setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/scheduling/settings">Open booking &amp; reminders settings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
