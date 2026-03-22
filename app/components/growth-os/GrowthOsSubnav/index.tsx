"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Shield, FileKey, ClipboardList, PenLine, Brain, Inbox, TrendingUp } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/growth-os", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/growth-os/revenue-ops", label: "Revenue ops", icon: TrendingUp },
  { href: "/admin/lead-intake", label: "Lead intake", icon: Inbox },
  { href: "/admin/growth-os/intelligence", label: "Intelligence", icon: Brain },
  { href: "/admin/growth-os/security", label: "Activity log", icon: Shield },
  { href: "/admin/growth-os/shares", label: "Client shares", icon: FileKey },
  { href: "/admin/internal-audit", label: "Funnel audit", icon: ClipboardList },
  { href: "/admin/content-studio", label: "Content studio", icon: PenLine },
];

export function GrowthOsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border/60 pb-4 mb-6"
      aria-label="Growth OS sections"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href === "/admin/lead-intake" && pathname.startsWith("/admin/lead-intake")) ||
          (href === "/admin/growth-os/intelligence" && pathname.startsWith("/admin/growth-os/intelligence")) ||
          (href.startsWith("/admin/growth-os/") && pathname.startsWith(href)) ||
          (href === "/admin/internal-audit" && pathname.startsWith("/admin/internal-audit")) ||
          (href === "/admin/content-studio" && pathname.startsWith("/admin/content-studio"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
