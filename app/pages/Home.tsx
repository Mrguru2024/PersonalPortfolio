"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PageSEO, StructuredData } from "@/components/SEO";
import HeroSection from "@/sections/HeroSection";
import SectionPlaceholder from "@/components/SectionPlaceholder";
import SectionLoadErrorFallback from "@/components/SectionLoadErrorFallback";

/** Only mount children when this slot is near the viewport – reduces initial chunk requests */
function LazyWhenVisible({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight: string;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: "400px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!inView) {
    return (
      <div ref={ref} className={minHeight}>
        <SectionPlaceholder minHeight={minHeight} />
      </div>
    );
  }
  return <>{children}</>;
}

function withChunkFallback<T>(
  loader: () => Promise<{ default: T }>,
  fallback: React.ComponentType<{ minHeight?: string }>
) {
  return loader().catch(() => ({ default: fallback as T }));
}

// Below-the-fold sections: lazy load with chunk-error fallback so ChunkLoadError doesn't crash the page
const ServicesSection = dynamic(
  () =>
    withChunkFallback(
      () =>
        import("@/sections/ServicesSection").then((m) => ({
          default: m.default,
        })),
      () => (
        <SectionLoadErrorFallback
          sectionName="Services"
          minHeight="min-h-[400px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[400px]" />,
    ssr: false,
  }
);
const ProjectsSection = dynamic(
  () =>
    withChunkFallback(
      () => import("@/sections/Projects").then((m) => ({ default: m.default })),
      () => (
        <SectionLoadErrorFallback
          sectionName="Projects"
          minHeight="min-h-[480px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[480px]" />,
    ssr: false,
  }
);
const AboutSection = dynamic(
  () =>
    withChunkFallback(
      () =>
        import("@/sections/AboutSection").then((m) => ({ default: m.default })),
      () => (
        <SectionLoadErrorFallback
          sectionName="About"
          minHeight="min-h-[360px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[360px]" />,
    ssr: false,
  }
);
const SkillsSection = dynamic(
  () =>
    withChunkFallback(
      () =>
        import("@/sections/SkillsSection").then((m) => ({
          default: m.default,
        })),
      () => (
        <SectionLoadErrorFallback
          sectionName="Skills"
          minHeight="min-h-[420px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[420px]" />,
    ssr: false,
  }
);
const BlogSection = dynamic(
  () =>
    withChunkFallback(
      () => import("@/sections/Blog").then((m) => ({ default: m.default })),
      () => (
        <SectionLoadErrorFallback
          sectionName="Blog"
          minHeight="min-h-[400px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[400px]" />,
    ssr: false,
  }
);
const ContactSection = dynamic(
  () =>
    withChunkFallback(
      () =>
        import("@/sections/ContactSection").then((m) => ({
          default: m.default,
        })),
      () => (
        <SectionLoadErrorFallback
          sectionName="Contact"
          minHeight="min-h-[380px]"
        />
      )
    ),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[380px]" />,
    ssr: false,
  }
);

const ViewModeToggle = dynamic(() => import("@/components/ViewModeToggle"), {
  ssr: false,
  loading: () => null,
});

interface HomeProps {
  onSectionChange?: (sectionId: string) => void;
}

const Home = ({ onSectionChange }: HomeProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);

  const [currentSection, setCurrentSection] = useState("home");
  const [isImmersive, setIsImmersive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Hydration-safe init for immersive mode from localStorage (deferred)
  useEffect(() => {
    if (!mounted) return;
    const saved =
      typeof window !== "undefined" && localStorage.getItem("isImmersiveMode");
    setIsImmersive(saved ? saved === "true" : true);
  }, [mounted]);

  // Defer scroll listener so first paint isn't blocked
  useEffect(() => {
    if (!mounted) return;
    let teardown: (() => void) | undefined;
    const id = setTimeout(() => {
      let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

      const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollY = window.scrollY;
          const sections = document.querySelectorAll("section[id]");
          if (sections.length === 0) {
            setCurrentSection("home");
            return;
          }
          let bestId = "home";
          let maxVisibility = 0;
          sections.forEach((el) => {
            const section = el as HTMLElement;
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const bottom = top + height;
            const visibleTop = Math.max(top, scrollY);
            const visibleBottom = Math.min(
              bottom,
              scrollY + window.innerHeight
            );
            const visible = Math.max(0, visibleBottom - visibleTop) / height;
            if (visible > maxVisibility) {
              maxVisibility = visible;
              bestId = section.id || "home";
            }
          });
          const formatted = bestId.charAt(0).toUpperCase() + bestId.slice(1);
          setCurrentSection(formatted);
        }, 100);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      teardown = () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }, 0);

    return () => {
      clearTimeout(id);
      teardown?.();
    };
  }, [mounted]);

  // Optional: intersection observer for parent callback (deferred)
  useEffect(() => {
    if (!onSectionChange || !mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id)
            onSectionChange(entry.target.id);
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.5 }
    );
    observerRef.current = observer;
    const t = setTimeout(() => {
      const sections = document.querySelectorAll("section[id]");
      sectionsRef.current = Array.from(sections) as HTMLElement[];
      sectionsRef.current.forEach((s) => observer.observe(s));
    }, 100);
    return () => {
      clearTimeout(t);
      sectionsRef.current.forEach((s) => observer.unobserve(s));
      observerRef.current = null;
    };
  }, [onSectionChange, mounted]);

  return (
    <>
      <PageSEO
        title="Anthony Feaster | Full Stack Developer | Ascendra Technologies"
        description="Anthony Feaster is a Full Stack Developer at Ascendra Technologies, specializing in modern web technologies. Explore our portfolio of projects, skills, and expertise."
        keywords={[
          "fullstack",
          "developer",
          "React",
          "Node.js",
          "JavaScript",
          "portfolio",
          "web development",
        ]}
        schemaType="ProfilePage"
      />
      <StructuredData
        schema={{
          type: "Person",
          data: {
            name: "Anthony Feaster",
            jobTitle: "Full Stack Developer",
            image: "https://mrguru.dev/images/profile.jpg",
            url: "https://mrguru.dev",
            sameAs: [
              "https://github.com/Mrguru2024",
              "https://www.linkedin.com/in/anthony-feaster",
            ],
            description:
              "Full Stack Developer specializing in React, Node.js, and modern web technologies.",
          },
        }}
      />
      <StructuredData
        schema={{
          type: "WebSite",
          data: {
            name: "Ascendra Technologies – Anthony Feaster's Portfolio",
            description:
              "Professional portfolio of Anthony Feaster, showcasing projects, skills, and services in full stack development.",
            url: "https://mrguru.dev",
            author: { name: "Anthony Feaster", url: "https://mrguru.dev" },
          },
        }}
      />

      <HeroSection />
      <LazyWhenVisible minHeight="min-h-[400px]">
        <ServicesSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[480px]">
        <ProjectsSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[360px]">
        <AboutSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[420px]">
        <SkillsSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[400px]">
        <BlogSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[380px]">
        <ContactSection />
      </LazyWhenVisible>

      {mounted && (
        <ViewModeToggle
          isImmersive={isImmersive}
          setIsImmersive={setIsImmersive}
        />
      )}
    </>
  );
};

export default Home;
