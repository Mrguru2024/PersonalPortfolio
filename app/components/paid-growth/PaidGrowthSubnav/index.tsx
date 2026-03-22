"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Link2, ClipboardCheck, Megaphone, LineChart, HeartPulse } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/paid-growth", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/paid-growth/accounts", label: "Accounts", icon: Link2 },
  { href: "/admin/paid-growth/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/paid-growth/lead-quality", label: "Lead quality", icon: HeartPulse },
  { href: "/admin/paid-growth/readiness", label: "Readiness guide", icon: ClipboardCheck },
  { href: "/admin/paid-growth/reports", label: "Reports", icon: LineChart },
];

export function PaidGrowthSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3 mb-6" aria-label="Paid Growth">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin/paid-growth" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
