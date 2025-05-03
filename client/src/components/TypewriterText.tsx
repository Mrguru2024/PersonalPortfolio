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

const TypewriterText: React.FC<TypewriterTextProps> = ({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayAfterPhrase = 2000,
  className = '',
  cursorClassName = '',
  once = false
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimatingRef = useRef(false);
  
  // Store phrases in a ref to avoid dependency issues
  const phrasesRef = useRef(phrases);
  
  // Handle animation state via imperative code to avoid infinite re-renders
  useEffect(() => {
    // Make sure to avoid multiple animation loops
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    
    let isMounted = true;
    
    const animateTyping = () => {
      if (!isMounted) return;
      
      const currentPhrase = phrasesRef.current[currentPhraseIndex];
      
      if (!isDeleting) {
        // Typing forward
        if (displayText.length < currentPhrase.length) {
          // Continue typing
          const nextChar = currentPhrase.charAt(displayText.length);
          setDisplayText(prev => prev + nextChar);
          timeoutRef.current = setTimeout(animateTyping, typingSpeed);
        } else {
          // Complete, wait before deleting
          timeoutRef.current = setTimeout(() => {
            if (!isMounted) return;
            
            // Stop here if we're on the last phrase and once=true
            if (once && currentPhraseIndex === phrasesRef.current.length - 1) return;
            
            setIsDeleting(true);
            animateTyping();
          }, delayAfterPhrase);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          // Continue deleting
          setDisplayText(prev => prev.slice(0, -1));
          timeoutRef.current = setTimeout(animateTyping, deletingSpeed);
        } else {
          // Move to next phrase
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrasesRef.current.length);
          timeoutRef.current = setTimeout(animateTyping, typingSpeed);
        }
      }
    };
    
    // Start the animation
    animateTyping();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Ensure phrases ref is updated if phrases prop changes
  useEffect(() => {
    phrasesRef.current = phrases;
  }, [phrases]);

  return (
    <motion.span 
      className={`inline-block ${className} typing`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
      <span className={`cursor ${cursorClassName}`}>|</span>
    </motion.span>
  );
};

export default TypewriterText;