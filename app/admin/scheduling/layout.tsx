import type { ReactNode } from "react";
import { SchedulerAdminNav } from "@/components/scheduler/SchedulerAdminNav";

export default function AdminSchedulingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-8 max-w-5xl">
      <SchedulerAdminNav />
      {children}
    </div>
  );
}
