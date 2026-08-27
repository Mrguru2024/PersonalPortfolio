"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkerDetailsPopup } from "./MarkerDetailsPopup";
import type { PlacedMarkerData } from "./types";

interface PlacedMarkerProps {
  marker: PlacedMarkerData;
  zoom: number;
  onUpdate: (updates: Partial<PlacedMarkerData>) => void;
  onDelete: () => void;
}

export function PlacedMarker({
  marker,
  zoom,
  onUpdate,
  onDelete,
}: PlacedMarkerProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        markerRef.current &&
        !markerRef.current.contains(event.target as Node)
      ) {
        setIsSelected(false);
        setShowPopup(false);
      }
    };

    if (isSelected) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSelected]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
    setShowPopup(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.shiftKey) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX / zoom - marker.position.x,
        y: e.clientY / zoom - marker.position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation();
      onUpdate({
        position: {
          x: e.clientX / zoom - dragStart.x,
          y: e.clientY / zoom - dragStart.y,
        },
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const displayLabel = marker.customLabel || marker.symbol.name;

  return (
    <>
      <motion.div
        ref={markerRef}
        className={cn(
          "absolute select-none group",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          left: marker.position.x,
          top: marker.position.y,
          transform: `rotate(${marker.rotation}deg)`,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileHover={{ scale: 1.05 }}
      >
        <div
          className={cn(
            "rounded-lg shadow-lg font-mono font-bold text-white transition-all duration-200",
            "flex items-center justify-center",
            isSelected
              ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
              : ""
          )}
          style={{
            backgroundColor: marker.symbol.color,
            padding: isSelected ? "8px 16px" : "8px 12px",
            fontSize: `${16 / zoom}px`,
            minWidth: isSelected ? `${80 / zoom}px` : `${40 / zoom}px`,
            minHeight: `${40 / zoom}px`,
          }}
        >
          <motion.span
            animate={{
              opacity: 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {isSelected ? displayLabel : marker.symbol.abbreviation}
          </motion.span>
        </div>

        {isSelected && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: `${20 / zoom}px`,
              height: `${20 / zoom}px`,
            }}
            aria-label="Delete marker"
          >
            <Trash2 style={{ width: `${12 / zoom}px`, height: `${12 / zoom}px` }} />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showPopup && (
          <MarkerDetailsPopup
            marker={marker}
            onClose={handleClosePopup}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
