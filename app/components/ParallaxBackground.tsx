import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParallaxBackgroundProps {
  className?: string;
  reducedMotion?: boolean;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ className = '', reducedMotion = false }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Handle mouse movement to update parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as percentage of window size
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      setMousePosition({ x, y });
    };
    
    // Handle window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Large-scale, smooth ambient orbs (fewer, bigger, softer)
  const dotCount = 4; // 4x4 grid – large-scale professional look
  const dots = [];
  
  for (let i = 0; i < dotCount; i++) {
    for (let j = 0; j < dotCount; j++) {
      const x = (i / Math.max(dotCount - 1, 1)) * 100;
      const y = (j / Math.max(dotCount - 1, 1)) * 100;
      const center = dotCount / 2;
      const offsetX = (0.5 - mousePosition.x) * 12 * ((i - center) / center);
      const offsetY = (0.5 - mousePosition.y) * 12 * ((j - center) / center);
      const baseOpacity = 0.2 + (Math.abs(i - center) + Math.abs(j - center)) / (dotCount * 2) * 0.25;
      
      dots.push(
        <motion.div
          key={`${i}-${j}`}
          className="absolute rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 blur-3xl"
          style={{
            left: `calc(${x}% + ${offsetX}px)`,
            top: `calc(${y}% + ${offsetY}px)`,
            width: '28vmin',
            height: '28vmin',
            transform: 'translate(-50%, -50%)',
            opacity: baseOpacity
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [baseOpacity, baseOpacity * 1.2, baseOpacity]
          }}
          transition={{
            duration: 6 + (i + j) * 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      );
    }
  }
  
  if (!mounted) {
    return null;
  }

  if (reducedMotion) {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.04] to-primary/[0.08] dark:via-primary/[0.08] dark:to-primary/[0.12]" />
      </div>
    );
  }
  
  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ perspective: '1000px' }}
    >
      {dots}
    </div>
  );
};

export default ParallaxBackground;