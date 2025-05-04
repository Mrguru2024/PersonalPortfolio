import { useEffect, useRef } from "react";
import HeroSection from "@/sections/HeroSection";
import ProjectsSection from "@/sections/ProjectsSection";
import AboutSection from "@/sections/AboutSection";
import SkillsSection from "@/sections/SkillsSection";
import BlogSection from "@/sections/BlogSection";
import ContactSection from "@/sections/ContactSection";
import { PageSEO } from "@/components/SEO";

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
      {/* Add SEO for Homepage */}
      <PageSEO 
        title="Anthony Feaster | Full Stack Developer | MrGuru.dev"
        description="Anthony Feaster is a Full Stack Developer specializing in modern web technologies. Explore my portfolio of projects, skills, and expertise."
        keywords={["fullstack", "developer", "React", "Node.js", "JavaScript", "portfolio", "web development"]}
        schemaType="ProfilePage"
      />
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
