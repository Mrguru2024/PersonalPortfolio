import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Lightbulb, Target, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TourStep {
  id: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactElement;
  showAfterScroll?: number; // Show when scrolled past this point
  hideAfterScroll?: number; // Hide when scrolled past this point
  emphasis?: 'low' | 'medium' | 'high';
}

const GuidedTour: React.FC = () => {
  const isMobile = useIsMobile();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [animatePrompt, setAnimatePrompt] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);
  
  // Define your tour steps with engaging messages
  const tourSteps: TourStep[] = [
    {
      id: 'intro',
      title: 'Welcome to My Portfolio',
      content: "I'm Anthony \"MrGuru\" Feaster, a passionate developer creating digital experiences. Let me guide you through my portfolio!",
      position: 'bottom',
      icon: <Sparkles className="text-primary" />,
      emphasis: 'high',
    },
    {
      id: 'projects',
      title: 'My Projects',
      content: "Here you'll find my recent work including Stackzen, Keycode Help, and more. Click any card to see details!",
      position: 'top',
      icon: <Target className="text-primary" />,
      showAfterScroll: 700,
      hideAfterScroll: 1500,
      emphasis: 'medium',
    },
    {
      id: 'skills',
      title: 'My Skills & Expertise',
      content: "Browse through my technical skills from frontend to backend development. Hover over each for more details!",
      position: 'left',
      icon: <Lightbulb className="text-primary" />,
      showAfterScroll: 1500,
      hideAfterScroll: 2300,
      emphasis: 'medium',
    },
    {
      id: 'contact',
      title: "Let's Connect",
      content: "Interested in working together? This section has everything you need to get in touch with me.",
      position: 'top',
      icon: <Sparkles className="text-primary" />,
      showAfterScroll: 2300,
      emphasis: 'high',
    },
  ];
  
  // Handle initial appearance: on desktop only, after a delay; on mobile don't auto-show (user taps "Guide me")
  useEffect(() => {
    if (isMobile) {
      setHasSeenIntro(true);
      return;
    }
    const timer = setTimeout(() => {
      if (!hasSeenIntro) {
        setShowTour(true);
        setHasSeenIntro(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasSeenIntro, isMobile]);
  
  // Handle scroll position to dynamically show guides
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Skip intro step which is handled separately
      if (hasSeenIntro && !showTour && !visited.includes('intro')) {
        const nextUnvisitedStep = tourSteps.slice(1).findIndex(
          step => !visited.includes(step.id) && 
                 scrollPosition >= (step.showAfterScroll || 0) && 
                 (step.hideAfterScroll ? scrollPosition <= step.hideAfterScroll : true)
        );
        
        if (nextUnvisitedStep !== -1) {
          setCurrentStep(nextUnvisitedStep + 1); // +1 because we sliced off the intro
          setShowTour(true);
        }
      }
      
      // Animate the prompt periodically
      if (scrollPosition > 300 && !showTour) {
        setAnimatePrompt(true);
        setTimeout(() => setAnimatePrompt(false), 2000);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasSeenIntro, showTour, visited, tourSteps]);
  
  const handleNextStep = () => {
    const currentId = tourSteps[currentStep].id;
    setVisited(prev => [...prev, currentId]);
    
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowTour(false);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleClose = () => {
    const currentId = tourSteps[currentStep].id;
    setVisited(prev => [...prev, currentId]);
    setShowTour(false);
  };
  
  const restartTour = () => {
    setCurrentStep(0);
    setShowTour(true);
  };

  const currentTourStep = tourSteps[currentStep];
  
  // Position styles based on tour step position
  const getPositionStyles = (position: string) => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-3 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-3 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full mr-3 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-3 top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-full mb-3';
    }
  };
  
  // Get arrow position based on tour step position
  const getArrowPosition = (position: string) => {
    switch (position) {
      case 'top':
        return 'absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary/80';
      case 'bottom':
        return 'absolute -top-2 left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-primary/80';
      case 'left':
        return 'absolute -right-2 top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-primary/80';
      case 'right':
        return 'absolute -left-2 top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-primary/80';
      default:
        return 'absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary/80';
    }
  };
  
  // Get the target element's position on the page; on mobile use higher anchor so popup fits on screen
  const getTargetPosition = (id: string) => {
    if (typeof window === 'undefined') return { top: 200, left: 200 };
    if (id === 'intro') {
      const top = isMobile ? window.innerHeight * 0.35 : window.innerHeight / 2;
      return { top, left: window.innerWidth / 2 };
    }
    const element = document.getElementById(id);
    if (!element) {
      return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
    }
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY + rect.height / 2,
      left: rect.left + window.scrollX + rect.width / 2,
    };
  };
  
  // Calculate background emphasis style based on step importance
  const getEmphasisStyle = (emphasis?: 'low' | 'medium' | 'high') => {
    switch (emphasis) {
      case 'high':
        return 'bg-gradient-to-r from-primary/90 to-blue-600/90 text-white';
      case 'medium':
        return 'bg-gradient-to-r from-primary/80 to-blue-500/80 text-white';
      default:
        return 'bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200';
    }
  };
  
  return (
    <>
      {/* Tour Guide Box */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            className="fixed z-50 w-[min(90vw,28rem)] max-w-md pointer-events-auto mx-auto left-0 right-0 sm:left-auto sm:right-auto sm:mx-0 sm:w-auto"
            style={{
              top: getTargetPosition(currentTourStep.id).top,
              left: isMobile ? undefined : getTargetPosition(currentTourStep.id).left,
              right: isMobile ? undefined : undefined,
              transform: isMobile ? 'translateY(-50%)' : undefined,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`relative ${getPositionStyles(currentTourStep.position)}`}>
              {/* Arrow pointing to element */}
              <div className={getArrowPosition(currentTourStep.position)}></div>
              
              {/* Content box - responsive padding, smaller on mobile; max-height so it doesn't dominate small screens */}
              <div 
                className={`rounded-lg shadow-xl backdrop-blur-md border border-white/20 p-3 sm:p-4 md:p-5 max-h-[70vh] overflow-y-auto ${getEmphasisStyle(currentTourStep.emphasis)}`}
              >
                {/* Close button */}
                <button 
                  onClick={handleClose}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                  aria-label="Close tour"
                  type="button"
                >
                  <X size={18} />
                </button>
                
                {/* Title - responsive font size */}
                <div className="flex items-center gap-2 mb-2">
                  {currentTourStep.icon}
                  <h3 className="font-bold text-base md:text-lg">{currentTourStep.title}</h3>
                </div>
                
                {/* Content - responsive font size */}
                <p className="text-xs md:text-sm mb-3 md:mb-4">{currentTourStep.content}</p>
                
                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {tourSteps.map((_, index) => (
                      <div 
                        key={index}
                        className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-white' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrevStep}
                        className="bg-white/20 hover:bg-white/30 p-1 rounded-full"
                        aria-label="Previous step"
                        type="button"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    <button
                      onClick={handleNextStep}
                      className="bg-white/20 hover:bg-white/30 p-1 rounded-full"
                      aria-label={currentStep === tourSteps.length - 1 ? 'Finish tour' : 'Next step'}
                      type="button"
                    >
                      {currentStep === tourSteps.length - 1 ? 'Done' : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating guide prompt (only shows when tour is not active); on mobile left side to avoid overlapping nav/toggle */}
      {!showTour && (
        <motion.div
          ref={promptRef}
          className="fixed z-40 cursor-pointer touch-target min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"
          style={{
            bottom: 'max(5.5rem, env(safe-area-inset-bottom, 0px))',
            left: isMobile ? 'max(1rem, env(safe-area-inset-left, 0px))' : undefined,
            right: isMobile ? undefined : 'max(1.25rem, env(safe-area-inset-right, 0px))',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: animatePrompt ? [1, 1.1, 1] : 1,
            y: animatePrompt ? [0, -5, 0] : 0
          }}
          transition={{ duration: 0.5 }}
          onClick={restartTour}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Start guided tour"
        >
          <div className="bg-primary text-white p-2.5 md:p-3 rounded-full shadow-lg flex items-center justify-center">
            <Lightbulb size={isMobile ? 18 : 20} />
          </div>
          <motion.div
            className="absolute -top-8 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap font-medium shadow-md hidden sm:block"
            style={{ [isMobile ? 'left' : 'right']: 0 }}
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Guide me
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default GuidedTour;