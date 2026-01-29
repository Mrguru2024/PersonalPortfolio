import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Code, Menu, X, LogIn, LogOut, User, Wand2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
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

interface MenuLink {
  name: string;
  href: string;
  icon?: ReactNode;
  highlight?: boolean;
}

const Header = ({ currentSection, onNavToggle }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isApprovedAdmin = user?.isAdmin === true && user?.adminApproved === true;
  const isAdminUser = user?.isAdmin === true || user?.role === "admin";
  const canCreateBlog =
    user !== null &&
    (isApprovedAdmin || user?.role === "writer" || user?.role === "admin");
  const showCreateBlogLink = canCreateBlog && !isApprovedAdmin;

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
  const pageLinks: MenuLink[] = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Resume", href: "/resume" },
    {
      name: "AI Images",
      href: "/generate-images",
      icon: <Wand2 className="h-4 w-4 mr-2 shrink-0" />,
    },
    { name: "Recommendations", href: "/recommendations" },
  ];
  const adminLinks: MenuLink[] = [
    { name: "Admin Dashboard", href: "/admin/dashboard" },
    { name: "Blog Management", href: "/admin/blog" },
    { name: "Blog Analytics", href: "/admin/blog/analytics" },
    { name: "Newsletters", href: "/admin/newsletters" },
    { name: "Create Newsletter", href: "/admin/newsletters/create" },
    { name: "Subscribers", href: "/admin/newsletters/subscribers" },
    { name: "Feedback Management", href: "/admin/feedback" },
  ];
  const adminMenuLinks = isApprovedAdmin ? adminLinks : adminLinks.slice(0, 1);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isHomePage = location === "/";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-primary flex items-center"
        >
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
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition"
              >
                Blog
              </Link>
              <Link
                href="/resume"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition"
              >
                Resume
              </Link>
              <Link
                href="/generate-images"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition flex items-center"
              >
                <Wand2 className="h-4 w-4 mr-1" /> AI Images
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
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-white">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-default">
                  <span className="text-sm font-medium">@{user.username}</span>
                </DropdownMenuItem>
                {isAdminUser &&
                  adminMenuLinks.map((link) => (
                    <DropdownMenuItem asChild key={link.href}>
                      <Link href={link.href} className="cursor-pointer">
                        {link.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                {showCreateBlogLink && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/blog" className="cursor-pointer">
                      Create Blog Post
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
                className="flex items-center gap-2 text-sm sm:text-base min-h-[44px] sm:min-h-[36px]"
              >
                <LogIn className="h-4 w-4 shrink-0" />
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
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-md">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {isHomePage && (
              <div className="space-y-1">
                <div className="px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Sections
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition text-left"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`space-y-1 ${
                isHomePage ? "pt-4 border-t border-gray-200 dark:border-gray-700" : ""
              }`}
            >
              <div className="px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                Pages
              </div>
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`block w-full text-left font-medium py-2 transition ${
                    link.highlight
                      ? "text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                  } ${link.icon ? "flex items-center" : ""}`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>

            {isAdminUser && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Admin
                </div>
                {adminMenuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                  >
                    {link.name}
                  </Link>
                ))}
                {showCreateBlogLink && (
                  <Link
                    href="/admin/blog"
                    onClick={closeMobileMenu}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                  >
                    Create Blog Post
                  </Link>
                )}
                {!isApprovedAdmin && (
                  <div className="text-xs text-muted-foreground">
                    Admin access pending approval.
                  </div>
                )}
              </div>
            )}

            {/* Mobile Login/Logout */}
            <div className="py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Logged in as @{user.username}
                    </span>
                  </div>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Log out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                >
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
