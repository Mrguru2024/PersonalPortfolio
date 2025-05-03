import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Code, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { personalInfo } from "@/lib/data";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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

  const isHomePage = location === "/";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary flex items-center">
          <span className="sr-only">{personalInfo.name}</span>
          <span className="flex items-center">
            <Code className="h-6 w-6" />
            <span className="ml-2 hidden sm:inline">MrGuru.dev</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 items-center">
          {isHomePage ? (
            navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition"
              >
                {item.name}
              </button>
            ))
          ) : (
            <>
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition">
                Home
              </Link>
              <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition">
                Blog
              </Link>
            </>
          )}
          
          {/* Dark Mode Toggle */}
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="ml-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-md">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
            {isHomePage ? (
              navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition text-left"
                >
                  {item.name}
                </button>
              ))
            ) : (
              <>
                <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Home
                </Link>
                <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Blog
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
