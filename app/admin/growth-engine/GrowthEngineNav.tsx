"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/growth-engine", label: "Overview" },
  { href: "/admin/growth-engine/revenue", label: "Revenue" },
  { href: "/admin/growth-engine/alerts", label: "Lead alerts" },
  { href: "/admin/growth-engine/automations", label: "Automations" },
  { href: "/admin/growth-engine/roi", label: "ROI & costs" },
  { href: "/admin/growth-engine/calls", label: "Calls" },
  { href: "/admin/growth-engine/knowledge", label: "Knowledge" },
  { href: "/admin/growth-engine/funnel-overview", label: "Funnel overview" },
  { href: "/admin/growth-engine/funnel-canvas", label: "Funnel canvas" },
];

export function GrowthEngineShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/80 bg-muted/20" aria-label="Growth engine">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-1 py-2 px-4 mb-8">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/admin/growth-engine" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
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
      <div className="max-w-6xl mx-auto px-4 pb-16">{children}</div>
    </div>
  );
}
