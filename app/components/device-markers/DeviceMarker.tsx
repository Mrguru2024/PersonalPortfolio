"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DeviceDetailsPopup } from "./DeviceDetailsPopup";
import type { DeviceType } from "./types";

interface DeviceMarkerProps {
  device: DeviceType;
  position?: { x: number; y: number };
  className?: string;
  onSelect?: (device: DeviceType) => void;
}

export function DeviceMarker({
  device,
  position,
  className,
  onSelect,
}: DeviceMarkerProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setIsSelected(true);
    setShowPopup(true);
    onSelect?.(device);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const categoryColors = {
    networking: "bg-blue-500 hover:bg-blue-600",
    compute: "bg-purple-500 hover:bg-purple-600",
    storage: "bg-green-500 hover:bg-green-600",
    security: "bg-red-500 hover:bg-red-600",
    other: "bg-gray-500 hover:bg-gray-600",
  };

  const style = position
    ? {
        position: "absolute" as const,
        left: position.x,
        top: position.y,
      }
    : undefined;

  return (
    <>
      <motion.button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center",
          "rounded-lg font-mono font-semibold text-white shadow-lg",
          "transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
          isSelected ? "ring-2 ring-white ring-offset-2" : "",
          categoryColors[device.category],
          className
        )}
        style={style}
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`${device.name} device marker`}
      >
        <motion.span
          className="px-4 py-2 text-sm sm:text-base"
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {isSelected ? device.name : device.abbreviation}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {showPopup && (
          <DeviceDetailsPopup
            device={device}
            onClose={handleClosePopup}
            position={position}
          />
        )}
      </AnimatePresence>
    </>
  );
}
