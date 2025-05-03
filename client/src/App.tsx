import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProjectDetails from "@/pages/ProjectDetails";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import AdminBlog from "@/pages/AdminBlog";
import AuthPage from "@/pages/auth-page";
import ResumePage from "@/pages/ResumePage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import FloatingNavigation from "@/components/FloatingNavigation";
import GuidedTour from "@/components/GuidedTour";
import JourneyExperience from "@/components/JourneyExperience";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects/:id" component={ProjectDetails} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/resume" component={ResumePage} />
      <ProtectedRoute path="/admin/blog" component={AdminBlog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // State to track the current section of the website the user is viewing
  const [currentSection, setCurrentSection] = useState<string>('Home');

  // Update current section based on scroll position
  useEffect(() => {
    // Debounced scroll handler to improve performance
    let scrollTimeout: number | null = null;
    
    const handleScroll = () => {
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        const scrollPosition = window.scrollY;
        
        // Get all section elements
        const sections = document.querySelectorAll('section[id]');
        
        // If no sections found, keep Home as default 
        if (sections.length === 0) {
          setCurrentSection('Home');
          return;
        }
        
        // Find the section that is currently most visible in the viewport
        let currentSectionId = 'Home';
        let maxVisibility = 0;
        
        sections.forEach((section) => {
          const sectionTop = (section as HTMLElement).offsetTop;
          const sectionHeight = (section as HTMLElement).offsetHeight;
          
          // Calculate how much of the section is visible in the viewport
          const sectionBottom = sectionTop + sectionHeight;
          const visibleTop = Math.max(sectionTop, scrollPosition);
          const visibleBottom = Math.min(sectionBottom, scrollPosition + window.innerHeight);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          
          // Calculate visibility as a percentage of the section that's visible
          const visibility = visibleHeight / sectionHeight;
          
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            currentSectionId = section.id || 'Home';
          }
        });
        
        // Format the section name (e.g., "projects" -> "Projects")
        const formattedSectionName = currentSectionId.charAt(0).toUpperCase() + currentSectionId.slice(1);
        
        // Only update if different (prevents unnecessary re-renders)
        if (formattedSectionName !== currentSection) {
          setCurrentSection(formattedSectionName);
        }
      }, 100); // Small delay for debounce
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set the initial section
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <CustomCursor currentSection={currentSection} />
          <div className="flex flex-col min-h-screen cursor-none md:cursor-none">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            <FloatingNavigation />
            <GuidedTour />
            <JourneyExperience activeSection={currentSection} />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
