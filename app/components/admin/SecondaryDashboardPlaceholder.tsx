"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ADMIN_WIDGET_LABELS, isAdminWidgetId } from "@/lib/adminWidgetCatalog";

export function SecondaryDashboardPlaceholder({
  widgetId,
  href,
  surfaceLabel,
}: {
  widgetId: string;
  /** Where the module is fully supported (e.g. /admin/dashboard) */
  href: string;
  surfaceLabel: string;
}) {
  const label = isAdminWidgetId(widgetId) ? ADMIN_WIDGET_LABELS[widgetId] : widgetId;
  return (
    <Card className="rounded-xl border-dashed border-amber-500/30 bg-amber-500/[0.04] mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>
          This module is optimized on the {surfaceLabel}. You can keep it here for a combined view, or move it back
          in <span className="font-medium text-foreground">Customize pages</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-9" asChild>
          <Link href={href}>Open {surfaceLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
