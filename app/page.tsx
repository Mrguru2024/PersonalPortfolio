"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection.fixed";
import ContactSection from "@/components/sections/ContactSection";
import QuickNav from "@/components/QuickNav";
import JourneyExperience from "@/components/JourneyExperience";
import CustomCursor from "@/components/CustomCursor";

export default function HomePage() {
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("home");
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle section navigation from QuickNav
  const handleSectionClick = (section: string) => {
    setCurrentSection(section);
    setQuickNavOpen(false);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Setup intersection observer to update current section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setCurrentSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));
    
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);
  
  return (
    <>
      <Header 
        currentSection={currentSection} 
        onNavToggle={() => setQuickNavOpen(true)}
      />
      
      <QuickNav 
        isOpen={quickNavOpen} 
        onClose={() => setQuickNavOpen(false)}
        currentSection={currentSection}
        onSectionClick={handleSectionClick}
      />
      
      <main className="flex flex-col min-h-screen">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      
      <Footer />
      
      {/* Interactive components */}
      <JourneyExperience activeSection={currentSection} />
      {!isMobile && <CustomCursor currentSection={currentSection} />}
    </>
  );
}