"use client";

import { useState, useEffect } from "react";
import CustomCursor from "@/components/CustomCursor";
import QuickNav from "@/components/QuickNav";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState("home");
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const pathname = usePathname();

  // Handle navigation toggle
  const toggleQuickNav = () => {
    setQuickNavOpen(!quickNavOpen);
  };

  // Set current section based on the path
  useEffect(() => {
    if (pathname === "/") {
      // For home page, the sections will be set by the intersection observer
      setCurrentSection("home");
    } else if (pathname.startsWith("/projects")) {
      setCurrentSection("projects");
    } else if (pathname.startsWith("/blog")) {
      setCurrentSection("blog");
    } else if (pathname.startsWith("/resume")) {
      setCurrentSection("resume");
    } else if (pathname.startsWith("/auth")) {
      setCurrentSection("auth");
    }
  }, [pathname]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to close quick nav
      if (e.key === "Escape" && quickNavOpen) {
        setQuickNavOpen(false);
      }
      
      // Quick nav toggle with Ctrl+K or Command+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggleQuickNav();
      }
      
      // Section quick navigation
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
            window.location.href = "/blog";
            break;
          case "r":
            window.location.href = "/resume";
            break;
        }
      }
    };
    
    const navigateToSection = (section: string) => {
      if (pathname !== "/") {
        window.location.href = "/#" + section;
        return;
      }
      
      const sectionElement = document.getElementById(section);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: "smooth" });
        setCurrentSection(section);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickNavOpen, pathname]);

  // Handle section scrolling on homepage
  useEffect(() => {
    if (pathname !== "/") return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setCurrentSection(id);
            // Update URL hash without scrolling
            history.replaceState(null, "", `#${id}`);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, [pathname]);

  return (
    <>
      <CustomCursor currentSection={currentSection} />
      
      <QuickNav
        isOpen={quickNavOpen}
        onClose={() => setQuickNavOpen(false)}
        currentSection={currentSection}
        onSectionClick={(section) => {
          setCurrentSection(section);
          setQuickNavOpen(false);
        }}
      />
      
      {children}
    </>
  );
}