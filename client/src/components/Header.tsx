import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Code, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { personalInfo } from "@/lib/data";
import { useNextAuth } from "@/hooks/use-next-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useNextAuth();

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
              <Link href="/resume" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition">
                Resume
              </Link>
            </>
          )}
          
          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-white">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-default">
                  <span className="text-sm font-medium">{user.email || user.name}</span>
                </DropdownMenuItem>
                {(user as any)?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/blog" className="cursor-pointer">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm" variant="default" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
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
                <Link href="/resume" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Resume
                </Link>
              </>
            )}
            
            {/* Mobile Login/Logout */}
            <div className="py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Logged in as @{user.username}</span>
                  </div>
                  {user.isAdmin && (
                    <Link href="/admin/blog" className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Log out
                  </button>
                </div>
              ) : (
                <Link href="/auth" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  <LogIn className="h-4 w-4 mr-2" /> Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
