"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Edit2, Save, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { PlacedMarkerData } from "./types";

interface MarkerDetailsPopupProps {
  marker: PlacedMarkerData;
  onClose: () => void;
  onUpdate: (updates: Partial<PlacedMarkerData>) => void;
}

export function MarkerDetailsPopup({
  marker,
  onClose,
  onUpdate,
}: MarkerDetailsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customLabel, setCustomLabel] = useState(marker.customLabel || "");
  const [customData, setCustomData] = useState<Record<string, string>>(
    marker.customData || {}
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEditing) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditing, onClose]);

  const handleSave = () => {
    onUpdate({
      customLabel: customLabel || undefined,
      customData: Object.keys(customData).length > 0 ? customData : undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setCustomLabel(marker.customLabel || "");
    setCustomData(marker.customData || {});
    setIsEditing(false);
  };

  const handleRotate = () => {
    const newRotation = (marker.rotation + 45) % 360;
    onUpdate({ rotation: newRotation });
  };

  const updateCustomDataField = (key: string, value: string) => {
    setCustomData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      ref={popupRef}
      className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        "z-50 w-80 sm:w-[480px] rounded-lg shadow-2xl",
        "backdrop-blur-md border border-white/20",
        "max-h-[85vh] overflow-y-auto"
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      }}
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative p-5">
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            title="Rotate 45°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                title="Edit details"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-white/10"
                title="Save changes"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 rounded-md p-2 font-mono font-bold text-white text-sm"
              style={{ backgroundColor: marker.symbol.color }}
            >
              {marker.symbol.abbreviation}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={marker.symbol.name}
                  className="text-white bg-white/10 border-white/20 font-bold"
                />
              ) : (
                <h3 className="text-lg font-bold text-white">
                  {marker.customLabel || marker.symbol.name}
                </h3>
              )}
              <p className="text-xs text-white/60 uppercase tracking-wide mt-0.5">
                {marker.symbol.category} • {marker.symbol.abbreviation}
              </p>
            </div>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            {marker.symbol.description}
          </p>

          {marker.symbol.specifications && marker.symbol.specifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Specifications
              </h4>
              <div className="space-y-2">
                {marker.symbol.specifications.map((spec, index) => (
                  <div key={index} className="space-y-1">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={customData[`spec_${index}_label`] || spec.label}
                          onChange={(e) =>
                            updateCustomDataField(`spec_${index}_label`, e.target.value)
                          }
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Label"
                        />
                        <Input
                          value={customData[`spec_${index}_value`] || spec.value}
                          onChange={(e) =>
                            updateCustomDataField(`spec_${index}_value`, e.target.value)
                          }
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Value"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm gap-3">
                        <span className="text-white/60 min-w-[120px]">
                          {customData[`spec_${index}_label`] || spec.label}:
                        </span>
                        <span className="text-white font-medium text-right flex-1">
                          {customData[`spec_${index}_value`] || spec.value}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Position & Rotation
            </h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-white/60">X:</span>
                <span className="text-white ml-2">{Math.round(marker.position.x)}px</span>
              </div>
              <div>
                <span className="text-white/60">Y:</span>
                <span className="text-white ml-2">{Math.round(marker.position.y)}px</span>
              </div>
              <div>
                <span className="text-white/60">Rotation:</span>
                <span className="text-white ml-2">{marker.rotation}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
