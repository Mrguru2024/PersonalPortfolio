import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Code, Briefcase, Send, Bot, Cpu, X } from 'lucide-react';

// Custom hook to safely get window dimensions
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Guru Character component - follows user through journey
const GuruCharacter: React.FC<{ 
  position: number; 
  isActive: boolean;
  onClosePopup: () => void;
}> = ({ position, isActive, onClosePopup }) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isSmall = width < 640;
  const headSize = isMobile ? 8 : 12;
  const iconSize = isMobile ? 16 : 24;
  const sparkleSize1 = isMobile ? 10 : 14;
  const sparkleSize2 = isMobile ? 8 : 12;
  
  return (
    <motion.div 
      className="absolute z-10 pointer-events-none"
      style={{ 
        bottom: `${position}%`,
        left: '50%',
        x: '-50%',
      }}
      animate={{ 
        y: isActive ? [0, -10, 0] : 0,
        scale: isActive ? [1, 1.05, 1] : 1,
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity,
        repeatType: "reverse" 
      }}
    >
      {/* Character with glow effect */}
      <div className="relative">
        <motion.div 
          className="absolute -inset-2 bg-primary/20 rounded-full blur-md"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="relative flex flex-col items-center">
          <div 
            className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white border-2 border-white shadow-lg"
            style={{ width: `${headSize * 4}px`, height: `${headSize * 4}px` }}
          >
            <Bot size={iconSize} />
          </div>
          
          <motion.div 
            className="mt-1 bg-blue-400 rounded-t-full"
            style={{ width: `${isMobile ? 16 : 24}px`, height: `${isMobile ? 4 : 8}px` }}
            animate={{ 
              height: isMobile ? [4, 8, 4] : [8, 14, 8],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          <motion.div 
            className="absolute -top-1 -right-1 text-yellow-300"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles size={sparkleSize1} />
          </motion.div>
          
          <motion.div 
            className="absolute -bottom-2 -left-2 text-blue-300"
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles size={sparkleSize2} />
          </motion.div>
        </div>
      </div>
      
      {/* Dialog bubble - smaller and less intrusive on mobile */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="absolute p-2 sm:p-3 rounded-lg bg-white/95 dark:bg-gray-800/95 w-36 sm:w-44 md:w-48 z-10 text-xs md:text-sm border border-primary/20 pointer-events-auto cursor-pointer shadow-lg"
            style={{
              ...(isSmall
                ? {
                    top: '110%', 
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }
                : {
                    left: '120%', 
                    top: '0'
                  }),
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 0 10px rgba(59, 130, 246, 0.08)'
            }}
            initial={{ opacity: 0, scale: 0.8, y: isSmall ? 10 : 0, x: isSmall ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: isSmall ? 10 : 0, x: isSmall ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            onClick={onClosePopup}
          >
            {/* Close button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClosePopup();
              }}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Close popup"
            >
              <X size={14} />
            </button>
            
            <div className="font-medium text-primary mb-1 pr-4">MrGuru</div>
            <div className="text-gray-700 dark:text-gray-300">
              {isMobile 
                ? "Follow me through this journey!" 
                : "Follow me through this digital journey! I'll show you what I can create for you."}
            </div>
            <div 
              className="absolute w-2 h-2 bg-white dark:bg-gray-800 transform border-primary/20"
              style={{
                ...(isSmall
                  ? {
                      bottom: '-8px',
                      left: '50%',
                      marginLeft: '-4px',
                      borderLeft: '1px solid',
                      borderBottom: '1px solid',
                      transform: 'rotate(-45deg)'
                    }
                  : {
                      left: '-8px',
                      top: '12px',
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      transform: 'rotate(-45deg)'
                    })
              }}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Milestone interface
interface Milestone {
  id: string;
  label: string;
  position: number; // percentage down the path (0-100)
  icon: React.ReactNode;
  description: string;
  cta: string;
  elementId?: string;
}

interface JourneyExperienceProps {
  activeSection?: string;
}

const JourneyExperienceNew: React.FC<JourneyExperienceProps> = ({ activeSection }) => {
  const { width, height } = useWindowSize();
  const isTiny = width < 320; // Foldable folded
  const isSmall = width < 480; // Small mobile
  const isMobile = width < 768; // Mobile/tablet
  const isFoldable = width >= 280 && width <= 512; // Foldable range
  const isTablet = width >= 768 && width < 1024;
  // Refs
  const pathRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for journey
  const [guruPosition, setGuruPosition] = useState<number>(95);
  const [isGuruActive, setIsGuruActive] = useState<boolean>(true);
  const [showInitialAnimation, setShowInitialAnimation] = useState<boolean>(true);
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(false);
  
  // Single state for active milestone popup
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  
  // Track which sections have been manually closed (don't show popups until next section)
  const [manuallyClosedSections, setManuallyClosedSections] = useState<Set<string>>(new Set());
  const [lastClosedSection, setLastClosedSection] = useState<string | null>(null);
  
  // Track scroll position
  const { scrollYProgress } = useScroll();
  
  // Calculate milestone positions based on actual page sections
  const [milestonePositions, setMilestonePositions] = useState<Record<string, number>>({});
  const [currentVisibleSection, setCurrentVisibleSection] = useState<string>('home');
  
  // Use IntersectionObserver to detect which section is currently visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const calculatePositions = () => {
      const positions: Record<string, number> = {};
      const sectionIds = ['home', 'about', 'projects', 'skills', 'blog', 'contact'];
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollableHeight <= 0) {
        // If page isn't scrollable yet, set default positions
        sectionIds.forEach((id, index) => {
          positions[id] = 90 - (index * 15);
        });
        setMilestonePositions(positions);
        return;
      }
      
      sectionIds.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          // Calculate position as percentage of scrollable height
          const scrollProgress = elementTop / scrollableHeight;
          // Convert to position on journey path (inverted: top of page = bottom of path)
          positions[sectionId] = Math.max(5, Math.min(95, 95 - (scrollProgress * 90)));
        }
      });
      
      setMilestonePositions(positions);
    };
    
    // IntersectionObserver to detect visible section
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section with the highest intersection ratio
        let maxRatio = 0;
        let visibleSection = 'home';
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            visibleSection = entry.target.id || 'home';
          }
        });
        
        // Update if we found a section that's at least 20% visible (lower threshold for better responsiveness)
        if (maxRatio > 0.2) {
          setCurrentVisibleSection((prev) => {
            // Only update if different to avoid unnecessary re-renders
            return prev !== visibleSection ? visibleSection : prev;
          });
        }
      },
      {
        root: null,
        rootMargin: '-10% 0px -10% 0px', // Trigger when section is in middle 80% of viewport (more responsive)
        threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0] // More granular thresholds
      }
    );
    
    // Observe all sections
    const sectionIds = ['home', 'about', 'projects', 'skills', 'blog', 'contact'];
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });
    
    // Calculate initial positions
    calculatePositions();
    
    // Recalculate on resize and scroll (throttled for performance)
    let resizeTimeout: NodeJS.Timeout;
    let scrollTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculatePositions, 150);
    };
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(calculatePositions, 100); // Recalculate positions during scroll
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Recalculate after sections are rendered (multiple attempts to catch lazy-loaded content)
    const timeout1 = setTimeout(calculatePositions, 500);
    const timeout2 = setTimeout(calculatePositions, 1000);
    const timeout3 = setTimeout(calculatePositions, 2000);
    const timeout4 = setTimeout(calculatePositions, 3000);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(resizeTimeout);
      clearTimeout(scrollTimeout);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, []);
  
  // Milestones definition with dynamic positions based on actual section positions
  // Use useMemo to recalculate when positions change
  const milestones: Milestone[] = useMemo(() => [
    {
      id: 'home',
      label: 'Start Your Journey',
      position: milestonePositions['home'] || 90,
      icon: <Sparkles className="text-yellow-400" size={20} />,
      description: "Welcome! I'm MrGuru, your guide to my digital portfolio. Ready to see what I can create?",
      cta: "Begin Journey",
      elementId: "home",
    },
    {
      id: 'about',
      label: 'About Me',
      position: milestonePositions['about'] || 75,
      icon: <Sparkles className="text-blue-400" size={20} />,
      description: "Learn about my background, expertise, and the value I can bring to your project. Discover my journey, skills, and what drives me as a developer.",
      cta: "Explore About",
      elementId: "about",
    },
    {
      id: 'projects',
      label: 'Browse Projects',
      position: milestonePositions['projects'] || 60,
      icon: <Briefcase className="text-blue-400" size={20} />,
      description: "Check out my showcase of innovative web applications and digital experiences. See real-world solutions I've built for clients.",
      cta: "View Projects",
      elementId: "projects",
    },
    {
      id: 'skills',
      label: 'Discover Skills',
      position: milestonePositions['skills'] || 45,
      icon: <Code className="text-green-400" size={20} />,
      description: "Explore my technical skills and expertise across frontend, backend, and more. From React to Node.js, see what I can do.",
      cta: "See Skills",
      elementId: "skills",
    },
    {
      id: 'blog',
      label: 'Latest Blog',
      position: milestonePositions['blog'] || 30,
      icon: <Code className="text-purple-400" size={20} />,
      description: "Read my latest thoughts, insights, and updates from my journey as a developer. Learn about web development, best practices, and more.",
      cta: "Read Blog",
      elementId: "blog",
    },
    {
      id: 'contact',
      label: 'Let\'s Connect',
      position: milestonePositions['contact'] || 15,
      icon: <Send className="text-purple-400" size={20} />,
      description: "Ready to work together? Let's discuss how I can help bring your ideas to life. Get in touch for your next project.",
      cta: "Connect Now",
      elementId: "contact",
    },
  ], [milestonePositions]);
  
  // Update active milestone based on visible section (from IntersectionObserver)
  useEffect(() => {
    if (!hasStartedJourney && showInitialAnimation) return;
    
    // Find milestone that matches the visible section
    const matchingMilestone = milestones.find(m => 
      m.elementId === currentVisibleSection || m.id === currentVisibleSection
    );
    
    if (matchingMilestone && matchingMilestone.id !== activeMilestoneId) {
      const sectionKey = matchingMilestone.elementId || matchingMilestone.id;
      
      // If we're entering a new section (different from the last closed one), reset closed state
      if (lastClosedSection && sectionKey !== lastClosedSection) {
        // New section entered, clear the closed state for the previous section
        setManuallyClosedSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(lastClosedSection);
          return newSet;
        });
        setLastClosedSection(null);
      }
      
      // Check if this section was manually closed (after potentially clearing previous section)
      const wasManuallyClosed = manuallyClosedSections.has(sectionKey);
      
      // Only show popup if this section wasn't manually closed
      if (!wasManuallyClosed) {
        setActiveMilestoneId(matchingMilestone.id);
        setIsGuruActive(true);
      } else {
        // Section was closed, just update position but don't show popup
        setActiveMilestoneId(null);
        setIsGuruActive(false);
      }
      
      // Smoothly move guru to the milestone position regardless
      const milestoneKey = matchingMilestone.elementId || matchingMilestone.id;
      const targetPosition = milestonePositions[milestoneKey] || matchingMilestone.position;
      setGuruPosition(targetPosition);
    }
  }, [currentVisibleSection, hasStartedJourney, showInitialAnimation, milestones, activeMilestoneId, manuallyClosedSections, lastClosedSection]);
  
  // Update based on activeSection prop from parent (ClientLayout)
  const prevActiveSectionRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (!hasStartedJourney) return;
    
    // Normalize activeSection to lowercase to match milestone IDs
    const normalizedSection = activeSection?.toLowerCase() || '';
    
    if (normalizedSection && normalizedSection !== prevActiveSectionRef.current) {
      prevActiveSectionRef.current = normalizedSection;
      
      // Find matching milestone
      const match = milestones.find(m => 
        m.id.toLowerCase() === normalizedSection || 
        (m.elementId && m.elementId.toLowerCase() === normalizedSection)
      );
      
      if (match) {
        const milestoneKey = match.elementId || match.id;
        
        // If we're entering a new section (different from the last closed one), reset closed state
        if (lastClosedSection && milestoneKey !== lastClosedSection) {
          setManuallyClosedSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastClosedSection);
            return newSet;
          });
          setLastClosedSection(null);
        }
        
        // Check if this section was manually closed (after potentially clearing previous section)
        const wasManuallyClosed = manuallyClosedSections.has(milestoneKey);
        
        // Only show popup if this section wasn't manually closed
        if (!wasManuallyClosed) {
          setActiveMilestoneId(match.id);
          setIsGuruActive(true);
        } else {
          setActiveMilestoneId(null);
          setIsGuruActive(false);
        }
        
        // Get the actual calculated position for this milestone
        const targetPosition = milestonePositions[milestoneKey] || match.position;
        
        // Smoothly move guru to the milestone position
        setGuruPosition(targetPosition);
        
        // Update currentVisibleSection to keep in sync
        setCurrentVisibleSection(match.elementId || match.id);
      }
    }
  }, [activeSection, hasStartedJourney, milestones, milestonePositions, manuallyClosedSections, lastClosedSection]);
  
  // Smoothly interpolate guru position between milestones during scroll
  useEffect(() => {
    if (!hasStartedJourney && showInitialAnimation) return;
    
    const handleScroll = (progress: number) => {
      // Force the journey to start if they scroll down past a certain point
      if (!hasStartedJourney && progress > 0.1) {
        setHasStartedJourney(true);
      }
      
      // Find the two nearest milestones based on scroll progress
      const sortedMilestones = [...milestones].sort((a, b) => {
        const posA = milestonePositions[a.elementId || a.id] || a.position;
        const posB = milestonePositions[b.elementId || b.id] || b.position;
        return posB - posA; // Sort by position (top to bottom)
      });
      
      // Calculate expected position based on scroll progress
      const expectedPosition = 95 - (progress * 90);
      
      // Find the milestone closest to the expected position
      let closestMilestone = sortedMilestones[0];
      let minDistance = Math.abs((milestonePositions[closestMilestone.elementId || closestMilestone.id] || closestMilestone.position) - expectedPosition);
      
      for (const milestone of sortedMilestones) {
        const milestonePos = milestonePositions[milestone.elementId || milestone.id] || milestone.position;
        const distance = Math.abs(milestonePos - expectedPosition);
        if (distance < minDistance) {
          minDistance = distance;
          closestMilestone = milestone;
        }
      }
      
      // Interpolate between the closest milestone and the expected scroll position
      // This creates smooth movement while still aligning with milestones
      const closestPos = milestonePositions[closestMilestone.elementId || closestMilestone.id] || closestMilestone.position;
      const interpolatedPosition = closestPos + (expectedPosition - closestPos) * 0.3; // 30% towards scroll position for smoothness
      
      setGuruPosition(Math.max(5, Math.min(95, interpolatedPosition)));
    };
    
    const unsubscribe = scrollYProgress.on("change", handleScroll);
    handleScroll(scrollYProgress.get());
    
    return () => unsubscribe();
  }, [scrollYProgress, hasStartedJourney, showInitialAnimation, milestones, milestonePositions]);
  
  // Show intro milestone when journey not started
  useEffect(() => {
    if (!hasStartedJourney && !showInitialAnimation) {
      setActiveMilestoneId('intro');
    }
  }, [hasStartedJourney, showInitialAnimation]);
  
  // Fade out initial animation after delay; shorter on small screens so it's less intrusive
  useEffect(() => {
    if (showInitialAnimation) {
      const delay = isSmall ? 2000 : isMobile ? 3000 : 4000;
      const timer = setTimeout(() => {
        setShowInitialAnimation(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [showInitialAnimation, isSmall, isMobile]);
  
  // Start journey function
  const startJourney = () => {
    console.log("Starting journey!");
    setHasStartedJourney(true);
    setActiveMilestoneId('intro'); // Start with intro milestone
    setIsGuruActive(true);
    
    // First milestone should be initially visible
    // Scroll to top to ensure we're at the start
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // After a short delay, scroll down slightly to trigger the scroll events
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({
            top: window.innerHeight * 0.15,
            behavior: 'smooth'
          });
        }
      }, 500);
    }
  };
  
  // Handle milestone click to scroll to section
  const handleMilestoneClick = (milestone: Milestone) => {
    if (!milestone.elementId) return;
    
    const element = document.getElementById(milestone.elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Handle closing a popup
  const handleClosePopup = (e: React.MouseEvent, milestoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Find the milestone to get its section key
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      const sectionKey = milestone.elementId || milestone.id;
      
      // Mark this section as manually closed
      setManuallyClosedSections(prev => new Set(prev).add(sectionKey));
      setLastClosedSection(sectionKey);
    }
    
    // Close both popups
    setActiveMilestoneId(null);
    setIsGuruActive(false);
  };
  
  // Handle closing the guru popup (same behavior)
  const handleCloseGuruPopup = () => {
    // Find the current active milestone
    if (activeMilestoneId) {
      const milestone = milestones.find(m => m.id === activeMilestoneId);
      if (milestone) {
        const sectionKey = milestone.elementId || milestone.id;
        
        // Mark this section as manually closed
        setManuallyClosedSections(prev => new Set(prev).add(sectionKey));
        setLastClosedSection(sectionKey);
      }
    }
    
    // Close both popups
    setActiveMilestoneId(null);
    setIsGuruActive(false);
  };
  
  // Helper to get milestone index
  const getMilestoneIndex = (id: string): number => {
    return milestones.findIndex(m => m.id === id);
  };
  
  return (
    <>
      {/* Initial welcome animation - compact on small screens */}
      <AnimatePresence>
        {showInitialAnimation && !hasStartedJourney && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/90 to-blue-600/90 text-white p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="text-center max-w-md px-4 sm:px-6 w-full"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div 
                className="text-4xl md:text-6xl mb-4 inline-block"
                animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: 1 }}
              >
                <Bot size={isMobile ? 60 : 80} />
              </motion.div>
              <motion.h1 
                className="text-lg sm:text-xl md:text-3xl font-bold mb-2 md:mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Welcome to MrGuru's Digital Universe
              </motion.h1>
              <motion.p
                className="text-xs sm:text-sm md:text-lg mb-3 md:mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                {isSmall ? 'Journey through my skills & projects' : 'Prepare for an immersive journey through my skills, projects and expertise'}
              </motion.p>
              <motion.div
                className="bg-white text-primary font-medium py-2 px-6 rounded-full shadow-lg flex items-center gap-2 mx-auto hover:bg-gray-100 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                onClick={() => {
                  setShowInitialAnimation(false);
                  startJourney();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowInitialAnimation(false);
                    startJourney();
                  }
                }}
              >
                <span>Start Your Journey</span>
                <ChevronDown size={18} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Journey path and milestones */}
      <motion.div 
        ref={containerRef}
        className="fixed left-2 sm:left-4 md:left-6 lg:left-8 top-20 bottom-0 w-12 sm:w-14 md:w-16 lg:w-20 z-40 pointer-events-none flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasStartedJourney || !showInitialAnimation ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <div ref={pathRef} className="relative h-[80%] flex justify-center">
            {/* Glowing main path with improved design */}
            <motion.div 
              className="w-3 md:w-4 bg-gradient-to-b from-blue-400/60 via-primary/80 to-purple-500/60 rounded-full relative overflow-hidden shadow-lg"
              animate={{ 
                boxShadow: [
                  '0 0 12px rgba(59, 130, 246, 0.5), 0 0 24px rgba(59, 130, 246, 0.3)',
                  '0 0 16px rgba(59, 130, 246, 0.7), 0 0 32px rgba(59, 130, 246, 0.4)',
                  '0 0 12px rgba(59, 130, 246, 0.5), 0 0 24px rgba(59, 130, 246, 0.3)'
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Journey progression */}
              <motion.div 
                className="absolute left-0 right-0 bottom-0 bg-primary/80"
                style={{ 
                  height: `${hasStartedJourney ? 100 - guruPosition : 5}%`,
                  opacity: hasStartedJourney ? 1 : 0.3,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            {/* Milestones */}
            {milestones.map((milestone) => {
              const isActive = milestone.id === activeMilestoneId;
              const index = getMilestoneIndex(milestone.id);
              // Use dynamically calculated position if available, otherwise fall back to milestone.position
              const milestoneKey = milestone.elementId || milestone.id;
              const actualPosition = milestonePositions[milestoneKey] || milestone.position;
              
              return (
                <div 
                  key={milestone.id}
                  id={`milestone-${milestone.id}`}
                  className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto"
                  style={{ bottom: `${actualPosition}%` }}
                >
                  <motion.div
                    className={`journey-milestone flex items-center gap-3 cursor-pointer ${
                      isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    data-section={milestone.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMilestoneClick(milestone)}
                    title={`${milestone.label}: ${milestone.description}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMilestoneClick(milestone);
                      }
                    }}
                  >
                    {/* Milestone node with improved design */}
                    <motion.div 
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary via-blue-500 to-purple-600 text-white border-2 border-white shadow-lg' 
                          : 'bg-white dark:bg-gray-800 border-2 border-primary/40 dark:border-primary/30 shadow-md hover:border-primary/60 dark:hover:border-primary/50'
                      }`}
                      animate={isActive ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          '0 0 8px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(59, 130, 246, 0.3)',
                          '0 0 16px rgba(59, 130, 246, 0.8), 0 6px 20px rgba(59, 130, 246, 0.5)',
                          '0 0 8px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(59, 130, 246, 0.3)'
                        ]
                      } : {
                        scale: 1,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                      transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
                      whileHover={!isActive ? { scale: 1.1, borderColor: 'rgba(59, 130, 246, 0.8)' } : {}}
                    >
                      {milestone.icon}
                    </motion.div>
                    
                    {/* Popup with info */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          className={`absolute p-3 rounded-lg shadow-md min-w-[160px] md:min-w-[200px] max-w-[180px] md:max-w-[250px] border border-primary/20 pointer-events-auto
                            ${isActive 
                              ? 'bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-900/95'
                              : 'bg-white/95 dark:bg-gray-800/95'
                            }`}
                          style={{
                            // Smart positioning to prevent overlaps and stay within viewport
                            ...((() => {
                              const milestoneEl = document.getElementById(`milestone-${milestone.id}`);
                              const milestoneRect = milestoneEl?.getBoundingClientRect();
                              
                              if (!milestoneRect) {
                                // Fallback positioning - always visible
                                return isSmall 
                                  ? { left: '50%', transform: 'translateX(-50%)', top: '120%', position: 'absolute' as const }
                                  : { left: '100%', marginLeft: '15px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' as const };
                              }
                              
                              const viewportPadding = 16;
                              const popupHeight = 200; // Increased to accommodate content without scrollbar
                              const popupWidth = isSmall ? 200 : 240;
                              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : width;
                              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height;
                              
                              // Get milestone position in viewport coordinates
                              const milestoneTop = milestoneRect.top;
                              const milestoneBottom = milestoneRect.bottom;
                              const milestoneLeft = milestoneRect.left;
                              const milestoneRight = milestoneRect.right;
                              const milestoneCenterY = milestoneTop + (milestoneRect.height / 2);
                              
                              if (isSmall) {
                                // Mobile: Position above or below based on available viewport space
                                const spaceAbove = milestoneTop;
                                const spaceBelow = viewportHeight - milestoneBottom;
                                const canFitAbove = spaceAbove >= popupHeight + viewportPadding;
                                const canFitBelow = spaceBelow >= popupHeight + viewportPadding;
                                
                                // Choose position with most space, but ensure it's visible
                                let position: 'above' | 'below' = 'below';
                                if (canFitAbove && (!canFitBelow || spaceAbove > spaceBelow)) {
                                  position = 'above';
                                } else if (!canFitBelow && canFitAbove) {
                                  position = 'above';
                                }
                                
                                // Ensure popup doesn't go off-screen horizontally
                                const popupLeft = Math.max(viewportPadding, Math.min(
                                  milestoneLeft - (popupWidth / 2),
                                  viewportWidth - popupWidth - viewportPadding
                                ));
                                
                                return {
                                  position: 'fixed' as const,
                                  left: `${popupLeft}px`,
                                  width: `${Math.min(popupWidth, viewportWidth - (viewportPadding * 2))}px`,
                                  ...(position === 'above' 
                                    ? { bottom: `${viewportHeight - milestoneTop + viewportPadding}px` }
                                    : { top: `${milestoneBottom + viewportPadding}px` }),
                                  transform: 'none',
                                  zIndex: 9999,
                                };
                              } else {
                                // Desktop: Position to the right, left, or above/below based on viewport space
                                const spaceRight = viewportWidth - milestoneRight;
                                const spaceLeft = milestoneLeft;
                                const spaceAbove = milestoneTop;
                                const spaceBelow = viewportHeight - milestoneBottom;
                                
                                // Check if we can fit to the right
                                if (spaceRight >= popupWidth + viewportPadding) {
                                  // Position to the right
                                  const popupTop = Math.max(
                                    viewportPadding,
                                    Math.min(
                                      milestoneCenterY - (popupHeight / 2),
                                      viewportHeight - popupHeight - viewportPadding
                                    )
                                  );
                                  
                                  return {
                                    position: 'fixed' as const,
                                    left: `${milestoneRight + viewportPadding}px`,
                                    top: `${popupTop}px`,
                                    width: `${popupWidth}px`,
                                    maxHeight: `${Math.min(popupHeight + 40, viewportHeight - (viewportPadding * 2))}px`,
                                    transform: 'none',
                                    zIndex: 9999,
                                  };
                                } else if (spaceLeft >= popupWidth + viewportPadding) {
                                  // Position to the left
                                  const popupTop = Math.max(
                                    viewportPadding,
                                    Math.min(
                                      milestoneCenterY - (popupHeight / 2),
                                      viewportHeight - popupHeight - viewportPadding
                                    )
                                  );
                                  
                                  return {
                                    position: 'fixed' as const,
                                    right: `${viewportWidth - milestoneLeft + viewportPadding}px`,
                                    top: `${popupTop}px`,
                                    width: `${popupWidth}px`,
                                    maxHeight: `${Math.min(popupHeight + 40, viewportHeight - (viewportPadding * 2))}px`,
                                    transform: 'none',
                                    zIndex: 9999,
                                  };
                                } else {
                                  // Not enough horizontal space, position above or below
                                  const canFitAbove = spaceAbove >= popupHeight + viewportPadding;
                                  const canFitBelow = spaceBelow >= popupHeight + viewportPadding;
                                  
                                  let position: 'above' | 'below' = 'below';
                                  if (canFitAbove && (!canFitBelow || spaceAbove > spaceBelow)) {
                                    position = 'above';
                                  } else if (!canFitBelow && canFitAbove) {
                                    position = 'above';
                                  }
                                  
                                  // Center horizontally relative to milestone, but keep in viewport
                                  const popupLeft = Math.max(viewportPadding, Math.min(
                                    milestoneLeft - (popupWidth / 2) + (milestoneRect.width / 2),
                                    viewportWidth - popupWidth - viewportPadding
                                  ));
                                  
                                  return {
                                    position: 'fixed' as const,
                                    left: `${popupLeft}px`,
                                    width: `${Math.min(popupWidth, viewportWidth - (viewportPadding * 2))}px`,
                                    ...(position === 'above' 
                                      ? { bottom: `${viewportHeight - milestoneTop + viewportPadding}px` }
                                      : { top: `${milestoneBottom + viewportPadding}px` }),
                                    maxHeight: `${Math.min(popupHeight + 40, viewportHeight - (viewportPadding * 2))}px`,
                                    transform: 'none',
                                    zIndex: 9999,
                                  };
                                }
                              }
                            })()),
                            overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 12px rgba(59, 130, 246, 0.15)',
                            backdropFilter: 'blur(8px)',
                          }}
                          initial={{ 
                            opacity: 0, 
                            scale: 0.95,
                            ...(isSmall 
                              ? { y: actualPosition > 50 ? 10 : -10 } 
                              : { x: -20 })
                          }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            y: 0,
                            x: 0 
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 0.95,
                            ...(isSmall 
                              ? { y: actualPosition > 50 ? 10 : -10 } 
                              : { x: -20 })
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Close button */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleClosePopup(e, milestone.id);
                            }}
                            className="absolute top-1 right-1 z-[10000] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors bg-white/80 dark:bg-gray-800/80 rounded-full p-1 hover:bg-white dark:hover:bg-gray-800"
                            aria-label="Close popup"
                            type="button"
                          >
                            <X size={14} />
                          </button>
                          
                          <h3 className="font-bold text-primary dark:text-primary mb-2 pr-6 text-base">
                            {milestone.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                            {milestone.description}
                          </p>
                          <div 
                            className="text-xs bg-gradient-to-r from-primary/15 to-blue-500/15 text-primary dark:text-blue-400 px-4 py-2 rounded-full inline-block font-semibold border border-primary/20"
                          >
                            {milestone.cta}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
            
            {/* Guru Character */}
            {(hasStartedJourney || !showInitialAnimation) && (
              <GuruCharacter 
                position={guruPosition} 
                isActive={isGuruActive}
                onClosePopup={handleCloseGuruPopup}
              />
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Start journey prompt button - positioned to ensure visibility */}
      {!hasStartedJourney && !showInitialAnimation && (
        <motion.div 
          className="fixed right-4 md:right-24 bottom-28 md:bottom-32 z-[45]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.div
            className="bg-primary text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm cursor-pointer"
            onClick={startJourney}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              y: [0, -10, 0],
              boxShadow: [
                '0 10px 25px rgba(59, 130, 246, 0.3)',
                '0 15px 30px rgba(59, 130, 246, 0.4)',
                '0 10px 25px rgba(59, 130, 246, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startJourney();
              }
            }}
          >
            <Bot size={16} className="flex-shrink-0" />
            <span className="whitespace-nowrap">
              {isTiny ? 'Start Tour' : 'Begin Interactive Tour'}
            </span>
            <ChevronDown size={16} className="flex-shrink-0" />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default JourneyExperienceNew;