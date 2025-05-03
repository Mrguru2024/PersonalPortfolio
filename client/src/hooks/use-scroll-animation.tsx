import { useInView } from "framer-motion";
import { useRef } from "react";

export function useScrollAnimation(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  
  return { ref, isInView };
}