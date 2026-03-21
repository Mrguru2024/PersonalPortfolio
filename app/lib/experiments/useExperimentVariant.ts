"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPostHogClient } from "@/lib/analytics/posthog-client";
import {
  EXPERIMENT_CATALOG,
  type ExperimentKey,
} from "@/lib/experiments/catalog";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

const EXPOSURE_STORAGE_KEY = "asc_exp_exposures";

interface UseExperimentOptions {
  pageVisited: string;
}

export function useExperimentVariant(
  key: ExperimentKey,
  options: UseExperimentOptions
) {
  const definition = EXPERIMENT_CATALOG[key];
  const { track, getVisitorId } = useVisitorTracking();
  const [variant, setVariant] = useState<string>(definition.defaultVariant);
  const [source, setSource] = useState<"deterministic" | "posthog">("deterministic");
  const [loading, setLoading] = useState(true);
  const exposureTrackedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const visitorId = getVisitorId();
    async function resolveVariant() {
      try {
        const res = await fetch("/api/experiments/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: [key], visitorId }),
        });
        if (!res.ok) throw new Error("assignment_failed");
        const data = await res.json();
        const assignment = data?.assignments?.[key];
        if (!assignment || !mounted) return;
        setVariant(assignment.variant || definition.defaultVariant);
        setSource(assignment.source || "deterministic");
      } catch {
        if (mounted) {
          setVariant(definition.defaultVariant);
          setSource("deterministic");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolveVariant();
    return () => {
      mounted = false;
    };
  }, [definition.defaultVariant, getVisitorId, key]);

  useEffect(() => {
    if (loading || exposureTrackedRef.current) return;
    const dedupeKey = `${key}:${variant}`;
    try {
      const raw = sessionStorage.getItem(EXPOSURE_STORAGE_KEY);
      const seen = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      if (seen[dedupeKey]) {
        exposureTrackedRef.current = true;
        return;
      }
      seen[dedupeKey] = true;
      sessionStorage.setItem(EXPOSURE_STORAGE_KEY, JSON.stringify(seen));
    } catch {
      // ignore dedupe storage failures
    }

    track("experiment_exposure", {
      pageVisited: options.pageVisited,
      metadata: {
        experiment_key: key,
        experiment_variant: variant,
        experiment_source: source,
      },
    });
    const posthog = getPostHogClient();
    posthog.capture("experiment_exposure", {
      experiment_key: key,
      experiment_variant: variant,
      experiment_source: source,
      page: options.pageVisited,
    });
    exposureTrackedRef.current = true;
  }, [key, loading, options.pageVisited, source, track, variant]);

  const trackConversion = useCallback(
    (conversionLabel: string, metadata?: Record<string, unknown>) => {
      track("experiment_conversion", {
        pageVisited: options.pageVisited,
        metadata: {
          experiment_key: key,
          experiment_variant: variant,
          conversion_label: conversionLabel,
          ...metadata,
        },
      });
      const posthog = getPostHogClient();
      posthog.capture("experiment_conversion", {
        experiment_key: key,
        experiment_variant: variant,
        conversion_label: conversionLabel,
        page: options.pageVisited,
        ...metadata,
      });
    },
    [key, options.pageVisited, track, variant]
  );

  return useMemo(
    () => ({
      variant,
      source,
      loading,
      trackConversion,
      definition,
    }),
    [definition, loading, source, trackConversion, variant]
  );
}
