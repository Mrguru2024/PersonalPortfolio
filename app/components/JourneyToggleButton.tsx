"use client";

import { motion } from "framer-motion";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

interface JourneyToggleButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export default function JourneyToggleButton({ onClick, isActive }: JourneyToggleButtonProps) {
  return (
    <motion.button 
      className={`fixed left-6 bottom-6 w-12 h-12 rounded-full flex items-center justify-center z-50 shadow-lg ${
        isActive ? 'bg-blue-600 text-white' : 'bg-primary text-white'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={isActive ? "Hide journey guide" : "Show journey guide"}
    >
      <Sparkles size={20} />
    </motion.button>
  );
}