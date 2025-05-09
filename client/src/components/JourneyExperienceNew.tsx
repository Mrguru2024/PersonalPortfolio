import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Code, Briefcase, Send, Bot, Cpu, X } from 'lucide-react';

// Guru Character component - follows user through journey
const GuruCharacter: React.FC<{ 
  position: number; 
  isActive: boolean;
  onClosePopup: () => void;
}> = ({ position, isActive, onClosePopup }) => {
  const isMobile = window.innerWidth < 768;
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
      
      {/* Dialog bubble */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="absolute p-3 rounded-lg bg-white/95 dark:bg-gray-800/95 w-44 md:w-48 z-10 text-xs md:text-sm border border-primary/20 pointer-events-auto cursor-pointer"
            style={{
              ...(window.innerWidth < 640
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
            initial={{ opacity: 0, scale: 0.8, y: window.innerWidth < 640 ? 10 : 0, x: window.innerWidth < 640 ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: window.innerWidth < 640 ? 10 : 0, x: window.innerWidth < 640 ? 0 : 20 }}
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
                ...(window.innerWidth < 640
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
  
  // Track scroll position
  const { scrollYProgress } = useScroll();
  
  // Milestones definition - adding more milestones for better coverage and detection
  const milestones: Milestone[] = [
    {
      id: 'intro',
      label: 'Start Your Journey',
      position: 80, // Lowered from 95 to 80 to avoid header
      icon: <Sparkles className="text-yellow-400" size={20} />,
      description: "Welcome! I'm MrGuru, your guide to my digital portfolio. Ready to see what I can create?",
      cta: "Begin Journey",
    },
    {
      id: 'about',
      label: 'About Me',
      position: 70,
      icon: <Sparkles className="text-blue-400" size={20} />,
      description: "Learn about my background, expertise, and the value I can bring to your project.",
      cta: "Explore About",
      elementId: "about",
    },
    {
      id: 'projects',
      label: 'Browse Projects',
      position: 60,
      icon: <Briefcase className="text-blue-400" size={20} />,
      description: "Check out my showcase of innovative web applications and digital experiences.",
      cta: "View Projects",
      elementId: "projects",
    },
    {
      id: 'moreProjects',
      label: 'Project Gallery',
      position: 55,
      icon: <Briefcase className="text-green-400" size={20} />,
      description: "Explore more of my projects and see the range of my development abilities.",
      cta: "View Gallery",
      elementId: "projects",
    },
    {
      id: 'skills',
      label: 'Discover Skills',
      position: 50,
      icon: <Code className="text-green-400" size={20} />,
      description: "Explore my technical skills and expertise across frontend, backend, and more.",
      cta: "See Skills",
      elementId: "skills",
    },
    {
      id: 'moreSkills',
      label: 'Technical Expertise',
      position: 40,
      icon: <Code className="text-purple-400" size={20} />,
      description: "See how my skills translate into real-world solutions for businesses.",
      cta: "Learn More",
      elementId: "skills",
    },
    {
      id: 'testimonials',
      label: 'Testimonials',
      position: 30,
      icon: <Sparkles className="text-yellow-400" size={20} />,
      description: "See what clients and colleagues say about working with me.",
      cta: "Read Reviews",
      elementId: "testimonials",
    },
    {
      id: 'contact',
      label: 'Let\'s Connect',
      position: 20,
      icon: <Send className="text-purple-400" size={20} />,
      description: "Ready to work together? Let's discuss how I can help bring your ideas to life.",
      cta: "Connect Now",
      elementId: "contact",
    },
    {
      id: 'destination',
      label: 'Innovation Awaits',
      position: 5,
      icon: <Cpu className="text-primary" size={20} />,
      description: "You've reached the end of our journey. Ready to start our collaboration?",
      cta: "Let's Create",
      elementId: "contact",
    },
  ];
  
  // Track which milestone we're closest to during scroll
  const prevMilestoneIdRef = useRef<string | null>(null);
  
  // Handle scroll to update guru position and active milestone
  useEffect(() => {
    const handleScroll = (progress: number) => {
      // Only return if we haven't started journey AND we're still showing animation
      // This way, we can still track scrolling even if "Start Journey" hasn't been clicked
      if (!hasStartedJourney && showInitialAnimation) return;
      
      // Update guru position (inversely proportional to scroll)
      const newPosition = 95 - (progress * 90);
      setGuruPosition(newPosition);
      
      // Force the journey to start if they scroll down past a certain point
      if (!hasStartedJourney && progress > 0.1) {
        setHasStartedJourney(true);
      }
      
      // Map scroll progress directly to page sections
      // This improves the relationship between page scroll and journey position
      const pageProgress = progress * 100;
      
      // Identify which section of the page we're in based on page scroll
      // These thresholds should roughly correspond to where sections appear on the page
      let sectionId: string;
      
      if (pageProgress < 10) {
        sectionId = 'intro';
      } else if (pageProgress < 25) {
        sectionId = 'about';
      } else if (pageProgress < 40) {
        sectionId = 'projects';
      } else if (pageProgress < 55) {
        sectionId = 'moreProjects';
      } else if (pageProgress < 70) {
        sectionId = 'skills';
      } else if (pageProgress < 80) {
        sectionId = 'moreSkills';
      } else if (pageProgress < 90) {
        sectionId = 'contact';
      } else {
        sectionId = 'destination';
      }
      
      // Find the milestone that corresponds to the current section
      const currentMilestone = milestones.find(m => m.id === sectionId);
      
      // Update active milestone if found and changed
      if (currentMilestone && currentMilestone.id !== prevMilestoneIdRef.current) {
        console.log("Page progress:", pageProgress, "Section:", sectionId, "Milestone:", currentMilestone.id);
        prevMilestoneIdRef.current = currentMilestone.id;
        setActiveMilestoneId(currentMilestone.id);
        setIsGuruActive(true);
        
        // Smoothly move guru to the milestone position
        setGuruPosition(currentMilestone.position);
      }
    };
    
    // Debug info
    console.log("Current scroll progress tracking status:", 
                "hasStartedJourney:", hasStartedJourney, 
                "showInitialAnimation:", showInitialAnimation,
                "activePopupId:", activeMilestoneId);
    
    const unsubscribe = scrollYProgress.on("change", handleScroll);
    
    // Initial call to handle scroll on mount
    handleScroll(scrollYProgress.get());
    
    return () => unsubscribe();
  }, [scrollYProgress, hasStartedJourney, showInitialAnimation, milestones, activeMilestoneId]);
  
  // Show intro milestone when journey not started
  useEffect(() => {
    if (!hasStartedJourney && !showInitialAnimation) {
      setActiveMilestoneId('intro');
    }
  }, [hasStartedJourney, showInitialAnimation]);
  
  // Fade out initial animation after delay
  useEffect(() => {
    if (showInitialAnimation) {
      const timer = setTimeout(() => {
        setShowInitialAnimation(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showInitialAnimation]);
  
  // Start journey function
  const startJourney = () => {
    console.log("Starting journey!");
    setHasStartedJourney(true);
    setActiveMilestoneId('intro'); // Start with intro milestone
    setIsGuruActive(true);
    
    // First milestone should be initially visible
    // Scroll to top to ensure we're at the start
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // After a short delay, scroll down slightly to trigger the scroll events
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.15,
        behavior: 'smooth'
      });
    }, 500);
  };
  
  // Update based on activeSection
  const prevActiveSectionRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (activeSection && hasStartedJourney && activeSection !== prevActiveSectionRef.current) {
      prevActiveSectionRef.current = activeSection;
      
      // Find matching milestone
      const sectionLower = activeSection.toLowerCase();
      const match = milestones.find(m => 
        m.id.toLowerCase() === sectionLower || 
        (m.elementId && m.elementId.toLowerCase() === sectionLower)
      );
      
      if (match) {
        setActiveMilestoneId(match.id);
        setIsGuruActive(true);
        setGuruPosition(match.position);
      }
    }
  }, [activeSection, hasStartedJourney, milestones]);
  
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
    setActiveMilestoneId(null);
    setIsGuruActive(false);
  };
  
  // Helper to get milestone index
  const getMilestoneIndex = (id: string): number => {
    return milestones.findIndex(m => m.id === id);
  };
  
  return (
    <>
      {/* Initial welcome animation */}
      <AnimatePresence>
        {showInitialAnimation && !hasStartedJourney && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/90 to-blue-600/90 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="text-center max-w-md px-6"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div 
                className="text-4xl md:text-6xl mb-4 inline-block"
                animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: 1 }}
              >
                <Bot size={window.innerWidth < 768 ? 60 : 80} />
              </motion.div>
              <motion.h1 
                className="text-xl md:text-3xl font-bold mb-2 md:mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Welcome to MrGuru's Digital Universe
              </motion.h1>
              <motion.p
                className="text-sm md:text-lg mb-4 md:mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                Prepare for an immersive journey through my skills, projects and expertise
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
        className="fixed left-4 sm:left-16 md:left-24 lg:left-32 top-20 bottom-0 w-14 md:w-20 z-40 pointer-events-none flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasStartedJourney || !showInitialAnimation ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <div ref={pathRef} className="relative h-[80%] flex justify-center">
            {/* Glowing main path */}
            <motion.div 
              className="w-3 md:w-4 bg-gradient-to-b from-blue-400/60 via-primary/80 to-purple-500/60 rounded-full relative overflow-hidden"
              animate={{ 
                boxShadow: ['0 0 10px rgba(59, 130, 246, 0.4)', '0 0 20px rgba(59, 130, 246, 0.6)', '0 0 10px rgba(59, 130, 246, 0.4)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
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
              
              return (
                <div 
                  key={milestone.id}
                  id={`milestone-${milestone.id}`}
                  className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto"
                  style={{ bottom: `${milestone.position}%` }}
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
                    {/* Milestone node */}
                    <motion.div 
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary to-blue-600 text-white border-2 border-white' 
                          : 'bg-white dark:bg-gray-800 border-2 border-primary/30 dark:border-primary/20'
                      }`}
                      animate={isActive ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          '0 0 5px rgba(59, 130, 246, 0.4)',
                          '0 0 20px rgba(59, 130, 246, 0.7)',
                          '0 0 5px rgba(59, 130, 246, 0.4)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
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
                            // Position based on screen size and milestone position with smart positioning
                            ...((() => {
                              // Get milestone element's position
                              const milestoneEl = document.getElementById(`milestone-${milestone.id}`);
                              const milestoneRect = milestoneEl?.getBoundingClientRect();
                              
                              // Get viewport dimensions
                              const viewportHeight = window.innerHeight;
                              const viewportWidth = window.innerWidth;
                              const viewportPadding = 20;
                              
                              // Estimate popup dimensions
                              const popupHeight = 150; // reasonable estimate
                              const popupWidth = viewportWidth < 640 ? 180 : 250;
                              
                              // Default positions based on screen size
                              const mobileStyle = {
                                left: '50%',
                                transform: 'translateX(-50%)',
                              };
                              
                              const desktopStyle = {
                                left: '100%',
                                marginLeft: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                              };
                              
                              // Smart positioning to avoid viewport edges
                              if (milestoneRect) {
                                // Calculate potential positions
                                const posTop = milestoneRect.top;
                                const posBottom = viewportHeight - milestoneRect.bottom;
                                const posLeft = milestoneRect.left;
                                const posRight = viewportWidth - milestoneRect.right;
                                
                                if (viewportWidth < 640) {
                                  // Mobile positioning
                                  // Check if there's more space above or below
                                  if (posTop > posBottom && posTop > popupHeight + viewportPadding) {
                                    // More space above and enough to fit
                                    return {
                                      ...mobileStyle,
                                      bottom: '120%'
                                    };
                                  } else if (posBottom > popupHeight + viewportPadding) {
                                    // More space below and enough to fit
                                    return {
                                      ...mobileStyle,
                                      top: '120%'
                                    };
                                  } else {
                                    // Default mobile position with adjusted transform
                                    return {
                                      ...mobileStyle,
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      margin: '0 auto'
                                    };
                                  }
                                } else {
                                  // Desktop positioning
                                  // Prioritize right side positioning if there's enough space
                                  if (posRight > popupWidth + viewportPadding) {
                                    // Enough space to the right
                                    // Position vertically to avoid going off-screen
                                    const verticalCenter = milestoneRect.top + (milestoneRect.height / 2);
                                    const topSpace = verticalCenter;
                                    const bottomSpace = viewportHeight - verticalCenter;
                                    const halfPopupHeight = popupHeight / 2;
                                    
                                    let verticalPosition = {};
                                    
                                    if (topSpace < halfPopupHeight + viewportPadding) {
                                      // Too close to top
                                      verticalPosition = { top: viewportPadding };
                                    } else if (bottomSpace < halfPopupHeight + viewportPadding) {
                                      // Too close to bottom
                                      verticalPosition = { bottom: viewportPadding };
                                    } else {
                                      // Center vertically
                                      verticalPosition = {
                                        top: '50%',
                                        transform: 'translateY(-50%)'
                                      };
                                    }
                                    
                                    return {
                                      left: '100%',
                                      marginLeft: '15px',
                                      ...verticalPosition
                                    };
                                  } else {
                                    // Not enough space to the right, try above/below
                                    if (posTop > posBottom && posTop > popupHeight + viewportPadding) {
                                      // Position above
                                      return {
                                        bottom: '120%',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                      };
                                    } else {
                                      // Position below
                                      return {
                                        top: '120%',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                      };
                                    }
                                  }
                                }
                              }
                              
                              // Fallback to defaults if we can't calculate positions
                              return viewportWidth < 640 ? 
                                {
                                  ...mobileStyle,
                                  ...(milestone.position === 80
                                    ? { top: '120%' } // Below for intro
                                    : milestone.position > 50 
                                      ? { bottom: '120%' } // Above for top half
                                      : { top: '120%' })  // Below for bottom half
                                } : 
                                {
                                  ...desktopStyle,
                                  ...(milestone.position === 80
                                    ? { 
                                        top: '80%', // Lower for intro
                                        transform: 'translateY(-80%)' 
                                      } : {})
                                };
                            })()),
                            // Add max-height to ensure scrollable if too large
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 10px rgba(59, 130, 246, 0.1)'
                          }}
                          initial={{ 
                            opacity: 0, 
                            scale: 0.95,
                            ...(window.innerWidth < 640 
                              ? { y: milestone.position > 50 ? 10 : -10 } 
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
                            ...(window.innerWidth < 640 
                              ? { y: milestone.position > 50 ? 10 : -10 } 
                              : { x: -20 })
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Close button */}
                          <button 
                            onClick={(e) => handleClosePopup(e, milestone.id)}
                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            aria-label="Close popup"
                          >
                            <X size={14} />
                          </button>
                          
                          <h3 className="font-bold text-primary dark:text-primary mb-1 pr-4">
                            {milestone.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {milestone.description}
                          </p>
                          <div 
                            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full inline-block font-medium"
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
                onClosePopup={() => {
                  setIsGuruActive(false);
                  setActiveMilestoneId(null);
                }}
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
              {window.innerWidth < 480 ? 'Start Tour' : 'Begin Interactive Tour'}
            </span>
            <ChevronDown size={16} className="flex-shrink-0" />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default JourneyExperienceNew;