import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Code, Briefcase, Send, Bot, Cpu } from 'lucide-react';

// Character represents MrGuru - a tech guru guiding you through the digital space - Responsive
const GuruCharacter: React.FC<{ position: number; isActive: boolean }> = ({ position, isActive }) => {
  // Responsive sizes based on screen width
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
      {/* Character container with glow effect */}
      <div className="relative">
        {/* Glow effect */}
        <motion.div 
          className="absolute -inset-2 bg-primary/20 rounded-full blur-md"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Guru Character - Stylized tech figure */}
        <div className="relative flex flex-col items-center">
          {/* Head - Tech guru with glasses */}
          <div 
            className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white border-2 border-white shadow-lg"
            style={{ width: `${headSize * 4}px`, height: `${headSize * 4}px` }}
          >
            <Bot size={iconSize} />
          </div>
          
          {/* Body - Digital form */}
          <motion.div 
            className="mt-1 bg-blue-400 rounded-t-full"
            style={{ width: `${isMobile ? 16 : 24}px`, height: `${isMobile ? 4 : 8}px` }}
            animate={{ 
              height: isMobile ? [4, 8, 4] : [8, 14, 8],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Sparkle effects around character */}
          <motion.div 
            className="absolute -top-1 -right-1 text-yellow-300"
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles size={sparkleSize1} />
          </motion.div>
          
          <motion.div 
            className="absolute -bottom-2 -left-2 text-blue-300"
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles size={sparkleSize2} />
          </motion.div>
        </div>
      </div>
      
      {/* Message bubble when active - positioned for better visibility on all screens */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-lg text-xs md:text-sm max-w-[150px] md:max-w-[200px] border border-primary/20"
            style={{
              position: 'absolute',
              ...(window.innerWidth < 640
                ? {
                    top: '-120%', // Above the character on small screens
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }
                : {
                    left: '120%', // To the right of the character on desktop
                    top: '0'
                  }),
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 0 10px rgba(59, 130, 246, 0.08)'
            }}
            initial={{ opacity: 0, scale: 0.8, y: window.innerWidth < 640 ? 10 : 0, x: window.innerWidth < 640 ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: window.innerWidth < 640 ? 10 : 0, x: window.innerWidth < 640 ? 0 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-medium text-primary mb-1">MrGuru</div>
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

// Milestones along the journey path
interface Milestone {
  id: string;
  label: string;
  position: number; // percentage down the path (0-100)
  icon: React.ReactNode;
  description: string;
  cta: string;
  elementId?: string; // ID of the element to scroll to
}

const JourneyExperience: React.FC = () => {
  const pathRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [guruPosition, setGuruPosition] = useState<number>(95);
  const [isGuruActive, setIsGuruActive] = useState<boolean>(true);
  const [showInitialAnimation, setShowInitialAnimation] = useState<boolean>(true);
  const [hasStartedJourney, setHasStartedJourney] = useState<boolean>(false);
  
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
  
  // Handle scroll to control guru's position
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((progress) => {
      if (!hasStartedJourney) return;
      
      // Update guru position based on scroll - inversely proportional
      // When scroll progress is 0 (top), guru is at bottom (95%)
      // When scroll progress is 1 (bottom), guru is at top (5%)
      const newPosition = 95 - (progress * 90);
      setGuruPosition(newPosition);
      
      // Find which milestone the guru is closest to
      const closestIndex = milestones.findIndex(milestone => 
        Math.abs(milestone.position - newPosition) < 10
      );
      
      if (closestIndex !== -1 && closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
        setIsGuruActive(true);
      } else if (closestIndex === -1) {
        setActiveIndex(-1);
        setIsGuruActive(false);
      }
    });
    
    return () => unsubscribe();
  }, [scrollYProgress, activeIndex, hasStartedJourney, milestones]);
  
  // Initial animation
  useEffect(() => {
    if (showInitialAnimation) {
      const timer = setTimeout(() => {
        setShowInitialAnimation(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [showInitialAnimation]);
  
  // Start journey function - appears on first load
  const startJourney = () => {
    setHasStartedJourney(true);
    setActiveIndex(0);
    
    // Scroll slightly to begin journey
    window.scrollTo({
      top: window.innerHeight * 0.1,
      behavior: 'smooth'
    });
  };
  
  // Handle milestone click - scroll to that section
  const handleMilestoneClick = (milestone: Milestone) => {
    if (!milestone.elementId) return;
    
    const element = document.getElementById(milestone.elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <>
      {/* Initial welcome animation - only shows on first load */}
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
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.2, 1],
                }}
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
              <motion.button
                className="bg-white text-primary font-medium py-2 px-6 rounded-full shadow-lg flex items-center gap-2 mx-auto hover:bg-gray-100 transition-colors"
                initial={{ opacity: 0, y: 20 }}
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
      
      {/* Main journey container - positioned with enough space for popups */}
      <motion.div 
        ref={containerRef}
        className="fixed left-4 sm:left-16 md:left-24 lg:left-32 inset-y-0 w-14 md:w-20 z-40 pointer-events-none flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasStartedJourney || !showInitialAnimation ? 1 : 0 }}
        transition={{ duration: 0.5 }}
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
                  className={`flex items-center gap-3 ${
                    activeIndex === index 
                      ? 'scale-110' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMilestoneClick(milestone)}
                >
                  {/* Milestone node - larger and more prominent */}
                  <motion.div 
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                      activeIndex === index 
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white border-2 border-white' 
                        : 'bg-white dark:bg-gray-800 border-2 border-primary/30 dark:border-primary/20'
                    }`}
                    animate={activeIndex === index ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 5px rgba(59, 130, 246, 0.4)',
                        '0 0 20px rgba(59, 130, 246, 0.7)',
                        '0 0 5px rgba(59, 130, 246, 0.4)'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: activeIndex === index ? Infinity : 0 }}
                  >
                    {milestone.icon}
                  </motion.div>
                  
                  {/* Label + description + CTA - now positioned on the right side for better visibility */}
                  <AnimatePresence>
                    {(activeIndex === index || milestone.position === 90) && (
                      <motion.div 
                        className={`absolute p-3 rounded-lg shadow-md min-w-[160px] md:min-w-[200px] max-w-[180px] md:max-w-[250px] border border-primary/20 
                        ${
                          activeIndex === index
                            ? 'bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-900/95'
                            : 'bg-white/95 dark:bg-gray-800/95'
                        }`}
                        style={{
                          // Position dynamically based on screen size - for small screens, show above or below
                          ...(window.innerWidth < 640 
                            ? {
                                left: '50%',
                                transform: 'translateX(-50%)',
                                // Top positions for different milestones to prevent overlap
                                ...(milestone.position > 50 
                                  ? { bottom: '120%' } // Show above for milestones in top half
                                  : { top: '120%' })  // Show below for milestones in bottom half
                              } 
                            : {
                                // On larger screens, show in front of the path for better visibility
                                left: '100%', 
                                marginLeft: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                              }),
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
                        <h3 className="font-bold text-primary dark:text-primary mb-1">
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
                </motion.button>
              </div>
            ))}
            
            {/* The Guru Character */}
            {(hasStartedJourney || !showInitialAnimation) && (
              <GuruCharacter 
                position={guruPosition} 
                isActive={isGuruActive} 
              />
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Start journey prompt - only shows if not started and intro animation is finished - Responsive for mobile */}
      {!hasStartedJourney && !showInitialAnimation && (
        <motion.div 
          className="fixed right-4 md:right-24 bottom-20 z-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            className="bg-primary text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm"
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
          >
            <Bot size={16} className="flex-shrink-0" />
            <span className="whitespace-nowrap">
              {window.innerWidth < 480 ? 'Start Tour' : 'Begin Interactive Tour'}
            </span>
            <ChevronDown size={16} className="flex-shrink-0" />
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default JourneyExperience;