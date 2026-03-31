"use client";

import { AscendraBehaviorPageTracker } from "./AscendraBehaviorPageTracker";

/**
 * Client-only tracker mount. Prefer **`AscendraBehaviorRootGate`** in root layout (see `behaviorTrackingConfig`);
 * keep this for rare layouts that must opt in outside the root gate.
 */
export function AscendraBehaviorMount() {
  return <AscendraBehaviorPageTracker />;
}
