import { GrowthIntelligenceSubnav } from "@/components/admin/growth-intelligence/GrowthIntelligenceSubnav";

/**
 * Ascendra Growth Intelligence — unified subnav across /admin/behavior-intelligence/* (session intelligence module).
 * Client-facing name for summaries: “Conversion Diagnostics” (separate /growth-system/conversion-diagnostics).
 */
export default function GrowthIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Ascendra Growth Intelligence</p>
        <GrowthIntelligenceSubnav />
      </div>
      {children}
    </div>
  );
}
