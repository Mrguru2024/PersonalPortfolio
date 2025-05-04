"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import Search from "lucide-react/dist/esm/icons/search";
import Github from "lucide-react/dist/esm/icons/github";
import { useTheme } from "next-themes";

interface HeaderProps {
  currentSection: string;
  onNavToggle: () => void;
}

export default function Header({ currentSection, onNavToggle }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items
  const navItems = [
    { label: "Home", path: "/", hash: "#home", section: "home" },
    { label: "About", path: "/#about", hash: "#about", section: "about" },
    { label: "Projects", path: "/projects", hash: "#projects", section: "projects" },
    { label: "Skills", path: "/#skills", hash: "#skills", section: "skills" },
    { label: "Blog", path: "/blog", hash: "", section: "blog" },
    { label: "Resume", path: "/resume", hash: "", section: "resume" },
    { label: "Contact", path: "/#contact", hash: "#contact", section: "contact" },
  ];

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if a nav item is active
  const isActive = (item: { path: string; section: string }) => {
    if (pathname === "/") {
      return item.section === currentSection;
    }
    
    if (pathname.startsWith(item.path) && item.path !== "/") {
      return true;
    }
    
    return false;
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm py-2" : "py-4",
        mobileMenuOpen ? "bg-background shadow-sm" : ""
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="font-bold text-xl md:text-2xl flex items-center gap-2"
        >
          <span className="gradient-text">MrGuru.dev</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Quick Navigation Button */}
          <button
            onClick={onNavToggle}
            className="p-2 rounded-full hover:bg-accent transition-colors hidden md:flex"
            aria-label="Quick navigation"
          >
            <Search size={20} />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/Mrguru2024"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-accent transition-colors hidden md:flex"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-full hover:bg-accent transition-colors md:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu md:hidden py-4 pb-6">
          <nav className="container-custom flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px w-full bg-border my-2" />
            <a
              href="https://github.com/Mrguru2024"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Github size={16} /> GitHub
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}