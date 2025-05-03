import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animateText = useCallback(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Handle completion of a single phrase animation cycle
    const handleCompleteCycle = () => {
      if (once && currentPhraseIndex === phrases.length - 1) {
        // Stop after completing the last phrase if once is true
        return;
      }
      
      setIsDeleting(true);
      timeoutRef.current = setTimeout(animateText, deletingSpeed);
    };

    if (!isDeleting) {
      // Typing forward
      if (displayText.length < currentPhrase.length) {
        // Still typing the current phrase
        const nextChar = currentPhrase.charAt(displayText.length);
        setDisplayText(prev => prev + nextChar);
        timeoutRef.current = setTimeout(animateText, typingSpeed);
      } else {
        // Completed typing, pause before deleting
        timeoutRef.current = setTimeout(handleCompleteCycle, delayAfterPhrase);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        // Still deleting
        setDisplayText(prev => prev.slice(0, -1));
        timeoutRef.current = setTimeout(animateText, deletingSpeed);
      } else {
        // Completed deleting, move to next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        timeoutRef.current = setTimeout(animateText, typingSpeed);
      }
    }
  }, [
    phrases, 
    currentPhraseIndex, 
    isDeleting, 
    displayText, 
    typingSpeed, 
    deletingSpeed, 
    delayAfterPhrase,
    once
  ]);

  useEffect(() => {
    if (!isAnimationPaused) {
      animateText();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animateText, isAnimationPaused]);

  return (
    <motion.span 
      className={`inline-block ${className} typing`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
    </motion.span>
  );
};

export default TypewriterText;