'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/use-auth';
import CustomCursor from '@/components/CustomCursor';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  const [currentSection, setCurrentSection] = useState<string>('Home');

  // Update current section based on scroll position
  useEffect(() => {
    // Debounced scroll handler to improve performance
    let scrollTimeout: number | null = null;
    
    const handleScroll = () => {
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        const scrollPosition = window.scrollY;
        
        // Get all section elements
        const sections = document.querySelectorAll('section[id]');
        
        // If no sections found, keep Home as default 
        if (sections.length === 0) {
          setCurrentSection('Home');
          return;
        }
        
        // Find the section that is currently most visible in the viewport
        let currentSectionId = 'Home';
        let maxVisibility = 0;
        
        sections.forEach((section) => {
          const sectionTop = (section as HTMLElement).offsetTop;
          const sectionHeight = (section as HTMLElement).offsetHeight;
          
          // Calculate how much of the section is visible in the viewport
          const sectionBottom = sectionTop + sectionHeight;
          const visibleTop = Math.max(sectionTop, scrollPosition);
          const visibleBottom = Math.min(sectionBottom, scrollPosition + window.innerHeight);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          
          // Calculate visibility as a percentage of the section that's visible
          const visibility = visibleHeight / sectionHeight;
          
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            currentSectionId = section.id || 'Home';
          }
        });
        
        // Format the section name (e.g., "projects" -> "Projects")
        const formattedSectionName = currentSectionId.charAt(0).toUpperCase() + currentSectionId.slice(1);
        
        // Only update if different (prevents unnecessary re-renders)
        if (formattedSectionName !== currentSection) {
          setCurrentSection(formattedSectionName);
        }
      }, 100); // Small delay for debounce
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set the initial section
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <CustomCursor currentSection={currentSection} />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}