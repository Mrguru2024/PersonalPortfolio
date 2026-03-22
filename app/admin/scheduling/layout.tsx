import type { ReactNode } from "react";
import { GrowthOsSubnav } from "@/components/growth-os/GrowthOsSubnav";

export default function AdminSchedulingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-8 max-w-5xl">
      <GrowthOsSubnav />
      {children}
    </div>
  );
}
