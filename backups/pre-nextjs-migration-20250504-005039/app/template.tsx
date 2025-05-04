"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QuickNav from "@/components/QuickNav";

export default function Template({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  
  // Handle keyboard events for navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open quick navigation
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickNavOpen(true);
      }
      
      // Escape key to close quick navigation
      if (e.key === "Escape" && quickNavOpen) {
        e.preventDefault();
        setQuickNavOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickNavOpen]);
  
  return (
    <>
      {/* Quick navigation panel */}
      <QuickNav 
        isOpen={quickNavOpen} 
        onClose={() => setQuickNavOpen(false)}
        currentSection={""}
        onSectionClick={() => {}}
      />
      
      {/* Page transition animation */}
      <AnimatePresence mode="wait">
        <motion.main
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            type: "tween", 
            ease: "easeInOut", 
            duration: 0.3 
          }}
          className="flex flex-col min-h-screen"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      
      {/* Full page preloader - shown during navigation */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
              <p className="mt-4 text-lg font-medium">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}