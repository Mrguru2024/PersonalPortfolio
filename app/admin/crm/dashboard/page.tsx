"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCrmDashboardLayout } from "@/hooks/useAdminUiLayouts";
import { AdminUnifiedLayoutSheetTrigger } from "@/components/admin/AdminUnifiedLayoutSheet";
import { SecondaryDashboardPlaceholder } from "@/components/admin/SecondaryDashboardPlaceholder";
import { CrmKpisWidget } from "@/components/admin/dashboard-widgets/CrmKpisWidget";
import { CrmSourcesTagsWidget } from "@/components/admin/dashboard-widgets/CrmSourcesTagsWidget";
import { CrmPipelineOverdueWidget } from "@/components/admin/dashboard-widgets/CrmPipelineOverdueWidget";
import { CrmTasksActivityWidget } from "@/components/admin/dashboard-widgets/CrmTasksActivityWidget";
import { AnalyticsSummaryCardsWidget } from "@/components/admin/dashboard-widgets/AnalyticsSummaryCardsWidget";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function renderCrmHostWidget(id: string): ReactNode {
  switch (id) {
    case "kpis":
      return (
        <div className="min-w-0">
          <CrmKpisWidget />
        </div>
      );
    case "sourcesTags":
      return (
        <div className="min-w-0">
          <CrmSourcesTagsWidget />
        </div>
      );
    case "pipeline":
      return (
        <div className="min-w-0">
          <CrmPipelineOverdueWidget />
        </div>
      );
    case "tasksActivity":
      return (
        <div className="min-w-0">
          <CrmTasksActivityWidget />
        </div>
      );
    case "analytics_summary":
      return (
        <div className="min-w-0">
          <AnalyticsSummaryCardsWidget />
        </div>
      );
    case "suggested":
    case "reminders":
    case "summary":
    case "inbox":
    case "intelligence":
    case "shortcuts":
    case "password":
    case "devUpdates":
      return (
        <SecondaryDashboardPlaceholder widgetId={id} href="/admin/dashboard" surfaceLabel="main admin dashboard" />
      );
    default:
      return null;
  }
}

export default function CrmDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const crmLayout = useCrmDashboardLayout();

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-6xl py-6 px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">CRM Overview</h1>
            <p className="text-muted-foreground mt-0.5">
              Contacts, accounts, pipeline, insights. Use{" "}
              <span className="font-medium text-foreground">Customize pages</span> to move modules between the main
              dashboard, CRM, and analytics.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {crmLayout.ready ? <AdminUnifiedLayoutSheetTrigger initialSurface="crm" /> : null}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
                <Link href="/admin/crm">Contacts</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
                <Link href="/admin/crm/accounts">Accounts</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
                <Link href="/admin/crm/pipeline">Pipeline</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
                <Link href="/admin/crm/ltv">LTV snapshot</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
                <Link href="/admin/crm/tasks">Tasks</Link>
              </Button>
            </div>
          </div>
        </div>

        {crmLayout.visibleSectionOrder.length === 0 ? (
          <Card className="mb-6 border-dashed border-amber-500/40 bg-amber-500/[0.06] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">No CRM sections visible</CardTitle>
              <CardDescription>
                Open <span className="font-medium text-foreground">Customize pages</span> above to turn modules back on
                or reset defaults.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <div className="flex flex-col gap-8 w-full min-w-0">
          {crmLayout.visibleSectionOrder.map((id) => (
            <div key={id} className="w-full min-w-0" id={`admin-widget-${id}`}>
              {renderCrmHostWidget(id)}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button variant="outline" size="sm" className="rounded-lg min-h-[44px] sm:min-h-9" asChild>
            <Link href="/admin/dashboard">← Back to main dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
