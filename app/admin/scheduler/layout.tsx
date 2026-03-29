import type { ReactNode } from "react";
import { GrowthOsSubnav } from "@/components/growth-os/GrowthOsSubnav";
import { SchedulerSubnav } from "@/components/scheduler/SchedulerSubnav";

export default function AdminSchedulerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-8 max-w-7xl">
      <GrowthOsSubnav />
      <SchedulerSubnav />
      {children}
    </div>
  );
}
