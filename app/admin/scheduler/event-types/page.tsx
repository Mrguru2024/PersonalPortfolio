import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function SchedulerEventTypesPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Event types</CardTitle>
        <CardDescription>
          Meeting types, durations, and slugs are shared with native <code className="text-xs">/book</code>. Use the
          existing editor to avoid duplicate data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/scheduling/booking-types" className="inline-flex items-center gap-2">
            Open meeting types
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
