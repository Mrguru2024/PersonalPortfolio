"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  CalendarDays,
  Inbox,
  FileStack,
  Tags,
  Clock,
  Users,
  Share2,
  GitBranch,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon; match: "exact" | "prefix" }[] = [
  { href: "/admin/scheduler", label: "Overview", icon: LayoutGrid, match: "exact" },
  { href: "/admin/scheduler/calendar", label: "Calendar", icon: CalendarDays, match: "prefix" },
  { href: "/admin/scheduler/appointments", label: "Appointments", icon: Inbox, match: "prefix" },
  { href: "/admin/scheduler/booking-pages", label: "Booking pages", icon: FileStack, match: "prefix" },
  { href: "/admin/scheduler/event-types", label: "Event types", icon: Tags, match: "prefix" },
  { href: "/admin/scheduler/availability", label: "Availability", icon: Clock, match: "prefix" },
  { href: "/admin/scheduler/team", label: "Team", icon: Users, match: "prefix" },
  { href: "/admin/scheduler/routing-rules", label: "Routing", icon: Share2, match: "prefix" },
  { href: "/admin/scheduler/workflows", label: "Workflows", icon: GitBranch, match: "prefix" },
  { href: "/admin/scheduler/payments", label: "Payments", icon: CreditCard, match: "prefix" },
  { href: "/admin/scheduler/analytics", label: "Analytics", icon: BarChart3, match: "prefix" },
  { href: "/admin/scheduler/settings", label: "Settings", icon: Settings, match: "prefix" },
];

export function SchedulerSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1.5 border-b border-border/60 pb-3 mb-6"
      aria-label="Ascendra Scheduler"
    >
      {LINKS.map(({ href, label, icon: Icon, match }) => {
        const active =
          match === "exact"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors min-h-[40px] sm:min-h-0",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
