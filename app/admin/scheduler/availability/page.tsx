import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerAvailabilityPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Global &amp; per-type availability</CardTitle>
          <CardDescription>Weekly windows and per–booking-type rules live in the native scheduling module.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/scheduling/availability">Edit availability</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
