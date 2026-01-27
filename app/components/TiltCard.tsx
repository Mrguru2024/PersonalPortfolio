import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  perspective?: number;
  tiltAmount?: number;
  transitionDuration?: number;
  glareEnabled?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  bgColor?: string;
  shadowColor?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  perspective = 1500,
  tiltAmount = 10,
  transitionDuration = 0.3,
  glareEnabled = true,
  glareMaxOpacity = 0.15,
  glareColor = 'white',
  bgColor = 'transparent',
  shadowColor = 'rgba(0, 0, 0, 0.2)'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Motion values for tilt effect
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  
  // Apply spring physics for smooth animation
  const springConfig = { damping: 25, stiffness: 300 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  
  // Values for glare effect
  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);
  const glareOpacity = useTransform(
    // Calculate intensity based on distance from center
    rotateX, 
    [-tiltAmount, 0, tiltAmount], 
    [0, glareMaxOpacity, 0]
  );
  
  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card (0 to 1)
    const centerX = (e.clientX - rect.left) / rect.width;
    const centerY = (e.clientY - rect.top) / rect.height;
    
    // Calculate rotation based on mouse position and tilt amount
    const newRotateX = (centerY - 0.5) * -tiltAmount; // Invert Y
    const newRotateY = (centerX - 0.5) * tiltAmount;
    
    rotateX.set(newRotateX);
    rotateY.set(newRotateY);
    
    // Update glare position
    glareX.set(centerX * 100); // As percentage
    glareY.set(centerY * 100); // As percentage
  };
  
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        perspective: `${perspective}px`,
        backgroundColor: bgColor,
        transformStyle: 'preserve-3d',
        borderRadius: 'var(--radius)',
        boxShadow: isHovering
          ? `0 30px 60px ${shadowColor}`
          : `0 10px 30px ${shadowColor}`
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ 
        z: 20,
        transition: { 
          duration: transitionDuration 
        }
      }}
    >
      {/* Main content */}
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transition: `all ${transitionDuration}s ease-out`
        }}
      >
        {children}
      </motion.div>
      
      {/* Glare effect */}
      {glareEnabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glareColor} 0%, transparent 70%)`,
            opacity: glareOpacity,
            mixBlendMode: 'overlay'
          }}
        />
      )}
    </motion.div>
  );
};

export default TiltCard;