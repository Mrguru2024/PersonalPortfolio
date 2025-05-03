import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ParallaxBackgroundProps {
  className?: string;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ className = "" }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (parallaxRef.current) {
        const rect = parallaxRef.current.getBoundingClientRect();
        
        // Calculate mouse position relative to the center of the container
        const x = ((e.clientX - rect.left) / rect.width) - 0.5;
        const y = ((e.clientY - rect.top) / rect.height) - 0.5;
        
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const elements = [
    {
      className: "absolute -top-10 -left-10 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl",
      animate: { x: mousePosition.x * -20, y: mousePosition.y * -20 }
    },
    {
      className: "absolute top-40 -right-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl",
      animate: { x: mousePosition.x * -30, y: mousePosition.y * -30 }
    },
    {
      className: "absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl",
      animate: { x: mousePosition.x * -15, y: mousePosition.y * -15 }
    },
    {
      className: "absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-pink-500/5 blur-3xl",
      animate: { x: mousePosition.x * -25, y: mousePosition.y * -25 }
    },
    // Small particles
    {
      className: "absolute top-1/3 left-1/3 w-6 h-6 rounded-full bg-primary/10",
      animate: { x: mousePosition.x * -45, y: mousePosition.y * -45 }
    },
    {
      className: "absolute top-2/3 right-1/4 w-4 h-4 rounded-full bg-secondary/20",
      animate: { x: mousePosition.x * -55, y: mousePosition.y * -55 }
    },
    {
      className: "absolute bottom-1/4 left-1/5 w-8 h-8 rounded-full bg-blue-400/10",
      animate: { x: mousePosition.x * -35, y: mousePosition.y * -35 }
    }
  ];

  return (
    <div ref={parallaxRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {elements.map((element, index) => (
        <motion.div
          key={index}
          className={element.className}
          animate={element.animate}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
      ))}
      
      {/* Grid overlay effect */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
    </div>
  );
};

export default ParallaxBackground;