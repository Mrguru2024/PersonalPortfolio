"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Github, Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Footer navigation links
  const footerLinks = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
    { label: "Resume", href: "/resume" },
    { label: "Contact", href: "/#contact" },
  ];
  
  // Social links
  const socialLinks = [
    { 
      label: "GitHub", 
      href: "https://github.com/Mrguru2024", 
      icon: <Github className="h-5 w-5" /> 
    },
    { 
      label: "LinkedIn", 
      href: "https://linkedin.com/in/anthony-feaster", 
      icon: <Linkedin className="h-5 w-5" /> 
    },
    { 
      label: "Email", 
      href: "mailto:contact@mrguru.dev", 
      icon: <Mail className="h-5 w-5" /> 
    },
    { 
      label: "Phone", 
      href: "tel:+16785061143", 
      icon: <Phone className="h-5 w-5" /> 
    },
  ];

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Branding & About */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold gradient-text inline-block">
              MrGuru.dev
            </Link>
            <p className="text-muted-foreground max-w-md">
              Full-stack developer in Atlanta, GA specializing in creating immersive, 
              interactive web experiences with a focus on performance and user experience.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className="hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Connect</h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.label !== "Phone" && link.label !== "Email" ? "_blank" : undefined}
                  rel={link.label !== "Phone" && link.label !== "Email" ? "noopener noreferrer" : undefined}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    "hover:bg-primary/10 transition-colors"
                  )}
                  aria-label={link.label}
                >
                  {link.icon}
                  <span className="text-sm font-medium hidden md:block">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Keyboard Shortcuts */}
        <div className="border-t border-border pt-8 pb-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li><kbd className="px-2 py-1 bg-muted rounded">Alt+1-5</kbd> Navigate sections</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Alt+B</kbd> Visit blog</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Alt+R</kbd> View resume</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl+K</kbd> Quick navigation</li>
              </ul>
            </div>
            
            <div className="text-right hidden md:block">
              <p>© {currentYear} Anthony "MrGuru" Feaster</p>
              <p className="mt-1">Built with Next.js, Tailwind & Drizzle</p>
            </div>
          </div>
          
          {/* Mobile Copyright */}
          <div className="md:hidden text-center mt-6">
            <p>© {currentYear} Anthony "MrGuru" Feaster</p>
            <p className="mt-1">Built with Next.js, Tailwind & Drizzle</p>
          </div>
        </div>
      </div>
    </footer>
  );
}