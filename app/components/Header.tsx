"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Wand2,
  LayoutDashboard,
  FileText,
  Receipt,
  Megaphone,
  MessageSquare,
  Mail,
  BarChart3,
  Users,
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

interface HeaderProps {
  currentSection?: string;
  onNavToggle?: () => void;
}

export default function Header(_props: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Projects", href: "#projects" },
    { name: "About", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ];

  const adminPages = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
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

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  const isHomePage = pathname === "/";

  return (
    <header
      className="!bg-transparent !border-0 !shadow-none shrink-0"
      style={{ background: "transparent", border: "none", boxShadow: "none" }}
    >
      <div
        className="container mx-auto px-4 py-3 flex items-center !bg-transparent !border-0 !shadow-none"
        style={{ background: "transparent", border: "none", boxShadow: "none" }}
      >
        {/* Left spacer (logo was here) */}
        <div className="hidden md:block flex-1 min-w-0" aria-hidden />
        {/* Center: nav */}
        <nav className="hidden md:flex flex-shrink-0 space-x-6 lg:space-x-8 items-center">
          {isHomePage ? (
            navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => scrollToSection(item.href)}
                className="text-foreground/80 hover:text-primary font-medium transition text-sm"
              >
                {item.name}
              </button>
            ))
          ) : (
            <>
              <Link
                href="/"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm"
              >
                Blog
              </Link>
              <Link
                href="/resume"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm"
              >
                Resume
              </Link>
              <Link
                href="/generate-images"
                className="text-foreground/80 hover:text-primary font-medium transition text-sm flex items-center gap-1"
              >
                <Wand2 className="h-4 w-4 shrink-0" /> AI Images
              </Link>
            </>
          )}
        </nav>
        {/* Right: auth + theme (original position) */}
        <div className="flex flex-1 min-w-0 justify-end items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {user ? (
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
              <Link href="/auth">
                <Button
                  size="sm"
                  variant="default"
                  className="flex items-center gap-2 text-sm min-h-[44px] sm:min-h-[36px]"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>Login</span>
                </Button>
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
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {isHomePage ? (
              navItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => scrollToSection(item.href)}
                  className="text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                >
                  {item.name}
                </button>
              ))
            ) : (
              <>
                <Link
                  href="/"
                  className="text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/blog"
                  className="text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/resume"
                  className="text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Resume
                </Link>
                <Link
                  href="/generate-images"
                  className="text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Wand2 className="h-4 w-4 shrink-0" /> AI Image Generator
                </Link>
              </>
            )}

            <div className="pt-3 mt-3 border-t border-border">
              {user ? (
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
                            className="flex items-center gap-2 text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                            onClick={() => setMobileMenuOpen(false)}
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
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                  >
                    <LogOut className="h-4 w-4 mr-2 shrink-0" /> Log out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4 mr-2 shrink-0" /> Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
