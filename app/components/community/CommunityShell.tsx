"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  BookOpen,
  Handshake,
  LayoutDashboard,
  Home,
  User,
  Settings,
  Mail,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/Afn/home", label: "Home", icon: Home },
  { href: "/Afn/feed", label: "Feed", icon: MessageSquare },
  { href: "/Afn/collab", label: "Collaboration", icon: Handshake },
  { href: "/Afn/members", label: "Members", icon: Users },
  { href: "/Afn/resources", label: "Resources", icon: BookOpen },
  { href: "/Afn/inbox", label: "Inbox", icon: Mail },
];

const USER_ITEMS = [
  { href: "/Afn/profile", label: "Profile", icon: User },
  { href: "/Afn/settings", label: "Settings", icon: Settings },
];

export function CommunityShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
      {USER_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Community navigation</SheetTitle>
                <div className="flex flex-col gap-1 pt-6 px-3">
                  <Link
                    href="/Afn"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    AFN
                  </Link>
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
            <Link
              href="/Afn"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Founder Network</span>
            </Link>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            <NavLinks />
          </nav>
        </div>
      </header>
      <main className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-6 lg:py-8">{children}</main>
    </div>
  );
}
