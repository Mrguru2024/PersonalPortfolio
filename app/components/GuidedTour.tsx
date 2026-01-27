import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Lightbulb, Target, Sparkles } from 'lucide-react';

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
  
  // Handle initial appearance after a slight delay
  useEffect(() => {
    // Only show intro after 1.5 seconds
    const timer = setTimeout(() => {
      if (!hasSeenIntro) {
        setShowTour(true);
        setHasSeenIntro(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [hasSeenIntro]);
  
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
  
  // Get the target element's position on the page
  const getTargetPosition = (id: string) => {
    if (id === 'intro') {
      return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
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
            className="fixed z-50 max-w-md pointer-events-auto"
            style={{
              top: getTargetPosition(currentTourStep.id).top,
              left: getTargetPosition(currentTourStep.id).left,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`relative ${getPositionStyles(currentTourStep.position)}`}>
              {/* Arrow pointing to element */}
              <div className={getArrowPosition(currentTourStep.position)}></div>
              
              {/* Content box - responsive padding */}
              <div 
                className={`rounded-lg shadow-xl backdrop-blur-md border border-white/20 p-3 md:p-5 ${getEmphasisStyle(currentTourStep.emphasis)}`}
              >
                {/* Close button */}
                <button 
                  onClick={handleClose}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
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
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={handleNextStep}
                      className="bg-white/20 hover:bg-white/30 p-1 rounded-full"
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
      
      {/* Floating guide prompt (only shows when tour is not active) */}
      {!showTour && (
        <motion.div
          ref={promptRef}
          className="fixed bottom-20 right-5 z-40 cursor-pointer"
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
        >
          <div className="bg-primary text-white p-3 rounded-full shadow-lg flex items-center justify-center">
            <Lightbulb size={20} />
          </div>
          <motion.div
            className="absolute -top-8 right-0 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap font-medium shadow-md"
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