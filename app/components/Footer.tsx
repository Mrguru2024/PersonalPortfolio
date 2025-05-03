"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const mainLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#about", label: "About" },
    { href: "/#projects", label: "Projects" },
    { href: "/#skills", label: "Skills" },
    { href: "/#contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
    { href: "/resume", label: "Resume" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/sitemap.xml", label: "Sitemap" },
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

  const contactInfo = [
    { 
      icon: <Mail className="h-5 w-5" />, 
      text: "anthonyfeaster@mrguru.dev", 
      href: "mailto:anthonyfeaster@mrguru.dev" 
    },
    { 
      icon: <Phone className="h-5 w-5" />, 
      text: "(678) 506-1143", 
      href: "tel:+16785061143" 
    },
    { 
      icon: <MapPin className="h-5 w-5" />, 
      text: "Atlanta, GA", 
      href: "https://maps.google.com/?q=Atlanta,GA" 
    }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container-custom pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand and About */}
          <div>
            <Link href="/" className="font-heading text-2xl font-bold inline-block mb-4">
              <span className="gradient-text">MrGuru</span>.dev
            </Link>
            <p className="text-muted-foreground mb-4">
              Full-stack developer specializing in modern web technologies, 
              creating immersive digital experiences with a focus on performance 
              and user experience.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                  whileHover={{ y: -3 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Site Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Explore</h3>
            <nav className="flex flex-col space-y-2">
              {mainLinks.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="flex flex-col space-y-3">
              {contactInfo.map((item, index) => (
                <a 
                  key={index} 
                  href={item.href}
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  target={item.href.startsWith('http') ? "_blank" : undefined}
                  rel={item.href.startsWith('http') ? "noopener noreferrer" : undefined}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.text}
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
            <p className="text-muted-foreground mb-4">
              Stay updated with my latest projects, blog posts, and tech insights.
            </p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-1 px-3 py-2 bg-background border border-border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-r-md hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground order-2 md:order-1 mt-4 md:mt-0">
            © {currentYear} Anthony "MrGuru" Feaster. All rights reserved.
          </p>
          <div className="flex space-x-6 order-1 md:order-2">
            {legalLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}