import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Mouse, MousePointerClick } from 'lucide-react';

interface CustomCursorProps {
  currentSection?: string;
}

const CustomCursor = ({ currentSection }: CustomCursorProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isHoveringJourney, setIsHoveringJourney] = useState(false);
  const [hoverType, setHoverType] = useState<'link' | 'journey' | 'milestone' | null>(null);
  const [tooltipText, setTooltipText] = useState('');
  const [showHelp, setShowHelp] = useState(true);

  // Hide help after some time
  useEffect(() => {
    if (showHelp) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 10000); // Hide after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showHelp]);

  const handleHover = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check for journey elements
    if (target.closest('.journey-milestone')) {
      setIsHoveringJourney(true);
      setHoverType('milestone');
      // Get the section name from data attribute if it exists
      const milestone = target.closest('.journey-milestone');
      if (milestone) {
        const section = milestone.getAttribute('data-section');
        setTooltipText(section || 'Navigate here');
      }
    } 
    // Check for other links and buttons
    else if (target.closest('a') || target.closest('button') || target.closest('.hover-target')) {
      setIsHoveringLink(true);
      setHoverType('link');
      
      // If it has a title or aria-label, show it as tooltip
      const element = target.closest('a') || target.closest('button') || target.closest('.hover-target');
      const text = element?.getAttribute('title') || element?.getAttribute('aria-label') || '';
      setTooltipText(text || 'Click');
    } else {
      setIsHoveringLink(false);
      setIsHoveringJourney(false);
      setHoverType(null);
      setTooltipText('');
    }
  }, []);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
      
      // Check for hover elements
      handleHover(e);
    };

    const mouseDown = () => setIsClicking(true);
    const mouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
    };
  }, [handleHover]);

  // Only show on desktop devices
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      {/* Help pointer indicator - only shows first time */}
      {showHelp && (
        <motion.div
          className="fixed bottom-20 right-20 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Mouse className="text-primary" size={24} />
          <div>
            <h4 className="font-medium">Interactive Cursor</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hover over the journey path or clickable items for enhanced interaction
            </p>
          </div>
        </motion.div>
      )}

      {/* Main cursor dot */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-4 h-4 rounded-full bg-primary z-50 pointer-events-none"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isClicking ? 0.6 : 1
        }}
        transition={{
          type: "spring",
          mass: 0.2,
          stiffness: 800,
          damping: 20
        }}
      />

      {/* Outer ring - changes style based on what's being hovered */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 rounded-full border-2 z-50 pointer-events-none"
        style={{
          borderColor: hoverType === 'milestone' 
            ? 'rgba(59, 130, 246, 0.8)' 
            : hoverType === 'link' 
              ? 'rgba(255, 255, 255, 0.7)' 
              : 'rgba(59, 130, 246, 0.6)',
          width: hoverType === 'milestone' ? '36px' : '24px',
          height: hoverType === 'milestone' ? '36px' : '24px',
        }}
        animate={{
          x: mousePosition.x - (hoverType === 'milestone' ? 18 : 12),
          y: mousePosition.y - (hoverType === 'milestone' ? 18 : 12),
          scale: isHoveringJourney 
            ? 1.5 
            : isHoveringLink 
              ? 1.8 
              : isClicking 
                ? 0.8 
                : 1,
          opacity: (isHoveringLink || isHoveringJourney) ? 0.9 : 1,
        }}
        transition={{
          type: "spring",
          mass: 0.4,
          stiffness: 400,
          damping: 30,
          opacity: { duration: 0.2 }
        }}
      />

      {/* Tooltip text when hovering over interactive elements */}
      {tooltipText && (hoverType === 'milestone' || hoverType === 'link') && (
        <motion.div
          className="hidden md:block fixed bg-black/80 text-white text-xs px-2 py-1 rounded z-50 pointer-events-none whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1,
            x: mousePosition.x + 16,
            y: mousePosition.y + 16
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {tooltipText}
        </motion.div>
      )}

      {/* Cursor icon for journey milestones */}
      {hoverType === 'milestone' && (
        <motion.div
          className="hidden md:block fixed z-50 pointer-events-none text-primary"
          animate={{
            x: mousePosition.x - 12,
            y: mousePosition.y - 12,
            scale: isClicking ? 0.8 : 1,
          }}
          transition={{
            type: "spring",
            mass: 0.2,
            stiffness: 800,
            damping: 20
          }}
        >
          <MousePointerClick size={24} />
        </motion.div>
      )}

      {/* Current section indicator */}
      {currentSection && (
        <motion.div
          className="hidden md:block fixed bottom-6 right-6 bg-primary/90 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-40 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Bot size={14} />
            <span>Currently at: {currentSection}</span>
          </div>
        </motion.div>
      )}

      {/* Subtle glow effect */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 rounded-full bg-primary/10 blur-md z-40 pointer-events-none"
        style={{
          width: hoverType === 'milestone' ? '60px' : '40px',
          height: hoverType === 'milestone' ? '60px' : '40px',
        }}
        animate={{
          x: mousePosition.x - (hoverType === 'milestone' ? 30 : 20),
          y: mousePosition.y - (hoverType === 'milestone' ? 30 : 20),
          scale: isHoveringJourney 
            ? 1.5 
            : isHoveringLink 
              ? 1.2 
              : isClicking 
                ? 0.5 
                : 0.8,
          opacity: isHoveringJourney 
            ? 0.7 
            : isHoveringLink 
              ? 0.5 
              : isClicking 
                ? 0.8 
                : 0.3
        }}
        transition={{
          type: "spring",
          mass: 0.6,
          stiffness: 200,
          damping: 40
        }}
      />
    </>
  );
};

export default CustomCursor;