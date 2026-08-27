"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Info, Settings, Network, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceType } from "./types";

interface DeviceDetailsPopupProps {
  device: DeviceType;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function DeviceDetailsPopup({
  device,
  onClose,
  position,
}: DeviceDetailsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const categoryIcons = {
    networking: Network,
    compute: Settings,
    storage: HardDrive,
    security: Info,
    other: Info,
  };

  const Icon = categoryIcons[device.category];

  const categoryColors = {
    networking: "text-blue-500",
    compute: "text-purple-500",
    storage: "text-green-500",
    security: "text-red-500",
    other: "text-gray-500",
  };

  const popupStyle = position
    ? {
        position: "fixed" as const,
        left: position.x + 100,
        top: position.y,
      }
    : undefined;

  return (
    <motion.div
      ref={popupRef}
      className={cn(
        "z-50 w-80 sm:w-96 rounded-lg shadow-2xl",
        "backdrop-blur-md border border-white/20",
        position ? "" : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      )}
      style={{
        ...popupStyle,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      }}
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative p-5">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-md",
            "text-white/70 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-white/50"
          )}
          aria-label="Close details popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={cn("mt-1", categoryColors[device.category])}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{device.name}</h3>
              <p className="text-xs text-white/60 uppercase tracking-wide mt-0.5">
                {device.category} • {device.abbreviation}
              </p>
            </div>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            {device.description}
          </p>

          {device.specifications && device.specifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Specifications
              </h4>
              <div className="space-y-1.5">
                {device.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-white/60">{spec.label}:</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {device.ports && device.ports.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Ports
              </h4>
              <div className="space-y-1.5">
                {device.ports.map((port, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-white/60">{port.label}:</span>
                    <span className="text-white font-medium">
                      {port.count}x {port.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {device.configurations && device.configurations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Configuration
              </h4>
              <div className="space-y-1.5">
                {device.configurations.map((config, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-white/60">{config.label}:</span>
                    <span className="text-white font-medium">
                      {config.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
