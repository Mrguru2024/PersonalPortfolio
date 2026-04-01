"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FlaskConical, LayoutGrid, LineChart, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items: readonly {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}[] = [
  { href: "/admin/experiments", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/experiments/new", label: "New experiment", icon: Plus },
  { href: "/admin/experiments/reports", label: "Reports", icon: LineChart },
  { href: "/admin/experiments/patterns", label: "Patterns", icon: BarChart3 },
];

export function ExperimentsSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex flex-wrap items-center gap-2 sm:gap-2.5 border-b border-border/60 pb-3"
      aria-label="Experiments sections"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </Link>
        );
      })}
      <Link
        href="/admin/analytics"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors ml-auto"
      >
        <FlaskConical className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        Website analytics
      </Link>
    </nav>
  );
}
