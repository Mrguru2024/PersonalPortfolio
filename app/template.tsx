'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import CustomCursor from '@/components/CustomCursor';
import FloatingNavigation from '@/components/FloatingNavigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Simulate loading for the initial experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Listen for section changes (used by CustomCursor)
  useEffect(() => {
    // Wrap DOM interactions in client-side check to prevent hydration mismatches
    if (typeof window !== 'undefined') {
      const handleSectionChange = () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        // Convert NodeList to Array to avoid iteration issues
        Array.from(sections).forEach((section) => {
          const sectionTop = (section as HTMLElement).offsetTop;
          const sectionHeight = (section as HTMLElement).offsetHeight;
          const sectionId = section.getAttribute('id');
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(sectionId || undefined);
          }
        });
      };
      
      window.addEventListener('scroll', handleSectionChange);
      handleSectionChange(); // Check initial position
      
      return () => window.removeEventListener('scroll', handleSectionChange);
    }
  }, []);
  
  return (
    <>
      <CustomCursor currentSection={activeSection} />
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loader"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <motion.div
              className="relative w-24 h-24"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="text-xl font-bold text-primary"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  MG
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen flex-col"
          >
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <FloatingNavigation />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}