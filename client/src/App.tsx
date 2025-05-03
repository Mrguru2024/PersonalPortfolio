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
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Get all section elements
      const sections = document.querySelectorAll('section[id]');
      
      // Find the section that is currently most visible in the viewport
      let currentSectionId = 'Home';
      let maxVisibility = 0;
      
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        
        // Calculate how much of the section is visible
        const visibility = Math.min(
          1,
          Math.max(
            0,
            Math.min(
              window.innerHeight,
              sectionTop + sectionHeight - scrollPosition
            ) -
            Math.max(0, sectionTop - scrollPosition)
          ) / sectionHeight
        );
        
        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          currentSectionId = section.id || 'Home';
        }
      });
      
      // Format the section name (e.g., "projects" -> "Projects")
      const formattedSectionName = currentSectionId.charAt(0).toUpperCase() + currentSectionId.slice(1);
      setCurrentSection(formattedSectionName);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set the initial section
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
