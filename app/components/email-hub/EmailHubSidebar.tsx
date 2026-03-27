"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pencil,
  FileEdit,
  CalendarClock,
  Send,
  LayoutTemplate,
  ImageIcon,
  Users,
  Activity,
  Settings,
  Mail,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/admin/email-hub", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/email-hub/compose", label: "Compose", icon: Pencil },
  { href: "/admin/email-hub/drafts", label: "Drafts", icon: FileEdit },
  { href: "/admin/email-hub/scheduled", label: "Scheduled", icon: CalendarClock },
  { href: "/admin/email-hub/sent", label: "Sent", icon: Send },
  { href: "/admin/email-hub/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/admin/email-hub/assets", label: "Brand assets", icon: ImageIcon },
  { href: "/admin/email-hub/contacts", label: "Contacts", icon: Users },
  { href: "/admin/email-hub/tracking", label: "Tracking", icon: Activity },
  { href: "/admin/email-hub/settings", label: "Settings", icon: Settings },
];

export function EmailHubSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full lg:w-56 shrink-0 border border-border/60 rounded-2xl bg-card/80 backdrop-blur-sm shadow-sm p-3 lg:sticky lg:top-6">
      <div className="flex items-center gap-2 px-2 py-2 mb-2">
        <div className="rounded-lg bg-primary/15 p-2">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Hub</p>
          <p className="text-sm font-semibold leading-tight">Outbound workspace</p>
        </div>
      </div>
      <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                active ?
                  "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <p className="mt-4 px-2 text-[11px] text-muted-foreground leading-snug hidden lg:block">
        Connect Gmail or Microsoft under Inbox to sync threads, read state, and reply alongside Brevo outbound.
      </p>
    </aside>
  );
}
