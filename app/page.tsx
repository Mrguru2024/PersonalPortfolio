"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
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
        <HeroSection />
        <AboutSection />
        
        {/* These sections will be implemented next */}
        <div className="section bg-background" id="projects">
          <div className="container-custom text-center py-20">
            <h2 className="heading-lg mb-6">My <span className="gradient-text">Projects</span></h2>
            <p className="text-muted-foreground mx-auto max-w-2xl mb-8">
              The Projects section will be implemented next, showcasing my portfolio work including
              Stackzen, Keycode Help, Inventory management system, and Gatherly.
            </p>
          </div>
        </div>
        
        <div className="section bg-card" id="skills">
          <div className="container-custom text-center py-20">
            <h2 className="heading-lg mb-6">My <span className="gradient-text">Skills</span></h2>
            <p className="text-muted-foreground mx-auto max-w-2xl mb-8">
              The Skills section will be implemented next, displaying my technical expertise
              across front-end, back-end, and DevOps technologies.
            </p>
          </div>
        </div>
        
        <div className="section bg-background" id="contact">
          <div className="container-custom text-center py-20">
            <h2 className="heading-lg mb-6">Get In <span className="gradient-text">Touch</span></h2>
            <p className="text-muted-foreground mx-auto max-w-2xl mb-8">
              The Contact section will be implemented next, providing a form to reach out
              and connect with me regarding potential opportunities.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}