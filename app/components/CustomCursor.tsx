'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CustomCursorProps {
  currentSection?: string;
}

const CustomCursor = ({ currentSection }: CustomCursorProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [hoverText, setHoverText] = useState('');
  
  // Colors based on section
  const getCursorColors = () => {
    switch(currentSection) {
      case 'projects':
        return { primary: '#818cf8', secondary: '#4f46e5' };
      case 'skills':
        return { primary: '#34d399', secondary: '#059669' };
      case 'blog':
        return { primary: '#f472b6', secondary: '#db2777' };
      case 'contact':
        return { primary: '#fb923c', secondary: '#ea580c' };
      default:
        return { primary: '#a78bfa', secondary: '#7c3aed' };
    }
  };

  const { primary, secondary } = getCursorColors();

  const handleHover = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if target or its parents have data-cursor-text attribute
    let currentElement: HTMLElement | null = target;
    let foundText = '';
    
    while (currentElement && !foundText) {
      foundText = currentElement.getAttribute('data-cursor-text') || '';
      if (!foundText) {
        currentElement = currentElement.parentElement;
      }
    }
    
    if (foundText) {
      setIsHovering(true);
      setHoverText(foundText);
    } else {
      // Check if element is clickable
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.onclick != null ||
        window.getComputedStyle(target).cursor === 'pointer';
      
      if (isClickable) {
        setIsHovering(true);
        setHoverText('');
      } else {
        setIsHovering(false);
        setHoverText('');
      }
    }
  }, []);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
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

  // Only render custom cursor on desktop
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isMobile) {
    return null;
  }

  return (
    <div className="cursor-container">
      {/* Main cursor */}
      <motion.div
        className="cursor-dot pointer-events-none fixed z-[999] rounded-full mix-blend-difference"
        style={{
          backgroundColor: primary,
          width: isClicking ? '12px' : '8px',
          height: isClicking ? '12px' : '8px',
        }}
        animate={{
          x: mousePosition.x - (isClicking ? 6 : 4),
          y: mousePosition.y - (isClicking ? 6 : 4),
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      />

      {/* Cursor ring/outline */}
      <motion.div
        className="cursor-ring pointer-events-none fixed z-[999] flex items-center justify-center rounded-full"
        style={{
          border: `2px solid ${isHovering ? secondary : primary}`,
          width: isHovering ? '60px' : '40px',
          height: isHovering ? '60px' : '40px',
        }}
        animate={{
          x: mousePosition.x - (isHovering ? 30 : 20),
          y: mousePosition.y - (isHovering ? 30 : 20),
          scale: isClicking ? 0.9 : 1,
          opacity: isHovering ? 1 : 0.6,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {hoverText && (
          <motion.span
            className="text-white text-xs font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {hoverText}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};

export default CustomCursor;