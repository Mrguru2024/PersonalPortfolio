"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PageSEO, StructuredData } from "@/components/SEO";
import HeroSection from "@/sections/HeroSection";
import SectionPlaceholder from "@/components/SectionPlaceholder";
import SectionLoadErrorFallback from "@/components/SectionLoadErrorFallback";

/** Only mount children when this slot is near the viewport. Large rootMargin = start loading earlier so section is ready when user scrolls. */
function LazyWhenVisible({
  children,
  minHeight,
  onVisible,
}: {
  children: React.ReactNode;
  minHeight: string;
  onVisible?: () => void;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          onVisible?.();
        }
      },
      { rootMargin: "900px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  if (!inView) {
    return (
      <div ref={ref} className={minHeight}>
        <SectionPlaceholder minHeight={minHeight} />
      </div>
    );
  }
  return <>{children}</>;
}

const CHUNK_RETRY_DELAY_MS = 500;
const CHUNK_MAX_RETRIES = 2;

function withChunkFallback<T>(
  loader: () => Promise<{ default: T }>,
  fallback: React.ComponentType<{ minHeight?: string }>
) {
  return function loadWithRetry(): Promise<{ default: T }> {
    const attempt = (retriesLeft: number): Promise<{ default: T }> =>
      loader().catch((err: unknown) => {
        const isChunkError =
          (err && typeof err === "object" && (err as { name?: string }).name === "ChunkLoadError") ||
          (typeof (err as { message?: string })?.message === "string" &&
            ((err as { message: string }).message.includes("Loading chunk") ||
              (err as { message: string }).message.includes("Failed to load chunk") ||
              (err as { message: string }).message.includes("dynamically imported module")));
        if (retriesLeft > 0 && isChunkError) {
          return new Promise((resolve, reject) => {
            setTimeout(
              () => attempt(retriesLeft - 1).then(resolve).catch(reject),
              CHUNK_RETRY_DELAY_MS
            );
          });
        }
        return { default: fallback as T };
      });
    return attempt(CHUNK_MAX_RETRIES);
  };
}

// Below-the-fold sections: lazy load with retry + chunk-error fallback so ChunkLoadError doesn't crash the page
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
    )(),
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
    )(),
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
    )(),
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
    )(),
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
    )(),
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
    )(),
  {
    loading: () => <SectionPlaceholder minHeight="min-h-[380px]" />,
    ssr: false,
  }
);

const ViewModeToggle = dynamic(() => import("@/components/ViewModeToggle"), {
  ssr: false,
  loading: () => null,
});

// Prefetch next section chunks when user scrolls so the next section is ready by the time they reach it
const prefetchServices = () => import("@/sections/ServicesSection");
const prefetchProjects = () => import("@/sections/Projects");
const prefetchAbout = () => import("@/sections/AboutSection");
const prefetchSkills = () => import("@/sections/SkillsSection");
const prefetchBlog = () => import("@/sections/Blog");
const prefetchContact = () => import("@/sections/ContactSection");

interface HomeProps {
  onSectionChange?: (sectionId: string) => void;
}

const Home = ({ onSectionChange }: HomeProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);

  const [currentSection, setCurrentSection] = useState("home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prefetch first below-fold section soon after load so it's ready when user scrolls
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(prefetchServices, 1500);
    return () => clearTimeout(t);
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
        title="Anthony MrGuru Feaster | Senior Full Stack Developer | Ascendra Technologies"
        description="Anthony MrGuru Feaster is a Senior Full Stack Developer at Ascendra Technologies. Explore projects, skills, and start your next web project with a proven professional."
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
            name: "Anthony MrGuru Feaster",
            jobTitle: "Senior Full Stack Developer",
            image: "https://mrguru.dev/images/profile.jpg",
            url: "https://mrguru.dev",
            sameAs: [
              "https://github.com/Mrguru2024",
              "https://www.linkedin.com/in/anthony-mrguru-feaster",
            ],
            description:
              "Senior Full Stack Developer at Ascendra Technologies. Full-stack web applications, clean architecture, and professional delivery.",
          },
        }}
      />
      <StructuredData
        schema={{
          type: "WebSite",
          data: {
            name: "Ascendra Technologies – Anthony MrGuru Feaster",
            description:
              "Professional portfolio of Anthony MrGuru Feaster, Senior Full Stack Developer at Ascendra Technologies. Projects, skills, and services to start your next web project.",
            url: "https://mrguru.dev",
            author: { name: "Anthony MrGuru Feaster", url: "https://mrguru.dev" },
          },
        }}
      />

      <HeroSection />
      <LazyWhenVisible minHeight="min-h-[400px]" onVisible={prefetchProjects}>
        <ServicesSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[480px]" onVisible={prefetchAbout}>
        <ProjectsSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[360px]" onVisible={prefetchSkills}>
        <AboutSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[420px]" onVisible={prefetchBlog}>
        <SkillsSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[400px]" onVisible={prefetchContact}>
        <BlogSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="min-h-[380px]">
        <ContactSection />
      </LazyWhenVisible>

      {mounted && <ViewModeToggle />}
    </>
  );
};

export default Home;
