import type { CollisionDetection } from "@dnd-kit/core";
import { closestCenter, pointerWithin, rectIntersection } from "@dnd-kit/core";

/** Prefer pointer hit on month cells; fall back to closest center for list reordering. */
export const calendarCollisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;

  const rect = rectIntersection(args);
  if (rect.length > 0) return rect;

  return closestCenter(args);
};

export const CALENDAR_SORTABLE_TRANSITION = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.45, 1)",
} as const;
