"use client";

import { AscendraBehaviorPageTracker } from "./AscendraBehaviorPageTracker";

/** Import from server routes via this wrapper so the client boundary resolves the tracker reliably during prerender. */
export function AscendraBehaviorMount() {
  return <AscendraBehaviorPageTracker />;
}
