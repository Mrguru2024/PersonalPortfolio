import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    const mouseDown = () => setIsClicking(true);
    const mouseUp = () => setIsClicking(false);

    const handleLinkHover = () => setIsHoveringLink(true);
    const handleLinkLeave = () => setIsHoveringLink(false);

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);

    // Add event listeners to all links and buttons
    const linkElements = document.querySelectorAll('a, button, .hover-target');
    linkElements.forEach(link => {
      link.addEventListener('mouseenter', handleLinkHover);
      link.addEventListener('mouseleave', handleLinkLeave);
    });

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
      
      linkElements.forEach(link => {
        link.removeEventListener('mouseenter', handleLinkHover);
        link.removeEventListener('mouseleave', handleLinkLeave);
      });
    };
  }, []);

  return (
    <>
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

      {/* Outer ring */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-10 h-10 rounded-full border-2 border-primary z-50 pointer-events-none mix-blend-difference"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHoveringLink ? 1.8 : isClicking ? 0.8 : 1,
          opacity: isHoveringLink ? 0.7 : 1,
          borderColor: isHoveringLink ? "rgba(255, 255, 255, 0.7)" : "rgba(59, 130, 246, 0.6)"
        }}
        transition={{
          type: "spring",
          mass: 0.4,
          stiffness: 400,
          damping: 30,
          opacity: { duration: 0.2 }
        }}
      />

      {/* Subtle glow effect */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-20 h-20 rounded-full bg-primary/10 blur-md z-40 pointer-events-none"
        animate={{
          x: mousePosition.x - 40,
          y: mousePosition.y - 40,
          scale: isHoveringLink ? 1.2 : isClicking ? 0.5 : 0.8,
          opacity: isHoveringLink ? 0.5 : isClicking ? 0.8 : 0.3
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