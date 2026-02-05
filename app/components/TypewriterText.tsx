import { useState, useEffect, useRef } from 'react';

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

  const displayTextRef = useRef(displayText);
  const currentIndexRef = useRef(currentIndex);
  const isDeletingRef = useRef(isDeleting);
  displayTextRef.current = displayText;
  currentIndexRef.current = currentIndex;
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    if (phrases.length === 0) return;

    let timeout: ReturnType<typeof setTimeout>;
    let mounted = true;

    const tick = () => {
      if (!mounted) return;

      const idx = currentIndexRef.current;
      const deleting = isDeletingRef.current;
      const fullText = phrases[idx] ?? '';
      const prev = displayTextRef.current;

      if (!deleting) {
        const next = fullText.substring(0, prev.length + 1);
        setDisplayText(next);
        displayTextRef.current = next;

        if (next === fullText) {
          if (once && idx === phrases.length - 1) return;
          timeout = setTimeout(() => {
            if (mounted) {
              setIsDeleting(true);
              isDeletingRef.current = true;
            }
          }, delayAfterPhrase);
          return;
        }
      } else {
        const next = fullText.substring(0, prev.length - 1);
        setDisplayText(next);
        displayTextRef.current = next;

        if (next === '') {
          setIsDeleting(false);
          setCurrentIndex((i) => (i + 1) % phrases.length);
          currentIndexRef.current = (idx + 1) % phrases.length;
          isDeletingRef.current = false;
          displayTextRef.current = '';
          timeout = setTimeout(tick, typingSpeed);
          return;
        }
      }

      timeout = setTimeout(tick, deleting ? deletingSpeed : typingSpeed);
    };

    timeout = setTimeout(tick, typingSpeed);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [phrases, typingSpeed, deletingSpeed, delayAfterPhrase, once]);

  return (
    <span className={className}>
      {displayText}
      <span className={`typing-cursor ${cursorClassName}`}>|</span>
    </span>
  );
};

export default TypewriterText;