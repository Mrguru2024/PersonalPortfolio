"use client";

import { useState, useEffect } from "react";
import QuickNav from "@/components/QuickNav";
import CustomCursor from "@/components/CustomCursor";

export default function Template({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState("home");
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  
  // Handle section visibility detection
  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;
    
    // Function to determine the current visible section
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      let currentSectionId = currentSection;
      
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.getAttribute("id") || "";
        
        // If the section is in view
        if (sectionTop <= 100 && sectionTop >= -section.clientHeight + 100) {
          currentSectionId = sectionId;
        }
      });
      
      if (currentSectionId !== currentSection) {
        setCurrentSection(currentSectionId);
      }
    };
    
    // Listen for scroll events
    window.addEventListener("scroll", handleScroll);
    
    // Initial check
    handleScroll();
    
    // Clean up the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentSection]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if Alt key is pressed
      if (e.altKey) {
        switch (e.key) {
          case "1":
            navigateToSection("home");
            break;
          case "2":
            navigateToSection("about");
            break;
          case "3":
            navigateToSection("projects");
            break;
          case "4":
            navigateToSection("skills");
            break;
          case "5":
            navigateToSection("contact");
            break;
          case "b":
          case "B":
            window.location.href = "/blog";
            break;
          case "r":
          case "R":
            window.location.href = "/resume";
            break;
        }
      }
      
      // Ctrl+K to open quick navigation
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setQuickNavOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  
  // Function to navigate to a section on the home page
  const navigateToSection = (sectionId: string) => {
    // If not on home page, navigate to home page with hash
    if (window.location.pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }
    
    // Otherwise, scroll to the section
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(sectionId);
    }
  };
  
  return (
    <>
      {/* Main content with children */}
      {children}
      
      {/* Quick navigation overlay */}
      <QuickNav
        isOpen={quickNavOpen}
        onClose={() => setQuickNavOpen(false)}
        currentSection={currentSection}
        onSectionClick={navigateToSection}
      />
      
      {/* Custom cursor */}
      <CustomCursor currentSection={currentSection} />
    </>
  );
}