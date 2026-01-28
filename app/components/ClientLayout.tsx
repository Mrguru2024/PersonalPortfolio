"use client";

import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import FloatingNavigation from "@/components/FloatingNavigation";
import GuidedTour from "@/components/GuidedTour";
import JourneyExperience from "@/components/JourneyExperienceNew";
import ViewModeToggle from "@/components/ViewModeToggle";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NoSSR } from "@/components/NoSSR";
import { Code } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState<string>("Home");
  const [isImmersive, setIsImmersive] = useState<boolean>(true); // Default to true, will update on mount
  const [mounted, setMounted] = useState(false);

  // Only access localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    const savedPreference = localStorage.getItem("isImmersiveMode");
    if (savedPreference !== null) {
      setIsImmersive(savedPreference === "true");
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isImmersive) return;

    let scrollTimeout: number | null = null;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
        });
        ticking = true;
      }
      
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }

      scrollTimeout = window.setTimeout(() => {
        const scrollPosition = window.scrollY;
        const sections = document.querySelectorAll("section[id]");

        if (sections.length === 0) {
          setCurrentSection("Home");
          return;
        }

        let currentSectionId = "Home";
        let maxVisibility = 0;

        sections.forEach((section) => {
          const sectionTop = (section as HTMLElement).offsetTop;
          const sectionHeight = (section as HTMLElement).offsetHeight;
          const sectionBottom = sectionTop + sectionHeight;
          const visibleTop = Math.max(sectionTop, scrollPosition);
          const visibleBottom = Math.min(
            sectionBottom,
            scrollPosition + window.innerHeight
          );
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const visibility = visibleHeight / sectionHeight;

          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            currentSectionId = section.id || "Home";
          }
        });

        const formattedSectionName =
          currentSectionId.charAt(0).toUpperCase() + currentSectionId.slice(1);

        if (formattedSectionName !== currentSection) {
          setCurrentSection(formattedSectionName);
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
    };
  }, [isImmersive, currentSection, mounted]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    try {
      if (isImmersive) {
        document.documentElement.classList.add("use-custom-cursor");
      } else {
        document.documentElement.classList.remove("use-custom-cursor");
      }
    } catch (error) {
      console.warn("Error updating document classes:", error);
    }
  }, [isImmersive]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
              <Toaster />
              {mounted && isImmersive && <CustomCursor currentSection={currentSection} />}
              <div
                className={`flex flex-col min-h-screen ${
                  mounted && isImmersive ? "cursor-none md:cursor-none" : ""
                }`}
              >
                <NoSSR
                  fallback={
                    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm transition-colors duration-300">
                      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                        <div className="text-xl font-bold text-primary flex items-center">
                          <Code className="h-6 w-6" />
                          <span className="ml-2 hidden sm:inline">MrGuru.dev</span>
                        </div>
                      </div>
                    </header>
                  }
                >
                  <Header
                    currentSection={currentSection}
                    onNavToggle={() => {}}
                  />
                </NoSSR>
                <main className="flex-grow pb-28 md:pb-32 safe-area-bottom">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </main>
                <Footer />
                {mounted && isImmersive && (
                  <>
                    <NoSSR>
                      <FloatingNavigation />
                    </NoSSR>
                    <NoSSR>
                      <GuidedTour />
                    </NoSSR>
                    <NoSSR>
                      <JourneyExperience activeSection={currentSection} />
                    </NoSSR>
                  </>
                )}
                {mounted && (
                  <ViewModeToggle
                    isImmersive={isImmersive}
                    setIsImmersive={setIsImmersive}
                  />
                )}
              </div>
              <Analytics />
            </ThemeProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
