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
  ChevronDown,
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
import { AUDIT_PATH, STRATEGY_CALL_PATH, LAUNCH_YOUR_BRAND_PATH, REBRAND_YOUR_BUSINESS_PATH, MARKETING_ASSETS_PATH } from "@/lib/funnelCtas";
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

  const isHomePage = pathname === "/";

  /** Single source of truth: primary nav + dropdowns. On home, Home/Blog use scroll anchors. */
  const primaryNav = [
    { name: "Home", href: "/", scrollOnHome: "#home" },
    { name: "Brand Growth", href: "/brand-growth" },
    { name: "Blog", href: "/blog", scrollOnHome: "#blog" },
  ];
  const servicesSubmenu = [
    { name: "Launch your brand", href: LAUNCH_YOUR_BRAND_PATH },
    { name: "Rebrand your business", href: REBRAND_YOUR_BUSINESS_PATH },
    { name: "Marketing assets", href: MARKETING_ASSETS_PATH },
  ];
  const whoWeServeSubmenu = [
    { name: "For Contractors", href: "/contractor-systems" },
    { name: "Local Business", href: "/local-business-growth" },
    { name: "Startup MVP", href: "/startup-mvp-development" },
  ];
  const bookCallHref = isHomePage ? "#contact" : STRATEGY_CALL_PATH;
  const isScrollLink = (item: (typeof primaryNav)[0]) => isHomePage && "scrollOnHome" in item && item.scrollOnHome;
  const getLinkHref = (item: (typeof primaryNav)[0]) => ("scrollOnHome" in item && item.scrollOnHome ? item.scrollOnHome : item.href);

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

  const scrollToSection = (href: string) => {
    closeMobileMenu();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
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
        <div className="hidden md:block flex-1 min-w-0" aria-hidden />
        {/* Center: consolidated nav — primary links, Services & Who we serve dropdowns, CTAs */}
        <nav className="hidden md:flex flex-shrink-0 items-center gap-1 sm:gap-2 lg:gap-4" aria-label="Main navigation">
          {primaryNav.map((item) =>
            isScrollLink(item) ? (
              <button
                key={item.name}
                type="button"
                onClick={() => scrollToSection(getLinkHref(item) as string)}
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1"
              >
                {item.name}
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1"
              >
                {item.name}
              </Link>
            )
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 flex items-center gap-0.5 outline-none"
              >
                Services <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {servicesSubmenu.map((sub) => (
                <DropdownMenuItem key={sub.href} asChild>
                  <Link href={sub.href} className="cursor-pointer">
                    {sub.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 flex items-center gap-0.5 outline-none"
              >
                Who we serve <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {whoWeServeSubmenu.map((sub) => (
                <DropdownMenuItem key={sub.href} asChild>
                  <Link href={sub.href} className="cursor-pointer">
                    {sub.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/about" className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 hidden md:inline">About</Link>
          <Link href="/results" className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 hidden md:inline">Results</Link>
          <Link href="/services" className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 hidden md:inline">Services</Link>
          <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-border/60">
            <Button asChild size="sm" variant="ghost" className="text-foreground/80 hover:text-primary font-medium text-sm">
              <Link href={AUDIT_PATH}>Free Audit</Link>
            </Button>
            {isHomePage ? (
              <Button type="button" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm" onClick={() => scrollToSection("#contact")}>
                Book a call
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                <Link href={STRATEGY_CALL_PATH}>Book a call</Link>
              </Button>
            )}
          </div>
        </nav>
        {/* Right: auth + theme (original position) */}
        <div className="flex flex-1 min-w-0 justify-end items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Button asChild size="sm" className="min-h-[44px] sm:min-h-[36px]">
              <Link href={AUDIT_PATH}>
                <Search className="h-4 w-4 mr-1.5 shrink-0" />
                Request Audit
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
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 min-h-[44px] sm:min-h-[36px] px-3"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Login</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: menu button + theme (nav links in dropdown below) */}
        <div className="flex items-center gap-3 md:hidden shrink-0">
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
        <div className="md:hidden fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]" style={{ top: 0 }}>
          {/* Backdrop: tap to close, prevents touch scroll from hitting body */}
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] touch-none"
            onClick={closeMobileMenu}
          />
          <div className="container mx-auto px-4 pb-4 pt-3 relative z-10 flex-1 min-h-0 flex flex-col">
            <div className="rounded-2xl border border-border/60 bg-muted/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-muted/85 overflow-hidden flex flex-col max-h-[min(calc(100vh-8rem),560px)]">
              <div className="flex flex-col gap-1 overflow-y-auto overscroll-contain py-1 -my-1">
                {primaryNav.map((item) =>
                  isScrollLink(item) ? (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => { scrollToSection(getLinkHref(item) as string); }}
                      className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition block py-3 px-2"
                    >
                      {item.name}
                    </Link>
                  )
                )}
                <Link href="/services" onClick={closeMobileMenu} className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition block">Services</Link>
                <Link href="/about" onClick={closeMobileMenu} className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition block">About</Link>
                <Link href="/results" onClick={closeMobileMenu} className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition block">Results</Link>
                <Link href="/contact" onClick={closeMobileMenu} className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-background/70 transition block">Contact</Link>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Services</div>
                {servicesSubmenu.map((sub) => (
                  <Link key={sub.href} href={sub.href} onClick={closeMobileMenu} className="text-foreground/80 hover:text-primary font-medium py-2.5 px-2 rounded-md hover:bg-background/70 transition pl-4">
                    {sub.name}
                  </Link>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Who we serve</div>
                {whoWeServeSubmenu.map((sub) => (
                  <Link key={sub.href} href={sub.href} onClick={closeMobileMenu} className="text-foreground/80 hover:text-primary font-medium py-2.5 px-2 rounded-md hover:bg-background/70 transition pl-4">
                    {sub.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/70">
                  <Link href={AUDIT_PATH} onClick={closeMobileMenu} className="flex items-center justify-center gap-2 py-3 px-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90">
                    Free Audit
                  </Link>
                  {isHomePage ? (
                    <button type="button" onClick={() => scrollToSection("#contact")} className="flex items-center justify-center py-3 px-3 rounded-md border border-border font-medium text-sm hover:bg-accent">
                      Book a call
                    </button>
                  ) : (
                    <Link href={STRATEGY_CALL_PATH} onClick={closeMobileMenu} className="flex items-center justify-center py-3 px-3 rounded-md border border-border font-medium text-sm hover:bg-accent">
                      Book a call
                    </Link>
                  )}
                </div>

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
