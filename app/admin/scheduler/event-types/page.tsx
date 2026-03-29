import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function SchedulerEventTypesPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Meeting types</CardTitle>
        <CardDescription>
          Names, lengths, and which types appear on your public booking flows are edited in one place so nothing gets
          out of sync.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/scheduling/booking-types" className="inline-flex items-center gap-2">
            Edit meeting types
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
