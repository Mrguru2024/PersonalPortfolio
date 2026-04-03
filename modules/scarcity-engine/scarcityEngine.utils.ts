export function calculateAvailableSlots(maxSlots: number, usedSlots: number): number {
  return Math.max(0, maxSlots - usedSlots);
}

export function getStatusFromUsage(availableSlots: number, maxSlots: number): "open" | "limited" | "full" {
  if (maxSlots <= 0) return "full";
  if (availableSlots <= 0) return "full";
  const ratio = availableSlots / maxSlots;
  if (ratio <= 0.2) return "limited";
  return "open";
}

export function getNextCycleDate(cycleStartDate: Date | undefined, cycleDurationDays: number): Date | null {
  if (!cycleStartDate || cycleDurationDays <= 0) return null;
  const now = new Date();
  let next = new Date(cycleStartDate);
  const durationMs = cycleDurationDays * 24 * 60 * 60 * 1000;
  while (next.getTime() <= now.getTime()) {
    next = new Date(next.getTime() + durationMs);
  }
  return next;
}

export function getDaysUntilNextCycle(nextCycleDate: Date | null): number {
  if (!nextCycleDate) return 0;
  const diff = nextCycleDate.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function evaluateCycleWindow(cycleStartDate: Date | undefined, cycleDurationDays: number) {
  if (!cycleStartDate || cycleDurationDays <= 0) {
    return {
      isOpen: true,
      nextCycleDate: null as Date | null,
      daysUntilNextCycle: 0,
      cycleStartDate: cycleStartDate ?? null,
    };
  }
  const now = Date.now();
  const start = cycleStartDate.getTime();
  const durationMs = cycleDurationDays * 24 * 60 * 60 * 1000;
  const isOpen = now >= start && now < start + durationMs;
  const nextCycleDate = isOpen ? getNextCycleDate(cycleStartDate, cycleDurationDays) : cycleStartDate;
  return {
    isOpen,
    nextCycleDate,
    daysUntilNextCycle: getDaysUntilNextCycle(nextCycleDate),
    cycleStartDate,
  };
}

export function evaluatePerformanceGate(
  thresholds: { conversionRateMin?: number; leadQualityMin?: number; revenueCentsMin?: number },
  actuals: { conversionRate: number; avgLeadQuality: number; revenueCents: number },
): boolean {
  if (thresholds.conversionRateMin != null && actuals.conversionRate < thresholds.conversionRateMin) return false;
  if (thresholds.leadQualityMin != null && actuals.avgLeadQuality < thresholds.leadQualityMin) return false;
  if (thresholds.revenueCentsMin != null && actuals.revenueCents < thresholds.revenueCentsMin) return false;
  return true;
}

export function formatScarcityMessage(input: {
  status: "open" | "limited" | "full" | "waitlist";
  availableSlots: number;
  waitlistCount: number;
  daysUntilNextCycle: number;
}): string {
  if (input.status === "open") return `${input.availableSlots} onboarding slots remaining`;
  if (input.status === "limited") return `${input.availableSlots} onboarding slots remaining`;
  if (input.status === "full") {
    if (input.daysUntilNextCycle > 0) {
      return `Capacity reached — next intake opens in ${input.daysUntilNextCycle} days`;
    }
    return "Capacity reached";
  }
  if (input.daysUntilNextCycle > 0) {
    return `${input.waitlistCount} businesses on waitlist — next intake opens in ${input.daysUntilNextCycle} days`;
  }
  return `${input.waitlistCount} businesses currently on waitlist`;
}
