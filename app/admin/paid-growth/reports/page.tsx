import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaidGrowthReportsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Paid Growth aggregates live on the dashboard; extended analytics use existing modules.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Link className="text-primary underline" href="/admin/paid-growth">
            Paid Growth dashboard
          </Link>
          <Link className="text-primary underline" href="/admin/analytics">
            Website analytics
          </Link>
          <Link className="text-primary underline" href="/admin/communications/analytics">
            Communications analytics
          </Link>
          <Link className="text-primary underline" href="/admin/crm">
            CRM (source, UTM, timeline)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
