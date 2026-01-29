import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code, Menu, X, LogIn, LogOut, User, Wand2, ClipboardCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { personalInfo } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  currentSection?: string;
  onNavToggle?: () => void;
}

interface PageLink {
  name: string;
  href: string;
  icon?: JSX.Element;
  highlight?: boolean;
}

const Header = ({ currentSection, onNavToggle }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logoutMutation } = useAuth();
  const isApprovedAdmin = user?.isAdmin === true && user?.adminApproved === true;
  const canCreateBlog =
    user !== null &&
    (isApprovedAdmin || user?.role === "writer" || user?.role === "admin");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Projects", href: "#projects" },
    { name: "About", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ];
  const pageLinks: PageLink[] = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Resume", href: "/resume" },
    {
      name: "AI Images",
      href: "/generate-images",
      icon: <Wand2 className="h-4 w-4 mr-2 shrink-0" />,
    },
    { name: "Recommendations", href: "/recommendations" },
    { name: "FAQ", href: "/faq" },
    {
      name: "Get Quote",
      href: "/assessment",
      icon: <ClipboardCheck className="h-4 w-4 mr-2 shrink-0" />,
      highlight: true,
    },
  ];

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

  const isHomePage = pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm transition-colors duration-300 supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-gray-900/80">
      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 py-3 fold:py-3 sm:py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary flex items-center">
          <span className="sr-only">{personalInfo.name}</span>
          <span className="flex items-center">
            <Code className="h-6 w-6" />
            <span className="ml-2 hidden sm:inline">MrGuru.dev</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
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
              <Link href="/generate-images" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition flex items-center">
                <Wand2 className="h-4 w-4 mr-1" /> AI Images
              </Link>
              <Link href="/assessment" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition flex items-center bg-primary/10 px-3 py-1 rounded-md">
                <ClipboardCheck className="h-4 w-4 mr-1" /> Get Quote
              </Link>
            </>
          )}
          
          {isHomePage && (
            <Link href="/assessment" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition flex items-center bg-primary/10 px-3 py-1 rounded-md">
              <ClipboardCheck className="h-4 w-4 mr-1" /> Get Quote
            </Link>
          )}
          
          {/* Auth */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
                  {canCreateBlog && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/blog">Create Blog Post</Link>
                    </DropdownMenuItem>
                  )}
                  {isApprovedAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">Admin Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/blog">Blog Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/blog/analytics">Blog Analytics</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/newsletters">Newsletters</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/feedback">Feedback Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/newsletters/subscribers">Subscribers</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOut className="h-4 w-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" /> Login
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="touch-target text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 safe-area-insets">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {isHomePage ? (
              navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                >
                  {item.name}
                </button>
              ))
            ) : (
              <>
                {pageLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`touch-target block w-full text-left font-medium py-3 px-4 rounded-md transition ${
                      link.highlight
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    } ${link.icon ? "flex items-center" : ""}`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </>
            )}

            {isHomePage && (
              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="px-4 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Pages
                </div>
                {pageLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`touch-target block w-full text-left font-medium py-3 px-4 rounded-md transition ${
                      link.highlight
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    } ${link.icon ? "flex items-center" : ""}`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
              {user ? (
                <div className="space-y-1">
                  <div className="px-4 py-2">
                    <span className="text-sm font-medium text-muted-foreground">Logged in as @{user.username}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                  >
                    My Dashboard
                  </Link>
                  {canCreateBlog && (
                    <Link
                      href="/admin/blog"
                      onClick={closeMobileMenu}
                      className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                    >
                      Create Blog Post
                    </Link>
                  )}
                  {isApprovedAdmin && (
                    <div className="space-y-1">
                      <div className="px-4 pt-2 text-xs font-semibold uppercase text-muted-foreground">
                        Admin
                      </div>
                      <Link
                        href="/admin/dashboard"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/admin/blog"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Blog Management
                      </Link>
                      <Link
                        href="/admin/blog/analytics"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Blog Analytics
                      </Link>
                      <Link
                        href="/admin/newsletters"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Newsletters
                      </Link>
                      <Link
                        href="/admin/newsletters/create"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Create Newsletter
                      </Link>
                      <Link
                        href="/admin/feedback"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Feedback Management
                      </Link>
                      <Link
                        href="/admin/newsletters/subscribers"
                        onClick={closeMobileMenu}
                        className="touch-target block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                      >
                        Subscribers
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="touch-target flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition"
                  >
                    <LogOut className="h-4 w-4 mr-2 shrink-0" /> Log out
                  </button>
                </div>
              ) : (
                <Link href="/auth" className="touch-target flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-3 px-4 rounded-md transition">
                  <LogIn className="h-4 w-4 mr-2 shrink-0" /> Login / Register
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
