import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/admin/agency-os", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/agency-os/hvd", label: "Value (HVD)", icon: Target },
  { href: "/admin/agency-os/tasks", label: "Tasks & acceptance", icon: ClipboardList },
] as const;

export default function AgencyOsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/admin/agency-os" className="font-semibold text-sm shrink-0">
            Agency OS
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin/dashboard"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            ← Admin
          </Link>
        </div>
      </header>
      <main className="container max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
