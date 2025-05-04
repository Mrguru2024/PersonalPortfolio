import { useEffect, useRef } from "react";
import HeroSection from "@/sections/HeroSection";
import ProjectsSection from "@/sections/ProjectsSection";
import AboutSection from "@/sections/AboutSection";
import SkillsSection from "@/sections/SkillsSection";
import BlogSection from "@/sections/BlogSection";
import ContactSection from "@/sections/ContactSection";

interface HomeProps {
  onSectionChange?: (sectionId: string) => void;
}

const Home = ({ onSectionChange }: HomeProps) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    // Only set up the observer if onSectionChange is provided
    if (onSectionChange) {
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target.id) {
              onSectionChange(entry.target.id);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: 0.5,
        }
      );

      // Get all section elements
      const sections = document.querySelectorAll("section[id]");
      sectionsRef.current = Array.from(sections) as HTMLElement[];

      // Observe each section
      sectionsRef.current.forEach((section) => {
        if (observer.current) {
          observer.current.observe(section);
        }
      });

      return () => {
        if (observer.current) {
          sectionsRef.current.forEach((section) => {
            observer.current?.unobserve(section);
          });
        }
      };
    }
  }, [onSectionChange]);

  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <AboutSection />
      <SkillsSection />
      <BlogSection />
      <ContactSection />
    </>
  );
};

export default Home;
