"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { GuaranteeSnapshot } from "@shared/guaranteeEngine";

type GuaranteeResponse = GuaranteeSnapshot;

function toneClasses(status: NonNullable<GuaranteeResponse>["dashboardStatus"]) {
  if (status === "met") {
    return {
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      progress: "[&>div]:bg-emerald-500",
      label: "Met",
    };
  }
  if (status === "action_required") {
    return {
      badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
      progress: "[&>div]:bg-red-500",
      label: "Action Required",
    };
  }
  return {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    progress: "[&>div]:bg-amber-500",
    label: "In Progress",
  };
}

export function GrowthGuaranteeStatusCard() {
  const { data, isLoading } = useQuery<GuaranteeResponse>({
    queryKey: ["/api/client/guarantee-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/guarantee-status");
      return (await res.json()) as GuaranteeResponse;
    },
  });

  if (isLoading) {
    return (
      <Card className="border-2 border-teal-500/20 bg-gradient-to-br from-background to-teal-500/[0.05]">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;
  const tone = toneClasses(data.dashboardStatus);
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      data.dashboardStatus === "met"
        ? 100
        : data.dashboardStatus === "in_progress"
          ? 60
          : 25,
    ),
  );

  return (
    <Card className="border-2 border-teal-500/20 bg-gradient-to-br from-background to-teal-500/[0.05]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Your Growth Guarantee Status</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {data.timeframeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={tone.badge}>
            {tone.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{data.timeframeStart} → {data.timeframeEnd}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 bg-card/40">
            <p className="text-xs text-muted-foreground">Leads Generated</p>
            <p className="text-lg font-semibold">{data.qualifiedLeadsCount}</p>
          </div>
          <div className="rounded-lg border p-3 bg-card/40">
            <p className="text-xs text-muted-foreground">Jobs Booked</p>
            <p className="text-lg font-semibold">{data.bookedJobsCount}</p>
          </div>
          <div className="rounded-lg border p-3 bg-card/40">
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
            <p className="text-lg font-semibold">{(data.conversionRate * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border p-3 bg-card/40">
            <p className="text-xs text-muted-foreground">ROI Progress</p>
            <p className="text-lg font-semibold">{data.roiPercentage.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Guarantee progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className={`h-2 ${tone.progress}`} />
        </div>

        {!data.compliance.isCompliant && data.compliance.reasons.length > 0 ? (
          <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">Client Non-Compliance</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
              {data.compliance.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
