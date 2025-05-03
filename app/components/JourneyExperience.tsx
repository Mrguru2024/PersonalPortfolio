"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Briefcase, Code, Send, Cpu } from "lucide-react";

// Define milestone interface
interface Milestone {
  id: string;
  label: string;
  position: number; // Position on the journey path (0-100%)
  icon: React.ReactNode;
  description: string;
  cta: string;
  elementId?: string; // Optional ID for scrolling to element
}

interface JourneyExperienceProps {
  activeSection?: string;
}

export default function JourneyExperience({ activeSection }: JourneyExperienceProps) {
  const pathRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [guruPosition, setGuruPosition] = useState<number>(95);
  const [isGuruActive, setIsGuruActive] = useState<boolean>(true);
  const [showInitialAnimation, setShowInitialAnimation] = useState<boolean>(true);
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(false);
  const [forceClosed, setForceClosed] = useState<boolean>(false);
  const [manuallyClosedMilestones, setManuallyClosedMilestones] = useState<string[]>([]);
  const [headerHeight, setHeaderHeight] = useState<number>(120); // Default header height
  
  // Get header height on mount to position journey
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.offsetHeight + 40); // Add extra padding
      console.log('Header height:', header.offsetHeight);
    }
  }, []);
  
  // Track scroll position to update guru's position
  const { scrollYProgress } = useScroll();
  
  // Milestones along the journey
  const milestones: Milestone[] = [
    {
      id: 'intro',
      label: 'Start Your Journey',
      position: 90,
      icon: <Sparkles className="text-yellow-400" size={20} />,
      description: "Welcome! I'm MrGuru, your guide to my digital portfolio. Ready to see what I can create?",
      cta: "Begin Journey",
    },
    {
      id: 'projects',
      label: 'Browse Projects',
      position: 70,
      icon: <Briefcase className="text-blue-400" size={20} />,
      description: "Check out my showcase of innovative web applications and digital experiences.",
      cta: "View Projects",
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
  
  // Update based on activeSection prop - using a ref to store previous values
  const prevActiveSectionRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (activeSection && hasStartedJourney && activeSection !== prevActiveSectionRef.current) {
      // Update ref to current value
      prevActiveSectionRef.current = activeSection;
      
      // Find the milestone that matches the active section name
      const sectionLowerCase = activeSection.toLowerCase();
      const matchIndex = milestones.findIndex(milestone => 
        milestone.id.toLowerCase() === sectionLowerCase || 
        milestone.label.toLowerCase().includes(sectionLowerCase) ||
        (milestone.elementId && milestone.elementId.toLowerCase() === sectionLowerCase)
      );
      
      // If a matching milestone was found, activate it
      if (matchIndex !== -1) {
        // Update guru position based on milestone position
        setGuruPosition(milestones[matchIndex].position);
        setActiveIndex(matchIndex);
      }
    }
  }, [activeSection, hasStartedJourney, milestones]);
  
  // Handle scroll position
  useEffect(() => {
    if (!hasStartedJourney) return;
    
    const unsubscribe = scrollYProgress.onChange(progress => {
      // This inverted progress (1 - progress) makes sense for our vertical journey path
      // as we start from top (progress near 0) and go down (progress near 1)
      const invertedProgress = 1 - progress;
      // Scale to our journey path (position 5 to 95)
      const scaledPosition = 5 + (invertedProgress * 90);
      
      // Update guru position
      setGuruPosition(scaledPosition);
      
      // Find which milestone is closest to current position
      let closestIndex = -1;
      let minDistance = Number.MAX_VALUE;
      
      milestones.forEach((milestone, index) => {
        const distance = Math.abs(milestone.position - scaledPosition);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      // Only update if we're close enough to a milestone
      if (minDistance < 15 && closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
      }
    });
    
    return () => unsubscribe();
  }, [hasStartedJourney, scrollYProgress, activeIndex, milestones]);
  
  // Handle milestone click
  const handleMilestoneClick = (milestone: Milestone) => {
    // If it has an element ID, scroll to that element
    if (milestone.elementId) {
      const element = document.getElementById(milestone.elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // For intro and destination, toggle between them directly
    if (milestone.id === 'intro') {
      setGuruPosition(95);
      setActiveIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (milestone.id === 'destination') {
      setGuruPosition(5);
      setActiveIndex(milestones.length - 1);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };
  
  // Close a milestone popup manually
  const handleClosePopup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setManuallyClosedMilestones(prev => [...prev, id]);
  };
  
  // Determine if a milestone popup should show
  const shouldShowPopup = (milestone: Milestone, index: number) => {
    if (manuallyClosedMilestones.includes(milestone.id)) return false;
    if (forceClosed) return false;
    return index === activeIndex;
  };
  
  return (
    <>
      {/* Introductory animation */}
      <AnimatePresence>
        {showInitialAnimation && !hasStartedJourney && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              className="text-center p-10 rounded-xl bg-primary/10 border border-primary/20 max-w-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.h2 
                className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Welcome to My Portfolio
              </motion.h2>
              
              <motion.p
                className="mb-8 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                I'm Anthony "MrGuru" Feaster, a full-stack developer passionate about creating 
                innovative digital experiences. Let me guide you through my portfolio journey!
              </motion.p>
              
              <motion.button
                className="px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90 font-medium flex items-center justify-center gap-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                onClick={() => {
                  setShowInitialAnimation(false);
                  setHasStartedJourney(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Start Your Journey</span>
                <ChevronDown size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main journey container - positioned with enough space for popups and to avoid header */}
      <motion.div 
        ref={containerRef}
        className="fixed left-4 sm:left-16 md:left-24 lg:left-32 top-48 bottom-0 w-14 md:w-20 z-20 pointer-events-none flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasStartedJourney || !showInitialAnimation ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginTop: "80px" }}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          {/* The 3D journey path */}
          <div ref={pathRef} className="relative h-[80%] flex justify-center">
            {/* Glowing main path - wider and more prominent */}
            <motion.div 
              className="w-3 md:w-4 bg-gradient-to-b from-blue-400/60 via-primary/80 to-purple-500/60 rounded-full relative overflow-hidden"
              animate={{
                boxShadow: ['0 0 10px rgba(59, 130, 246, 0.4)', '0 0 20px rgba(59, 130, 246, 0.6)', '0 0 10px rgba(59, 130, 246, 0.4)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Journey progression effect */}
              <motion.div 
                className="absolute left-0 right-0 bottom-0 bg-primary/80"
                style={{ 
                  height: `${hasStartedJourney ? 100 - guruPosition : 5}%`,
                  opacity: hasStartedJourney ? 1 : 0.3,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            {/* Milestones along the path */}
            {milestones.map((milestone, index) => (
              <div 
                key={milestone.id}
                className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto"
                style={{ bottom: `${milestone.position}%` }}
              >
                <motion.button
                  className={`journey-milestone flex items-center gap-3 ${
                    activeIndex === index 
                      ? 'scale-110' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  data-section={milestone.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMilestoneClick(milestone)}
                  title={`${milestone.label}: ${milestone.description}`}
                >
                  {/* Milestone indicator */}
                  <div className={`flex items-center justify-center h-9 w-9 rounded-full
                    ${ 
                      activeIndex === index
                        ? 'bg-primary text-white'
                        : 'bg-card border border-muted-foreground/20'
                    }`}
                  >
                    {milestone.icon}
                  </div>
                  
                  {/* Popup for active milestone */}
                  <AnimatePresence>
                    {shouldShowPopup(milestone, index) && (
                      <motion.div 
                        className="absolute left-full ml-6 w-60 bg-card rounded-lg shadow-lg border border-border p-3 text-left"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        style={{ zIndex: 50 }}
                      >
                        <button 
                          onClick={(e) => handleClosePopup(e, milestone.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        >
                          <span className="sr-only">Close</span>
                          &times;
                        </button>
                        
                        <h4 className="font-medium text-foreground text-sm">{milestone.label}</h4>
                        <p className="text-muted-foreground text-xs mt-1 mb-2">{milestone.description}</p>
                        
                        {milestone.elementId && (
                          <motion.div
                            className="text-xs font-medium text-primary hover:text-primary/90 flex items-center gap-1 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const element = document.getElementById(milestone.elementId!);
                              if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            {milestone.cta} →
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            ))}
            
            {/* MrGuru Character Indicator */}
            {hasStartedJourney && (
              <motion.div
                className="absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto"
                style={{ bottom: `${guruPosition}%` }}
                animate={{ 
                  scale: isGuruActive ? [1, 1.05, 1] : 1,
                  y: isGuruActive ? [0, -2, 0] : 0,
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: 'reverse',
                }}
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
                  <span className="text-lg font-bold leading-none">MG</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}