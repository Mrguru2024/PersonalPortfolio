/**
 * Visual documentation. If you add Storybook, wire this file in `.storybook/main`.
 */
import { HostAvailabilitySettings } from "./index";

export default {
  title: "scheduling/HostAvailabilitySettings",
  component: HostAvailabilitySettings,
};

export function WithRulesAndBlocked() {
  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <HostAvailabilitySettings
        initialData={{
          timezone: "America/New_York",
          weeklyRules: [
            { dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "17:00" },
            { dayOfWeek: 3, startTimeLocal: "10:00", endTimeLocal: "14:00" },
          ],
          blockedDates: ["2026-12-25"],
        }}
      />
    </div>
  );
}

export function InheritGlobal() {
  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <HostAvailabilitySettings
        initialData={{
          timezone: "America/New_York",
          weeklyRules: [],
          blockedDates: [],
        }}
      />
    </div>
  );
}
