"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  Receipt,
  Megaphone,
  MessageSquare,
  Mail,
  BarChart3,
  Users,
  Contact,
  Search,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AUDIT_PATH } from "@/lib/funnelCtas";

interface HeaderProps {
  currentSection?: string;
  onNavToggle?: () => void;
}

export default function Header(_props: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logoutMutation } = useAuth();

  // Avoid hydration mismatch: server has no session, client may have user from cookie
  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Digital Growth Audit", href: "/audit" },
    { name: "About", href: "/about" },
    { name: "Results", href: "/results" },
    { name: "Contact", href: "/contact" },
  ];

  const adminPages = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "CRM", href: "/admin/crm", icon: Contact },
    { name: "Blog", href: "/admin/blog", icon: FileText },
    { name: "Blog Analytics", href: "/admin/blog/analytics", icon: BarChart3 },
    { name: "Invoices", href: "/admin/invoices", icon: Receipt },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
    { name: "Newsletters", href: "/admin/newsletters", icon: Mail },
    {
      name: "Newsletter Subscribers",
      href: "/admin/newsletters/subscribers",
      icon: Users,
    },
  ];

  const isApprovedAdmin =
    user?.isAdmin === true && user?.adminApproved === true;

  // Lock body scroll when mobile menu is open so background doesn't scroll
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [mobileMenuOpen]);

  // Close menu on scroll (e.g. after section link tap or if scroll slips through)
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleScroll = () => closeMobileMenu();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Close menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className="!bg-transparent !border-0 !shadow-none shrink-0"
      style={{ background: "transparent", border: "none", boxShadow: "none" }}
    >
      <div
        className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 py-3 flex items-center !bg-transparent !border-0 !shadow-none min-w-0 max-w-full"
        style={{ background: "transparent", border: "none", boxShadow: "none" }}
      >
        {/* Left spacer (logo was here) */}
        <div className="hidden lg:block flex-1 min-w-0" aria-hidden />
        {/* Center: nav */}
        <nav className="hidden lg:flex flex-shrink-0 space-x-6 xl:space-x-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`font-medium transition text-sm ${
                isActiveLink(item.href)
                  ? "text-primary"
                  : "text-foreground/80 hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        {/* Right: auth + theme (original position) */}
        <div className="flex flex-1 min-w-0 justify-end items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Button
              asChild
              size="sm"
              className="min-h-[44px] sm:min-h-[36px] px-2 xl:px-3"
            >
              <Link href={AUDIT_PATH} aria-label="Request Audit">
                <Search className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline ml-1.5">Request Audit</span>
              </Link>
            </Button>
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  <DropdownMenuItem className="cursor-default">
                    <span className="text-sm font-medium">
                      @{user.username}
                    </span>
                  </DropdownMenuItem>
                  {isApprovedAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          <span>Admin</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="min-w-[200px]">
                          {adminPages.map((page) => {
                            const Icon = page.icon;
                            return (
                              <DropdownMenuItem key={page.href} asChild>
                                <Link
                                  href={page.href}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <Icon className="h-4 w-4 shrink-0" />
                                  <span>{page.name}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth"
                aria-label="Login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 min-h-[44px] sm:min-h-[36px] w-9 xl:w-auto px-0 xl:px-3"
              >
                <LogIn className="h-4 w-4 shrink-0 xl:mr-1.5" />
                <span className="hidden xl:inline">Login</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: menu button + theme (nav links in dropdown below) */}
        <div className="flex items-center gap-3 lg:hidden shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="h-10 min-h-[44px] px-3 gap-2 text-foreground font-medium border border-border/50"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 shrink-0" />
            ) : (
              <Menu className="h-5 w-5 shrink-0" />
            )}
            <span>{mobileMenuOpen ? "Close" : "Menu"}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation - visible when menu is open */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]" style={{ top: 0 }}>
          {/* Backdrop: tap to close, prevents touch scroll from hitting body */}
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] touch-none"
            onClick={closeMobileMenu}
          />
          <div className="container mx-auto px-4 pb-4 pt-3 relative z-10 flex-1 min-h-0 flex flex-col">
            <div className="rounded-2xl border border-border/60 bg-muted/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-muted/85 overflow-hidden flex flex-col max-h-[min(calc(100vh-8rem),480px)]">
              <div className="flex flex-col gap-1 overflow-y-auto overscroll-contain py-1 -my-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`text-left font-medium py-3 px-2 rounded-md transition block ${
                      isActiveLink(item.href)
                        ? "text-primary bg-background/70"
                        : "text-foreground/80 hover:text-primary hover:bg-background/70"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Button asChild className="mt-2 min-h-[44px]">
                  <Link href={AUDIT_PATH} onClick={closeMobileMenu}>
                    <Search className="h-4 w-4 mr-2 shrink-0" />
                    Request Audit
                  </Link>
                </Button>

                <div className="pt-3 mt-3 border-t border-border/70">
                  {mounted && user ? (
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-sm font-medium text-foreground/80">
                        Logged in as @{user.username}
                      </div>
                      {isApprovedAdmin && (
                        <div className="space-y-1">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            Admin
                          </div>
                          {adminPages.map((page) => {
                            const Icon = page.icon;
                            return (
                              <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-2 text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition"
                                onClick={closeMobileMenu}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{page.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          logoutMutation.mutate();
                          closeMobileMenu();
                        }}
                        className="flex items-center w-full text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition"
                      >
                        <LogOut className="h-4 w-4 mr-2 shrink-0" /> Log out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      className="flex items-center text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition"
                      onClick={closeMobileMenu}
                    >
                      <LogIn className="h-4 w-4 mr-2 shrink-0" /> Login /
                      Register
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
