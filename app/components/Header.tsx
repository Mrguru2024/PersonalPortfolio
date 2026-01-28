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

const Header = ({ currentSection, onNavToggle }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logoutMutation } = useAuth();

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

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
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
                  {((user.isAdmin && user.adminApproved) || user.role === "writer" || user.role === "admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/blog">Create Blog Post</Link>
                    </DropdownMenuItem>
                  )}
                  {user.isAdmin && user.adminApproved && (
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
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {isHomePage ? (
              navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition"
                >
                  {item.name}
                </button>
              ))
            ) : (
              <>
                <Link href="/" className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Home
                </Link>
                <Link href="/blog" className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Blog
                </Link>
                <Link href="/resume" className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                  Resume
                </Link>
                <Link href="/generate-images" className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" /> AI Images
                </Link>
              </>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Logged in as @{user.username}</span>
                  </div>
                  {user.isAdmin && user.adminApproved && (
                    <Link href="/admin/blog" className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium py-2 transition">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => logoutMutation.mutate()}
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
