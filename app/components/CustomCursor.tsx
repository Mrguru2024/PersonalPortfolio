'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor({ currentSection }: { currentSection: string }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  
  // Set cursor sizes based on section
  const getSizes = () => {
    switch (currentSection) {
      case 'hero':
        return { inner: 8, outer: 32 };
      case 'projects':
        return { inner: 10, outer: 36 };
      case 'skills':
        return { inner: 12, outer: 40 };
      default:
        return { inner: 8, outer: 32 };
    }
  };
  
  const sizes = getSizes();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handlePointerDetection = () => {
      const target = document.elementFromPoint(mousePosition.x, mousePosition.y);
      
      if (target) {
        const computedStyle = window.getComputedStyle(target);
        setIsPointer(computedStyle.cursor === 'pointer');
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Use a throttled version for performance
    const interval = setInterval(handlePointerDetection, 100);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [mousePosition.x, mousePosition.y]);
  
  return (
    <>
      {/* Inner cursor */}
      <motion.div 
        className="custom-cursor"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        animate={{
          width: isPointer ? sizes.inner * 1.5 : sizes.inner,
          height: isPointer ? sizes.inner * 1.5 : sizes.inner,
        }}
        transition={{ duration: 0.15 }}
      >
        <div 
          className="custom-cursor-inner"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </motion.div>
      
      {/* Outer cursor */}
      <motion.div 
        className="custom-cursor"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        animate={{
          width: isPointer ? sizes.outer * 1.2 : sizes.outer,
          height: isPointer ? sizes.outer * 1.2 : sizes.outer,
          opacity: isPointer ? 0.8 : 0.5,
        }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="custom-cursor-outer"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </motion.div>
    </>
  );
}