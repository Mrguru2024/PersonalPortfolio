"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, PenLine, Megaphone, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LINKS: { href: string; label: string; icon: LucideIcon; hint: string }[] = [
  {
    href: "/admin/communications",
    label: "Overview",
    icon: LayoutDashboard,
    hint: "Snapshot of performance and shortcuts to common tasks",
  },
  {
    href: "/admin/communications/designs",
    label: "Designs",
    icon: PenLine,
    hint: "Build and save reusable email layouts and content blocks",
  },
  {
    href: "/admin/communications/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    hint: "Choose who receives each send and schedule or launch when ready",
  },
  {
    href: "/admin/communications/analytics",
    label: "Analytics",
    icon: BarChart3,
    hint: "See opens, clicks, and how each campaign performed over time",
  },
];

export function CommunicationsSubnav() {
  const pathname = usePathname();
  return (
    <TooltipProvider delayDuration={250}>
      <nav
        className="flex flex-wrap gap-2 border-b border-border pb-3 mb-6 scroll-smooth"
        aria-label="Communications sections"
      >
        {LINKS.map(({ href, label, icon: Icon, hint }) => {
          const active = pathname === href || (href !== "/admin/communications" && pathname.startsWith(href));
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active ?
                      "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-left leading-snug">
                {hint}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
