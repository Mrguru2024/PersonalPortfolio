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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [cursorColor, setCursorColor] = useState('#3b82f6'); // Default primary color
  const [cursorBorderColor, setCursorBorderColor] = useState('rgba(59, 130, 246, 0.6)');
  
  // Detect touch devices - don't show custom cursor on touch devices
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Hide cursor on touch devices
  if (isTouchDevice) {
    return null;
  }
  
  // Hide help after some time
  useEffect(() => {
    if (showHelp) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 10000); // Hide after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showHelp]);

  // Function to get color at cursor position and determine best contrast color
  const getColorAtPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    try {
      // Get element at cursor position
      const element = document.elementFromPoint(x, y);
      if (!element) return;
      
      // Get computed styles
      const styles = window.getComputedStyle(element);
      const bgColor = styles.backgroundColor;
      
      // Parse RGB values
      const parseRGB = (rgb: string): { r: number; g: number; b: number } | null => {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
          };
        }
        return null;
      };
      
      // Calculate luminance
      const getLuminance = (r: number, g: number, b: number): number => {
        const [rs, gs, bs] = [r, g, b].map(val => {
          val = val / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      // Get background color
      let bgRGB = parseRGB(bgColor);
      
      // If background is transparent, check parent elements
      if (!bgRGB || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          const parentStyles = window.getComputedStyle(parent);
          const parentBg = parentStyles.backgroundColor;
          const parentRGB = parseRGB(parentBg);
          if (parentRGB && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
            bgRGB = parentRGB;
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      
      // Default to white/light background if we can't determine
      if (!bgRGB) {
        bgRGB = { r: 255, g: 255, b: 255 };
      }
      
      // Calculate luminance
      const luminance = getLuminance(bgRGB.r, bgRGB.g, bgRGB.b);
      
      // Determine best cursor color based on background
      if (luminance > 0.5) {
        // Light background - use dark cursor
        setCursorColor('#1e40af'); // Dark blue
        setCursorBorderColor('rgba(30, 64, 175, 0.8)');
      } else {
        // Dark background - use light cursor
        setCursorColor('#60a5fa'); // Light blue
        setCursorBorderColor('rgba(96, 165, 250, 0.9)');
      }
      
      // Special handling for primary colored backgrounds
      const isPrimaryColor = (r: number, g: number, b: number): boolean => {
        // Check if it's close to primary blue colors
        return (b > 200 && r < 100 && g < 150) || 
               (r > 200 && b > 200 && g < 150); // Purple/blue range
      };
      
      if (isPrimaryColor(bgRGB.r, bgRGB.g, bgRGB.b)) {
        // On primary colored background, use white/light cursor
        setCursorColor('#ffffff');
        setCursorBorderColor('rgba(255, 255, 255, 0.9)');
      }
    } catch (error) {
      // Fallback to default colors on error
      console.warn('Error calculating cursor color:', error);
    }
  }, []);

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
      
      // Update cursor color based on background
      getColorAtPosition(e.clientX, e.clientY);
      
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
  }, [handleHover, getColorAtPosition]);

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
        className="hidden md:block fixed top-0 left-0 w-4 h-4 rounded-full z-50 pointer-events-none"
        style={{
          backgroundColor: hoverType === 'milestone' 
            ? cursorColor 
            : hoverType === 'link'
              ? cursorColor
              : cursorColor,
          boxShadow: `0 0 8px ${cursorBorderColor}, 0 0 16px ${cursorBorderColor}40`
        }}
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
          borderColor: cursorBorderColor,
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
          className="hidden md:block fixed z-50 pointer-events-none"
          style={{ color: cursorColor }}
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
        className="hidden md:block fixed top-0 left-0 rounded-full blur-md z-40 pointer-events-none"
        style={{
          backgroundColor: `${cursorColor}20`,
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