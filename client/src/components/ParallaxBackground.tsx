import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParallaxBackgroundProps {
  className?: string;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ className = '' }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
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
  
  // Generate grid of gradient dots for parallax effect
  const dotCount = 5; // Grid size (5x5)
  const dots = [];
  
  for (let i = 0; i < dotCount; i++) {
    for (let j = 0; j < dotCount; j++) {
      // Calculate position as percentage
      const x = (i / (dotCount - 1)) * 100;
      const y = (j / (dotCount - 1)) * 100;
      
      // Calculate parallax offset based on mouse position
      // Invert the movement direction to create proper parallax effect
      const offsetX = (0.5 - mousePosition.x) * 30 * ((i - dotCount / 2) / (dotCount / 2));
      const offsetY = (0.5 - mousePosition.y) * 30 * ((j - dotCount / 2) / (dotCount / 2));
      
      dots.push(
        <motion.div
          key={`${i}-${j}`}
          className="absolute rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 blur-md"
          style={{
            left: `calc(${x}% + ${offsetX}px)`,
            top: `calc(${y}% + ${offsetY}px)`,
            width: '15vmin',
            height: '15vmin',
            transform: 'translate(-50%, -50%)',
            opacity: 0.4 + Math.abs((i - dotCount / 2) * (j - dotCount / 2)) / ((dotCount * dotCount) / 4) * 0.6
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [
              0.4 + Math.abs((i - dotCount / 2) * (j - dotCount / 2)) / ((dotCount * dotCount) / 4) * 0.5,
              0.4 + Math.abs((i - dotCount / 2) * (j - dotCount / 2)) / ((dotCount * dotCount) / 4) * 0.7,
              0.4 + Math.abs((i - dotCount / 2) * (j - dotCount / 2)) / ((dotCount * dotCount) / 4) * 0.5
            ]
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      );
    }
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