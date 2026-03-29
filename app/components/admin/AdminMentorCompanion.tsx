"use client";

import { useAdminMentorObservation } from "@/hooks/useAdminMentorObservation";

/** Invisible: opt-in path observation + mentor checkpoint refresh (see Admin settings). */
export function AdminMentorCompanion() {
  useAdminMentorObservation();
  return null;
}
