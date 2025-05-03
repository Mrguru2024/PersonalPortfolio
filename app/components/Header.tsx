"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Github, Linkedin, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface HeaderProps {
  currentSection: string;
  onNavToggle: () => void;
}

export default function Header({ currentSection, onNavToggle }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { href: "/#home", label: "Home", id: "home" },
    { href: "/#about", label: "About", id: "about" },
    { href: "/#projects", label: "Projects", id: "projects" },
    { href: "/#skills", label: "Skills", id: "skills" },
    { href: "/#contact", label: "Contact", id: "contact" },
    { href: "/blog", label: "Blog", id: "blog" },
    { href: "/resume", label: "Resume", id: "resume" },
  ];

  const socialLinks = [
    { 
      href: "https://github.com/Mrguru2024", 
      icon: <Github className="h-5 w-5" />, 
      label: "GitHub" 
    },
    { 
      href: "https://linkedin.com/in/anthony-feaster", 
      icon: <Linkedin className="h-5 w-5" />, 
      label: "LinkedIn" 
    },
    { 
      href: "https://twitter.com/MrGuru2024", 
      icon: <Twitter className="h-5 w-5" />, 
      label: "Twitter" 
    }
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md py-3 shadow-md" 
          : "bg-transparent py-4"
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl md:text-2xl font-bold">
          <span className="gradient-text">MrGuru</span>.dev
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                currentSection === item.id
                  ? "text-foreground bg-secondary/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Social Links - Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}

          <button
            onClick={onNavToggle}
            className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle Quick Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-md bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
          aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border"
          >
            <nav className="container-custom py-4 flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-md transition-colors",
                    currentSection === item.id
                      ? "text-foreground bg-secondary/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <div className="flex space-x-4 pt-4 pb-2 border-t border-border mt-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </a>
                ))}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavToggle();
                  }}
                  className="ml-auto p-2 rounded-md bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                  aria-label="Toggle Quick Navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}