import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerTeamPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            Approved admins can set their own hours and blocked days for the booking flows visitors use.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href="/admin/scheduling/my-availability">My availability</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/scheduling">Booking &amp; reminders setup</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
