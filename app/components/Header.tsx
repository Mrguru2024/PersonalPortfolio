"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code, Menu, X, LogIn, LogOut, User, Wand2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { personalInfo } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  const isHomePage = pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-primary flex items-center"
        >
          <span className="sr-only">{personalInfo.name}</span>
          <span className="flex items-center">
            <Code className="h-6 w-6 shrink-0" />
            <span className="ml-2 hidden sm:inline">MrGuru.dev</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
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

          {/* Auth */}
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-default">
                  <span className="text-sm font-medium">@{user.username}</span>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/blog" className="cursor-pointer">
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
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
        </nav>

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
        <div className="md:hidden border-t border-border bg-background">
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
                  {user.isAdmin && (
                    <Link
                      href="/admin/blog"
                      className="block text-foreground/80 hover:text-primary font-medium py-3 px-2 rounded-md hover:bg-muted transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
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
