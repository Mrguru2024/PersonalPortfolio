'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function Footer() {
  const [currentYear] = useState(() => new Date().getFullYear());
  
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className="bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and info */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity mb-4 inline-block">
              <span className="text-gradient">MrGuru</span>.dev
            </Link>
            <p className="text-muted-foreground mb-4">
              Full Stack Developer specializing in creating beautiful and functional web applications.
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="icon" 
                asChild
                className="rounded-full"
              >
                <a 
                  href="https://github.com/mrguru2024" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                >
                  <Github size={18} />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                asChild
                className="rounded-full"
              >
                <a 
                  href="https://linkedin.com/in/anthony-feaster" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin size={18} />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                asChild
                className="rounded-full"
              >
                <a 
                  href="mailto:anthony@mrguru.dev" 
                  aria-label="Send Email"
                >
                  <Mail size={18} />
                </a>
              </Button>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/projects" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  href="/resume" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resume
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground">
                  Web Development
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  Frontend Development
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  Backend Development
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  API Development
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  Consulting
                </span>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-muted-foreground">
                Atlanta, GA
              </li>
              <li>
                <a 
                  href="mailto:anthony@mrguru.dev" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  anthony@mrguru.dev
                </a>
              </li>
              <li>
                <a 
                  href="tel:+16785061143" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  (678) 506-1143
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {currentYear} Anthony "MrGuru" Feaster. All rights reserved.
          </p>
          
          <div className="flex items-center">
            <button
              onClick={handleScrollToTop}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Scroll to top"
            >
              <span className="mr-2 text-sm">Back to top</span>
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}