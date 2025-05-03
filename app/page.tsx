"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Import section components (we'll create these next)
// import HeroSection from "@/components/sections/HeroSection";
// import AboutSection from "@/components/sections/AboutSection";
// import ProjectsSection from "@/components/sections/ProjectsSection";
// import SkillsSection from "@/components/sections/SkillsSection";
// import ContactSection from "@/components/sections/ContactSection";

export default function HomePage() {
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  
  return (
    <>
      <Header 
        currentSection="home" 
        onNavToggle={() => setQuickNavOpen(true)}
      />
      
      <main className="flex flex-col min-h-screen">
        {/* These section components will be created next */}
        <div className="pt-20 text-center">
          <h1 className="heading-xl mb-4">Anthony "MrGuru" Feaster</h1>
          <p className="text-xl">Full Stack Developer | Atlanta, GA</p>
          <p className="mt-8 mx-auto max-w-2xl">
            I'm working on implementing the section components. This is a placeholder
            for the homepage content that will be fully migrated from Vite to Next.js.
          </p>
        </div>
        
        {/* 
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
        */}
      </main>
      
      <Footer />
    </>
  );
}