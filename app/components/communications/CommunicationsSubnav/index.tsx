"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, PenLine, Megaphone, BarChart3, Mail } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/communications", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/email-hub", label: "Email Hub", icon: Mail },
  { href: "/admin/communications/designs", label: "Email builder & templates", icon: PenLine },
  { href: "/admin/communications/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/communications/analytics", label: "Analytics", icon: BarChart3 },
];

export function CommunicationsSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3 mb-6" aria-label="Communications">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin/communications" && pathname.startsWith(href));
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
