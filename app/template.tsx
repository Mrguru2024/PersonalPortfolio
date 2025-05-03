"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import QuickNav from "@/components/QuickNav";
import { cn } from "@/components/ui/utils";

export default function Template({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState("home");
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  // Close QuickNav when escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuickNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Observer for section changes
  useEffect(() => {
    const options = {
      threshold: 0.3,
      rootMargin: "-10% 0px -70% 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            setCurrentSection(id);
          }
        }
      });
    }, options);

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId);
    setQuickNavOpen(false);
    
    const section = document.getElementById(sectionId);
    if (section) {
      // Adding smooth scroll with a slight delay to ensure proper animation
      setTimeout(() => {
        section.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col", quickNavOpen && "overflow-hidden")}>
      <Header currentSection={currentSection} onNavToggle={() => setQuickNavOpen(!quickNavOpen)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CustomCursor currentSection={currentSection} />
      <QuickNav 
        isOpen={quickNavOpen}
        onClose={() => setQuickNavOpen(false)}
        currentSection={currentSection}
        onSectionClick={scrollToSection}
      />
    </div>
  );
}