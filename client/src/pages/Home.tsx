import { useEffect, useRef } from "react";
import HeroSection from "@/sections/HeroSection";
import ProjectsSection from "@/sections/ProjectsSection";
import AboutSection from "@/sections/AboutSection";
import SkillsSection from "@/sections/SkillsSection";
import BlogSection from "@/sections/BlogSection";
import ContactSection from "@/sections/ContactSection";
import { PageSEO, StructuredData } from "@/components/SEO";

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
      
      {/* Add Person structured data */}
      <StructuredData 
        schema={{
          type: 'Person',
          data: {
            name: 'Anthony Feaster',
            jobTitle: 'Full Stack Developer',
            image: 'https://mrguru.dev/images/profile.jpg',
            url: 'https://mrguru.dev',
            sameAs: [
              'https://github.com/Mrguru2024',
              'https://www.linkedin.com/in/anthony-feaster',
            ],
            description: 'Full Stack Developer specializing in React, Node.js, and modern web technologies.'
          }
        }}
      />
      
      {/* Add Website structured data */}
      <StructuredData 
        schema={{
          type: 'WebSite',
          data: {
            name: 'MrGuru.dev - Anthony Feaster\'s Portfolio',
            description: 'Professional portfolio of Anthony Feaster, showcasing projects, skills, and services in full stack development.',
            url: 'https://mrguru.dev',
            author: {
              name: 'Anthony Feaster',
              url: 'https://mrguru.dev'
            }
          }
        }}
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
