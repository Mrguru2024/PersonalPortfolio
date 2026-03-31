"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/behavior-intelligence", label: "Overview" },
  { href: "/admin/growth-engine", label: "Growth engine" },
  { href: "/admin/behavior-intelligence/conversion-diagnostics", label: "Conversion Diagnostics" },
  { href: "/admin/behavior-intelligence/visitors", label: "Visitor activity" },
  { href: "/admin/behavior-intelligence/watch", label: "Watch & reports" },
  { href: "/admin/behavior-intelligence/replays", label: "Session replays" },
  { href: "/admin/behavior-intelligence/heatmaps", label: "Heatmaps" },
  { href: "/admin/behavior-intelligence/surveys", label: "Surveys" },
  { href: "/admin/behavior-intelligence/friction-reports", label: "Friction" },
  { href: "/admin/behavior-intelligence/insight-tasks", label: "Insight tasks" },
  { href: "/admin/experiments", label: "Experiments" },
  { href: "/admin/behavior-intelligence/user-tests", label: "User tests" },
];

export function GrowthIntelligenceSubnav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className="border-b border-border/80 bg-muted/20 -mx-4 px-4 mb-8"
      aria-label="Ascendra Growth Intelligence"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap gap-1 py-2">
        {LINKS.map(({ href, label }) => {
          const active =
            href === "/admin/behavior-intelligence" ?
              pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ?
                  "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
