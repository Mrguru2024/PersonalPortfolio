import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerSettingsPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Scheduler settings</CardTitle>
        <CardDescription>
          Timezone, slot step, notice windows, email templates, and public booking toggle remain in native scheduling
          settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/scheduling/settings">Open scheduling settings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
