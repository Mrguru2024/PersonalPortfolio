'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import ContactSection from '@/components/sections/ContactSection';
import CustomCursor from '@/components/CustomCursor';
import QuickNav from '@/components/QuickNav';

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState('hero');
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const sectionRefs = {
    hero: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    projects: useRef<HTMLDivElement>(null),
    skills: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      // Find which section is currently in view
      for (const [section, ref] of Object.entries(sectionRefs)) {
        if (!ref.current) continue;
        
        const offsetTop = ref.current.offsetTop;
        const offsetBottom = offsetTop + ref.current.offsetHeight;
        
        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          setCurrentSection(section);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once on mount
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref?.current) {
      window.scrollTo({
        top: ref.current.offsetTop,
        behavior: 'smooth',
      });
    }
    setQuickNavOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div ref={sectionRefs.hero}>
          <HeroSection scrollToNextSection={() => scrollToSection('about')} />
        </div>
        
        <div ref={sectionRefs.about}>
          <AboutSection />
        </div>
        
        <div ref={sectionRefs.projects}>
          <ProjectsSection />
        </div>
        
        <div ref={sectionRefs.skills}>
          <SkillsSection />
        </div>
        
        <div ref={sectionRefs.contact}>
          <ContactSection />
        </div>
      </main>
      <Footer />
      
      <button
        aria-label="Quick Navigation"
        onClick={() => setQuickNavOpen(true)}
        className="fixed z-50 bottom-8 right-8 bg-gradient-to-tr from-primary to-blue-500 rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
      
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