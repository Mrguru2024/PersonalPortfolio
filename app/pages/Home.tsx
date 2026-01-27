"use client";

import { useEffect, useRef, Suspense, lazy } from "react";
import { PageSEO, StructuredData } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load sections for better performance
const HeroSection = lazy(() => import("@/sections/HeroSection").then(m => ({ default: m.default })));
const ServicesSection = lazy(() => import("@/sections/ServicesSection").then(m => ({ default: m.default })));
const ProjectsSection = lazy(() => import("@/sections/ProjectsSection").then(m => ({ default: m.default })));
const AboutSection = lazy(() => import("@/sections/AboutSection").then(m => ({ default: m.default })));
const SkillsSection = lazy(() => import("@/sections/SkillsSection").then(m => ({ default: m.default })));
const BlogSection = lazy(() => import("@/sections/BlogSection").then(m => ({ default: m.default })));
const ContactSection = lazy(() => import("@/sections/ContactSection").then(m => ({ default: m.default })));

// Loading skeleton for sections
const SectionSkeleton = () => (
  <div className="py-20 px-4">
    <div className="container mx-auto max-w-7xl">
      <Skeleton className="h-12 w-64 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  </div>
);

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
      <Suspense fallback={<SectionSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ProjectsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SkillsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BlogSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ContactSection />
      </Suspense>
    </>
  );
};

export default Home;
