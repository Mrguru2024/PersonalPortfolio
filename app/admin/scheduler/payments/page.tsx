import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerPaymentsPage() {
  return (
    <Card className="max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle>Payments &amp; deposits</CardTitle>
        <CardDescription>
          Booking pages can show whether you expect a deposit or full payment. Collecting card payments ties into the same
          revenue settings you use elsewhere—this area will surface controls as they roll out.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/growth-os/revenue-ops">Revenue ops</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
