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
        title="Anthony MrGuru Feaster | Senior Full Stack Developer | Ascendra Technologies"
        description="Anthony MrGuru Feaster is a Senior Full Stack Developer at Ascendra Technologies. Explore projects, skills, and start your next web project with a proven professional."
        keywords={["fullstack", "developer", "React", "Node.js", "JavaScript", "portfolio", "web development"]}
        schemaType="ProfilePage"
      />
      
      {/* Add Person structured data */}
      <StructuredData 
        schema={{
          type: 'Person',
          data: {
            name: 'Anthony MrGuru Feaster',
            jobTitle: 'Senior Full Stack Developer',
            image: 'https://mrguru.dev/images/profile.jpg',
            url: 'https://mrguru.dev',
            sameAs: [
              'https://github.com/Mrguru2024',
              'https://www.linkedin.com/in/anthony-mrguru-feaster',
            ],
            description: 'Senior Full Stack Developer at Ascendra Technologies. Full-stack web applications, clean architecture, and professional delivery.'
          }
        }}
      />
      
      {/* Add Website structured data */}
      <StructuredData 
        schema={{
          type: 'WebSite',
          data: {
            name: 'Ascendra Technologies – Anthony MrGuru Feaster',
            description: 'Professional portfolio of Anthony MrGuru Feaster, Senior Full Stack Developer at Ascendra Technologies. Projects, skills, and services to start your next web project.',
            url: 'https://mrguru.dev',
            author: {
              name: 'Anthony MrGuru Feaster',
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
