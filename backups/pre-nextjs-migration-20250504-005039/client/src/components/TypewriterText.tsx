import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayAfterPhrase?: number;
  className?: string;
  cursorClassName?: string;
  once?: boolean;
}

const TypewriterText = ({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayAfterPhrase = 2000,
  className = '',
  cursorClassName = '',
  once = false
}: TypewriterTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Simple implementation without complex state management
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let mounted = true;
    
    const tick = () => {
      if (!mounted) return;
      
      // Get current phrase
      const fullText = phrases[currentIndex];
      
      // Update text based on whether we're deleting or typing
      if (!isDeleting) {
        setDisplayText((prev) => 
          fullText.substring(0, prev.length + 1)
        );
        
        // If we've fully typed the text, start deleting after a delay
        if (displayText === fullText) {
          // Don't delete if this is the last phrase and once is true
          if (once && currentIndex === phrases.length - 1) {
            return;
          }
          
          timeout = setTimeout(() => {
            if (mounted) setIsDeleting(true);
          }, delayAfterPhrase);
          return;
        }
      } else {
        setDisplayText((prev) => 
          fullText.substring(0, prev.length - 1)
        );
        
        // If we've deleted everything, move to next phrase
        if (displayText === '') {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % phrases.length);
          return;
        }
      }
      
      // Set the next timeout based on if we're typing or deleting
      timeout = setTimeout(
        tick, 
        isDeleting ? deletingSpeed : typingSpeed
      );
    };
    
    timeout = setTimeout(tick, typingSpeed);
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [displayText, isDeleting, currentIndex, phrases, typingSpeed, deletingSpeed, delayAfterPhrase, once]);
  
  return (
    <span className={`${className}`}>
      {displayText}
      <span className={`typing-cursor ${cursorClassName}`}>|</span>
    </span>
  );
};

export default TypewriterText;