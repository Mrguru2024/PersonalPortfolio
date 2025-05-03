'use client';

import React from 'react';
import HeroSection from '@/sections/HeroSection';
import AboutSection from '@/sections/AboutSection';
import ProjectsSection from '@/sections/ProjectsSection';
import SkillsSection from '@/sections/SkillsSection';
import ContactSection from '@/sections/ContactSection';
import ParallaxBackground from '@/components/ParallaxBackground';

export default function Home() {
  return (
    <>
      <ParallaxBackground />
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <ContactSection />
    </>
  );
}