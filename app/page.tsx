'use client';

import HeroSection from '@/sections/HeroSection';
import SkillsSection from '@/sections/SkillsSection';
import ProjectsSection from '@/sections/ProjectsSection';
import ServicesSection from '@/sections/ServicesSection';
import BlogSection from '@/sections/BlogSection';
import ContactSection from '@/sections/ContactSection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import FloatingNavigation from '@/components/FloatingNavigation';
import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import GuidedTour from '@/components/GuidedTour';

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState('hero');
  const [showTour, setShowTour] = useState(false);

  // Check if user is new by checking localStorage
  useEffect(() => {
    const isNewUser = !localStorage.getItem('visited');
    if (isNewUser) {
      localStorage.setItem('visited', 'true');
      setShowTour(true);
    }
  }, []);

  // Handle scroll to update current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'hero',
        'skills',
        'projects',
        'services',
        'blog',
        'contact',
      ];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (!element) continue;
        
        const rect = element.getBoundingClientRect();
        // If the section is in view (with a buffer)
        if (rect.top <= 100 && rect.bottom >= 100) {
          setCurrentSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col relative">
      <CustomCursor currentSection={currentSection} />
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <SkillsSection />
        <ProjectsSection />
        <ServicesSection />
        <BlogSection />
        <ContactSection />
      </main>
      
      <FloatingNavigation currentSection={currentSection} />
      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
      <Footer />
    </div>
  );
}