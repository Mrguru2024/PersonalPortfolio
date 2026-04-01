"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Shield,
  FileKey,
  ClipboardList,
  PenLine,
  Brain,
  Inbox,
  TrendingUp,
  Calendar,
  CalendarDays,
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

type Match =
  | "growthOsRoot"
  | "bookingsHub"
  | "schedulerChildPrefix"
  | "growthOsSubpath"
  | "leadIntake"
  | "intelligence"
  | "internalAudit"
  | "contentStudio";

type NavItem = { href: string; label: string; icon: LucideIcon; match: Match };

const GROWTH_OVERVIEW: NavItem = {
  href: "/admin/growth-os",
  label: "Overview",
  icon: LayoutDashboard,
  match: "growthOsRoot",
};

const BOOKINGS_HUB: NavItem = {
  href: "/admin/scheduler",
  label: "Bookings & calendar",
  icon: Calendar,
  match: "bookingsHub",
};

const SCHEDULER_CHILDREN: NavItem[] = [
  { href: "/admin/scheduler/calendar", label: "Calendar", icon: CalendarDays, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/appointments", label: "Appointments", icon: Inbox, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/booking-pages", label: "Booking pages", icon: FileStack, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/event-types", label: "Meeting types", icon: Tags, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/availability", label: "Availability", icon: Clock, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/team", label: "Team", icon: Users, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/routing-rules", label: "Routing", icon: Share2, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/workflows", label: "Workflows", icon: GitBranch, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/payments", label: "Payments", icon: CreditCard, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/analytics", label: "Reports", icon: BarChart3, match: "schedulerChildPrefix" },
  { href: "/admin/scheduler/settings", label: "Settings", icon: Settings, match: "schedulerChildPrefix" },
];

const GROWTH_REST: NavItem[] = [
  { href: "/admin/growth-os/revenue-ops", label: "Revenue ops", icon: TrendingUp, match: "growthOsSubpath" },
  { href: "/admin/lead-intake", label: "Lead intake", icon: Inbox, match: "leadIntake" },
  { href: "/admin/growth-os/intelligence", label: "Market research", icon: Brain, match: "intelligence" },
  { href: "/admin/growth-os/security", label: "Activity log", icon: Shield, match: "growthOsSubpath" },
  { href: "/admin/growth-os/shares", label: "Client shares", icon: FileKey, match: "growthOsSubpath" },
  { href: "/admin/internal-audit", label: "Funnel audit", icon: ClipboardList, match: "internalAudit" },
  { href: "/admin/content-studio", label: "Content studio", icon: PenLine, match: "contentStudio" },
];

const ALL_ITEMS: NavItem[] = [GROWTH_OVERVIEW, BOOKINGS_HUB, ...SCHEDULER_CHILDREN, ...GROWTH_REST];

function isItemActive(pathname: string, item: NavItem): boolean {
  const { href, match } = item;
  switch (match) {
    case "growthOsRoot":
      return pathname === href;
    case "bookingsHub":
      return pathname === href || pathname.startsWith("/admin/scheduling");
    case "schedulerChildPrefix":
      return pathname === href || pathname.startsWith(`${href}/`);
    case "growthOsSubpath":
      return pathname === href || pathname.startsWith(`${href}/`);
    case "leadIntake":
      return pathname.startsWith("/admin/lead-intake");
    case "intelligence":
      return pathname.startsWith("/admin/growth-os/intelligence");
    case "internalAudit":
      return pathname.startsWith("/admin/internal-audit");
    case "contentStudio":
      return pathname.startsWith("/admin/content-studio");
    default:
      return pathname === href;
  }
}

/** Single consolidated strip: Growth OS + bookings hub + scheduler tools + other Growth OS links (no duplicate “Overview” rows). */
export function SchedulerAdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4 mb-6"
      aria-label="Admin navigation"
    >
      {ALL_ITEMS.map((item, index) => {
        const active = isItemActive(pathname, item);
        const showDividerBefore = index === 1 || index === 2 + SCHEDULER_CHILDREN.length;
        const Icon = item.icon;
        return (
          <span key={item.href} className="inline-flex items-center gap-2">
            {showDividerBefore ? (
              <span
                className="hidden sm:inline-block h-6 w-px shrink-0 bg-border/80 mx-0.5"
                aria-hidden
              />
            ) : null}
            <Link
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0 min-h-[44px] sm:min-h-0",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
