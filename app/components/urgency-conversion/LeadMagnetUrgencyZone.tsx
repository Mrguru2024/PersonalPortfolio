"use client";

/**
 * Urgency & Scarcity Conversion Engine — public surface UI
 *
 * Reuses: modules/scarcity-engine via server resolve (capacity when capacitySource=scarcity_engine).
 * Reuses: Growth Intelligence experiments via GET variant + public API.
 * Reuses: /api/track/visitor + LEAD_TRACKING_EVENT_TYPES for analytics.
 * Reuses: shadcn Card, Button, Badge, Progress, Alert.
 * Extended: shared/urgencyConversionSchema + urgencyConversionService (admin-configurable surfaces).
 * Intentionally not rebuilt: fake countdowns (only server-provided deadlines); duplicate CRM capacity logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import type { PublicUrgencyPayload } from "@shared/urgencyConversionPublicTypes";
import { isPrerequisiteComplete } from "@/lib/funnelMicroCommitment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function HonestDeadlineCountdown({ endsAtIso, label }: { endsAtIso: string; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(endsAtIso).getTime();
  const ms = Math.max(0, end - now);
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const text = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="timer"
      aria-live="polite"
      aria-label={`${label}, ${text} remaining`}
    >
      <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{label}</span> · {text} left
      </span>
    </div>
  );
}

export function LeadMagnetUrgencyZone({
  surfaceKey,
  className,
}: {
  surfaceKey: string;
  className?: string;
}) {
  const { track, getVisitorId, getSessionId } = useVisitorTracking();
  const [data, setData] = useState<PublicUrgencyPayload | null>(null);
  const [mounted, setMounted] = useState(false);
  const [progressTick, setProgressTick] = useState(0);
  const viewLogged = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fn = () => setProgressTick((n) => n + 1);
    if (typeof window !== "undefined") {
      window.addEventListener("ascendra-funnel-progress", fn);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ascendra-funnel-progress", fn);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const vid = getVisitorId();
    const sid = getSessionId();
    const q = new URLSearchParams({ visitorId: vid, sessionId: sid });
    void fetch(`/api/public/urgency-conversion/${encodeURIComponent(surfaceKey)}?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: PublicUrgencyPayload | null) => setData(j))
      .catch(() => setData(null));
  }, [mounted, surfaceKey, getVisitorId, getSessionId]);

  useEffect(() => {
    if (!data?.active || !data.analyticsEnabled || viewLogged.current) return;
    viewLogged.current = true;
    track("urgency_surface_view", {
      pageVisited: typeof window !== "undefined" ? window.location.pathname : "/",
      metadata: {
        urgencySurface: surfaceKey,
        urgencyMode: data.urgencyMode,
        scarcityMode: data.scarcityMode,
      },
    });
  }, [data, surfaceKey, track]);

  const prereqOk = useMemo(() => {
    if (!data?.prerequisiteSurfaceKey) return true;
    void progressTick;
    return isPrerequisiteComplete(data.prerequisiteSurfaceKey);
  }, [data?.prerequisiteSurfaceKey, progressTick]);

  if (!data?.active) return null;

  const cta = data.cta;
  const prevStep = data.prerequisiteSurfaceKey
    ? data.microCommitment.funnelSteps.find((s) => s.key === data.prerequisiteSurfaceKey)
    : undefined;
  const pct = Math.min(
    100,
    ((data.microCommitment.funnelStepIndex + 1) / Math.max(1, data.microCommitment.funnelSteps.length)) * 100,
  );

  return (
    <Card className={`border-primary/20 bg-card/95 ${className ?? ""}`}>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your growth path</p>
          <div className="flex flex-wrap gap-1.5">
            {data.microCommitment.funnelSteps.map((st, i) => (
              <Badge
                key={st.key}
                variant={i <= data.microCommitment.funnelStepIndex ? "default" : "secondary"}
                className="text-xs font-normal"
              >
                {i + 1}. {st.label.includes("·") ? st.label.split("·")[1]!.trim() : st.label}
              </Badge>
            ))}
          </div>
          <Progress value={pct} className="h-1.5" aria-label="Progress through free growth tools" />
        </div>

        {data.prerequisiteSurfaceKey && !prereqOk ? (
          <Alert>
            <Lock className="h-4 w-4" aria-hidden />
            <AlertTitle className="text-sm">Complete the previous step</AlertTitle>
            <AlertDescription className="text-sm">
              This step builds on the last tool so recommendations stay relevant.{" "}
              {prevStep ? (
                <Link href={prevStep.href} className="font-medium text-primary underline underline-offset-2">
                  Go to {prevStep.label}
                </Link>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <Badge key={b} variant="outline" className="text-xs">
              {b}
            </Badge>
          ))}
        </div>

        {data.capacity?.label ? <p className="text-sm text-muted-foreground">{data.capacity.label}</p> : null}
        {data.capacity?.max != null &&
        data.capacity.max > 0 &&
        data.capacity.displayMode === "exact" &&
        !data.capacity.approximate ? (
          <Progress
            value={Math.min(100, (data.capacity.used / data.capacity.max) * 100)}
            className="h-2"
            aria-label={`Capacity used: ${data.capacity.used} of ${data.capacity.max}`}
          />
        ) : null}

        {data.countdown ? (
          <HonestDeadlineCountdown endsAtIso={data.countdown.endsAtIso} label={data.countdown.label} />
        ) : null}

        {data.proof && (data.proof.bullets.length > 0 || data.proof.title) ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            {data.proof.title ? <p className="text-sm font-semibold text-foreground">{data.proof.title}</p> : null}
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc pl-4">
              {data.proof.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {data.loss && (data.loss.bullets.length > 0 || data.loss.title) ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
            {data.loss.title ? <p className="text-sm font-semibold text-foreground">{data.loss.title}</p> : null}
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc pl-4">
              {data.loss.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {cta && prereqOk ? (
          <div className="space-y-2 pt-1">
            {cta.urgencyBadge ? <p className="text-xs font-medium text-primary">{cta.urgencyBadge}</p> : null}
            <Button asChild className="w-full sm:w-auto min-h-[44px] gap-2">
              <Link
                href={cta.href}
                onClick={() => {
                  track("urgency_cta_click", {
                    pageVisited: typeof window !== "undefined" ? window.location.pathname : "/",
                    metadata: {
                      urgencySurface: surfaceKey,
                      variantKey: cta.variantKey,
                      href: cta.href,
                    },
                  });
                }}
              >
                {cta.primaryText}
              </Link>
            </Button>
            {cta.subText ? <p className="text-xs text-muted-foreground">{cta.subText}</p> : null}
            {cta.scarcityNote ? <p className="text-xs text-muted-foreground">{cta.scarcityNote}</p> : null}
            {cta.proofNote ? <p className="text-xs text-muted-foreground italic">{cta.proofNote}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
