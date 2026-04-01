"use client";

import { usePathname } from "next/navigation";
import { AscendraBehaviorMount } from "./AscendraBehaviorMount";
import {
  ascendraBehaviorTrackingPathAllowed,
  ascendraBehaviorTrackingPathExcluded,
} from "@/lib/behaviorTrackingConfig";

/**
 * Mounts `startAscendraBehaviorTracking` for the current route when site-wide tracking is enabled
 * (see `behaviorTrackingConfig` + root layout). Prefer this over per-page `<AscendraBehaviorMount />`.
 */
export function AscendraBehaviorRootGate({ enabled }: { enabled: boolean }) {
  const pathname = usePathname() ?? "/";
  if (!enabled) return null;
  if (ascendraBehaviorTrackingPathExcluded(pathname)) return null;
  if (!ascendraBehaviorTrackingPathAllowed(pathname)) return null;
  return <AscendraBehaviorMount />;
}
