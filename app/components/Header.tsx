"use client";

import { useState, useEffect, useRef } from "react";
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
  Send,
  BarChart3,
  Users,
  Contact,
  Filter,
  UserCog,
  Activity,
  Link2,
  CloudUpload,
  TrendingUp,
  LineChart,
  Settings,
  Brain,
  Sparkles,
  Inbox,
  Target,
  Map as MapIcon,
  FolderOpen,
} from "lucide-react";
import {
  STRATEGY_CALL_PATH,
  LAUNCH_YOUR_BRAND_PATH,
  REBRAND_YOUR_BUSINESS_PATH,
  MARKETING_ASSETS_PATH,
  FREE_GROWTH_TOOLS_PATH,
  DIAGNOSTICS_HUB_PATH,
} from "@/lib/funnelCtas";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminChatNotificationBell } from "@/components/AdminChatNotificationBell";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

interface HeaderProps {
  currentSection?: string;
  onNavToggle?: () => void;
}

type NavLink = { name: string; href: string };

type NavSection = { label: string; links: NavLink[] };

const sectionLabelClass =
  "px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider";

function groupAdminPagesBySection<
  T extends { section: string; href: string },
>(pages: T[], sectionOrder: readonly string[]): { label: string; items: T[] }[] {
  const by = new Map<string, T[]>();
  for (const p of pages) {
    const list = by.get(p.section) ?? [];
    list.push(p);
    by.set(p.section, list);
  }
  return sectionOrder
    .filter((label) => (by.get(label)?.length ?? 0) > 0)
    .map((label) => ({ label, items: by.get(label)! }));
}

const ADMIN_NAV_SECTION_ORDER = [
  "Overview",
  "CRM & leads",
  "Content & email",
  "Marketing & funnel",
  "Analytics",
  "Operations",
  "Settings",
  "Site tools",
] as const;

export default function Header(_props: HeaderProps) {
  const { isOpen: mobileMenuOpen, close: closeMobileMenu, toggle: toggleMobileMenu } = useMobileNav();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { track } = useVisitorTracking();
  const { user, logoutMutation } = useAuth();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  /** Avoid hydration mismatch: media queries aren’t evaluated the same during SSR vs first paint. */
  const [showMobileNavText, setShowMobileNavText] = useState(false);

  // Avoid hydration mismatch: server has no session, client may have user from cookie
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 280px)");
    const apply = () => setShowMobileNavText(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const isHomePage = pathname === "/";

  /** Single source of truth: nav links, dropdowns, and CTAs. Kept minimal for clarity. */
  const primaryNav = [
    { name: "Home", href: "/", scrollOnHome: "#home" },
    { name: "Brand Growth", href: "/brand-growth" },
    { name: "Free tools", href: FREE_GROWTH_TOOLS_PATH },
    { name: "Blog", href: "/blog", scrollOnHome: "#blog" },
    { name: "Community", href: "/community" },
  ];
  const servicesNavSections: NavSection[] = [
    {
      label: "Service offerings",
      links: [
        { name: "Launch your brand", href: LAUNCH_YOUR_BRAND_PATH },
        { name: "Rebrand your business", href: REBRAND_YOUR_BUSINESS_PATH },
        { name: "Marketing assets", href: MARKETING_ASSETS_PATH },
        { name: "All services", href: "/services" },
      ],
    },
    {
      label: "Who we serve",
      links: [
        { name: "For Contractors", href: "/contractor-systems" },
        { name: "Local Business", href: "/local-business-growth" },
        { name: "Startup MVP", href: "/startup-mvp-development" },
      ],
    },
  ];
  const moreNavSections: NavSection[] = [
    {
      label: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      label: "Assess & grow",
      links: [
        { name: "Diagnostics hub", href: DIAGNOSTICS_HUB_PATH },
        { name: "Your Growth Score", href: "/diagnosis/results" },
      ],
    },
    {
      label: "Resources",
      links: [
        { name: "Tools hub", href: FREE_GROWTH_TOOLS_PATH },
        { name: "Website breakdowns", href: "/website-breakdowns" },
      ],
    },
  ];
  const ctaButtons = [
    { label: "Book a call", href: isHomePage ? "#contact" : STRATEGY_CALL_PATH, primary: true, isScroll: isHomePage },
  ];
  const isScrollLink = (item: (typeof primaryNav)[0]) => isHomePage && "scrollOnHome" in item && item.scrollOnHome;
  const getLinkHref = (item: (typeof primaryNav)[0]) => ("scrollOnHome" in item && item.scrollOnHome ? item.scrollOnHome : item.href);

  const adminPages = [
    { section: "Overview", name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard" as const },
    { section: "Overview", name: "Pages directory", href: "/admin/site-directory", icon: MapIcon, permission: "dashboard" as const },
    { section: "Overview", name: "Operator profile", href: "/admin/operator-profile", icon: Target, permission: "dashboard" as const },
    { section: "CRM & leads", name: "CRM", href: "/admin/crm", icon: Contact, permission: "crm" as const },
    { section: "CRM & leads", name: "Lead intake", href: "/admin/lead-intake", icon: Inbox, permission: "crm" as const },
    { section: "Content & email", name: "Blog", href: "/admin/blog", icon: FileText, permission: "blog" as const },
    { section: "Content & email", name: "Newsletters", href: "/admin/newsletters", icon: Mail, permission: "newsletters" as const },
    { section: "Content & email", name: "Newsletter Subscribers", href: "/admin/newsletters/subscribers", icon: Users, permission: "newsletters" as const },
    { section: "Content & email", name: "Communications", href: "/admin/communications", icon: Send, permission: "newsletters" as const },
    { section: "Content & email", name: "Brand temp vault", href: "/admin/brand-vault", icon: FolderOpen, permission: "newsletters" as const },
    { section: "Marketing & funnel", name: "Offer + Persona IQ", href: "/admin/ascendra-intelligence", icon: Brain },
    { section: "Marketing & funnel", name: "Offer valuation", href: "/admin/offer-valuation", icon: Sparkles },
    { section: "Marketing & funnel", name: "Funnel", href: "/admin/funnel", icon: Filter, permission: "funnel" as const },
    { section: "Marketing & funnel", name: "Paid Growth", href: "/admin/paid-growth", icon: LineChart, permission: "funnel" as const },
    { section: "Analytics", name: "Website Analytics", href: "/admin/analytics", icon: TrendingUp },
    { section: "Analytics", name: "Blog Analytics", href: "/admin/blog/analytics", icon: BarChart3, permission: "blog" as const },
    { section: "Operations", name: "Chat", href: "/admin/chat", icon: MessageSquare, permission: "dashboard" as const },
    { section: "Operations", name: "Feedback", href: "/admin/feedback", icon: MessageSquare, permission: "feedback" as const },
    { section: "Operations", name: "Announcements", href: "/admin/announcements", icon: Megaphone, permission: "announcements" as const },
    { section: "Operations", name: "Invoices", href: "/admin/invoices", icon: Receipt, permission: "invoices" as const },
    { section: "Settings", name: "Settings", href: "/admin/settings", icon: Settings, permission: "dashboard" as const },
    { section: "Site tools", name: "Connections & email", href: "/admin/integrations", icon: Link2 },
    { section: "Site tools", name: "Live site settings (hosting)", href: "/admin/deployment-env", icon: CloudUpload, developerOnly: true },
    { section: "Site tools", name: "People & access", href: "/admin/users", icon: UserCog, developerOnly: true },
    { section: "Site tools", name: "Health & activity", href: "/admin/system", icon: Activity, developerOnly: true },
  ];

  const isApprovedAdmin =
    user?.isAdmin === true && user?.adminApproved === true;

  const isSuperUser = isAuthSuperUser(user);
  const permissions = (user?.permissions as Record<string, boolean> | null | undefined) ?? {};

  const visibleAdminPages = adminPages.filter((page) => {
    if ("developerOnly" in page && page.developerOnly)
      return isSuperUser;
    if (!isApprovedAdmin) return false;
    if (isSuperUser) return true;
    const perm = "permission" in page ? page.permission : undefined;
    return perm ? permissions[perm] === true : true;
  });

  const groupedAdminPages = groupAdminPagesBySection(visibleAdminPages, ADMIN_NAV_SECTION_ORDER);

  // Close menu when route changes (smooth app-like navigation)
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

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
      suppressHydrationWarning
    >
      <div
        className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 py-3 flex items-center !bg-transparent !border-0 !shadow-none min-w-0 max-w-full"
        style={{ background: "transparent", border: "none", boxShadow: "none" }}
      >
        {/* Left spacer (logo was here) */}
        <div className="hidden md:block flex-1 min-w-0" aria-hidden />
        {/* Center: primary links + Services (with Who we serve) + More dropdowns + CTAs */}
        <nav className="hidden md:flex flex-shrink-0 items-center gap-1 sm:gap-2 lg:gap-4" aria-label="Main navigation">
          {primaryNav.map((item) =>
            isScrollLink(item) ? (
              <button
                key={item.name}
                type="button"
                suppressHydrationWarning
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
                suppressHydrationWarning
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 flex items-center gap-0.5 outline-none"
              >
                Services <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px]">
              {servicesNavSections.map((section, si) => (
                <DropdownMenuGroup key={section.label}>
                  {si > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel className={sectionLabelClass}>
                    {section.label}
                  </DropdownMenuLabel>
                  {section.links.map((sub) => (
                    <DropdownMenuItem key={sub.href} asChild>
                      <Link href={sub.href} className="cursor-pointer">
                        {sub.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                suppressHydrationWarning
                className="text-foreground/80 hover:text-primary font-medium transition text-sm py-2 px-1 flex items-center gap-0.5 outline-none"
              >
                More <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {moreNavSections.map((section, si) => (
                <DropdownMenuGroup key={section.label}>
                  {si > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel className={sectionLabelClass}>
                    {section.label}
                  </DropdownMenuLabel>
                  {section.links.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        {/* Right: CTAs (single group) + auth + theme */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-2 ml-2">
          <div className="flex items-center gap-2 shrink-0">
            {ctaButtons.map((cta) =>
              cta.isScroll ? (
                <Button
                  key={cta.label}
                  type="button"
                  size="sm"
                  onClick={() => {
                    track("cta_click", { pageVisited: pathname, metadata: { cta: "book_a_call" } });
                    scrollToSection(cta.href);
                  }}
                  className={cta.primary ? "min-h-[44px] sm:min-h-[36px] shrink-0 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90" : "min-h-[44px] sm:min-h-[36px] shrink-0 whitespace-nowrap border border-border hover:bg-accent"}
                >
                  {cta.label}
                </Button>
              ) : (
                <Button asChild key={cta.label} size="sm" className={cta.primary ? "min-h-[44px] sm:min-h-[36px] shrink-0 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90" : "min-h-[44px] sm:min-h-[36px] shrink-0 whitespace-nowrap border border-border hover:bg-accent"}>
                  <Link
                    href={cta.href}
                    className="inline-flex items-center gap-1.5"
                    onClick={() => track("cta_click", { pageVisited: pathname, metadata: { cta: "book_a_call" } })}
                  >
                    {cta.label}
                  </Link>
                </Button>
              )
            )}
            {mounted && user ? (
              <>
                {isApprovedAdmin && (
                  <AdminChatNotificationBell />
                )}
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
                  <DropdownMenuContent align="end" className="min-w-[240px] max-h-[85vh] overflow-y-auto">
                    <DropdownMenuLabel className="font-normal">
                      @{user.username}
                    </DropdownMenuLabel>
                    {!isApprovedAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 py-2">
                            <LayoutDashboard className="h-4 w-4 shrink-0" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isApprovedAdmin && groupedAdminPages.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className={sectionLabelClass}>
                          Admin
                        </DropdownMenuLabel>
                        {groupedAdminPages.map((group, gi) => (
                          <DropdownMenuGroup key={group.label}>
                            {gi > 0 ? <DropdownMenuSeparator /> : null}
                            <DropdownMenuLabel className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide px-2 py-1">
                              {group.label}
                            </DropdownMenuLabel>
                            {group.items.map((page) => {
                              const Icon = page.icon;
                              return (
                                <DropdownMenuItem key={page.href} asChild>
                                  <Link
                                    href={page.href}
                                    className="cursor-pointer flex items-center gap-2 py-2"
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{page.name}</span>
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuGroup>
                        ))}
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
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 min-h-[44px] sm:min-h-[36px] px-3 shrink-0 whitespace-nowrap"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Login</span>
              </Link>
            )}
            <span className="shrink-0"><ThemeToggle /></span>
          </div>
        </div>

        {/* Mobile: menu button + theme (opens sheet from right for app-like UX) */}
        <div className="flex items-center gap-3 md:hidden shrink-0">
          <ThemeToggle />
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="h-10 min-h-[44px] min-w-[44px] px-3 gap-2 text-foreground font-medium border border-border/50 touch-manipulation"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-haspopup="true"
            aria-controls="mobile-nav-panel"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 shrink-0" />
            ) : (
              <Menu className="h-5 w-5 shrink-0" />
            )}
            {showMobileNavText ? (
              <span className="shrink-0">{mobileMenuOpen ? "Close" : "Menu"}</span>
            ) : null}
          </Button>
        </div>
      </div>

      {/* Mobile navigation sheet: slides in from right; same menu openable from header or bottom nav */}
      <Sheet open={mobileMenuOpen} onOpenChange={(open) => { if (!open) closeMobileMenu(); }}>
        <SheetContent
          side="right"
          id="mobile-nav-panel"
          className="md:hidden w-[85vw] max-w-sm p-0 gap-0 flex flex-col border-l bg-background/95 backdrop-blur overflow-hidden"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex flex-col gap-0 overflow-y-auto overscroll-contain flex-1 pt-14 pb-4 pr-2 pl-2 -mx-2">
                <ul className="flex flex-col gap-0.5" aria-label="Primary links">
                  {primaryNav.map((item) =>
                    isScrollLink(item) ? (
                      <li key={item.name}>
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => { scrollToSection(getLinkHref(item) as string); closeMobileMenu(); }}
                          className="w-full text-left text-foreground font-medium min-h-[48px] flex items-center px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                        >
                          {item.name}
                        </button>
                      </li>
                    ) : (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={closeMobileMenu}
                          className="w-full text-left text-foreground font-medium min-h-[48px] flex items-center px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 block touch-manipulation"
                        >
                          {item.name}
                        </Link>
                      </li>
                    )
                  )}
                </ul>

                <div className="mt-4 pt-3 border-t border-border/70" role="region" aria-labelledby="mobile-nav-services">
                  <h2 id="mobile-nav-services" className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Services
                  </h2>
                  {servicesNavSections.map((section) => (
                    <div key={section.label} className="mt-1">
                      <h3 className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wide">
                        {section.label}
                      </h3>
                      <ul className="flex flex-col gap-0.5">
                        {section.links.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={closeMobileMenu}
                              className="w-full text-left text-foreground font-medium min-h-[48px] flex items-center px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-6 block touch-manipulation"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-3 border-t border-border/70" role="region" aria-labelledby="mobile-nav-more">
                  <h2 id="mobile-nav-more" className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    More
                  </h2>
                  {moreNavSections.map((section) => (
                    <div key={section.label} className="mt-1">
                      <h3 className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wide">
                        {section.label}
                      </h3>
                      <ul className="flex flex-col gap-0.5">
                        {section.links.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={closeMobileMenu}
                              className="w-full text-left text-foreground font-medium min-h-[48px] flex items-center px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-6 block touch-manipulation"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/70">
                  {ctaButtons.map((cta) =>
                    cta.isScroll ? (
                      <button
                        key={cta.label}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          track("cta_click", { pageVisited: pathname, metadata: { cta: "book_a_call" } });
                          scrollToSection(cta.href);
                          closeMobileMenu();
                        }}
                        className={`flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-lg font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${cta.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}
                      >
                        {cta.label}
                      </button>
                    ) : (
                      <Link
                        key={cta.label}
                        href={cta.href}
                        onClick={() => {
                          track("cta_click", { pageVisited: pathname, metadata: { cta: "book_a_call" } });
                          closeMobileMenu();
                        }}
                        className={`flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-lg font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${cta.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}
                      >
                        {cta.label}
                      </Link>
                    )
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-border/70">
                  {mounted && user ? (
                    <div className="space-y-1">
                      <div className="px-4 py-2 text-sm font-medium text-foreground/80">
                        Logged in as @{user.username}
                      </div>
                      {!isApprovedAdmin && (
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 text-foreground font-medium min-h-[48px] px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                          onClick={closeMobileMenu}
                        >
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      {isApprovedAdmin && groupedAdminPages.length > 0 && (
                        <div className="space-y-2">
                          <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Admin
                          </div>
                          {groupedAdminPages.map((group) => (
                            <div key={group.label} className="space-y-0.5">
                              <div className="px-4 py-0.5 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wide">
                                {group.label}
                              </div>
                              <ul className="flex flex-col gap-0.5">
                                {group.items.map((page) => {
                                  const Icon = page.icon;
                                  return (
                                    <li key={page.href}>
                                      <Link
                                        href={page.href}
                                        className="flex items-center gap-2 text-foreground font-medium min-h-[48px] px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                                        onClick={closeMobileMenu}
                                      >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{page.name}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          logoutMutation.mutate();
                          closeMobileMenu();
                        }}
                        className="flex items-center w-full text-left text-foreground font-medium min-h-[48px] px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                      >
                        <LogOut className="h-4 w-4 mr-2 shrink-0" /> Log out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center text-foreground font-medium min-h-[48px] px-4 py-3 rounded-lg hover:bg-background/70 active:bg-background/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                      onClick={closeMobileMenu}
                    >
                      <LogIn className="h-4 w-4 mr-2 shrink-0" /> Login
                    </Link>
                  )}
                </div>
              </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
