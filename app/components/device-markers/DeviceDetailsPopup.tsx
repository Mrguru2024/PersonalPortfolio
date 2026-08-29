"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Info, Settings, Network, HardDrive, Edit2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DeviceType } from "./types";

interface DeviceDetailsPopupProps {
  device: DeviceType;
  onClose: () => void;
  position?: { x: number; y: number };
  onSave?: (updatedDevice: DeviceType) => void;
}

export function DeviceDetailsPopup({
  device,
  onClose,
  position,
  onSave,
}: DeviceDetailsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDevice, setEditedDevice] = useState<DeviceType>(device);

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

  const handleSave = () => {
    onSave?.(editedDevice);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDevice(device);
    setIsEditing(false);
  };

  const updateSpecification = (index: number, field: "label" | "value", value: string) => {
    const newSpecs = [...(editedDevice.specifications || [])];
    newSpecs[index] = { ...newSpecs[index]!, [field]: value };
    setEditedDevice({ ...editedDevice, specifications: newSpecs });
  };

  const updatePort = (index: number, field: "label" | "type", value: string) => {
    const newPorts = [...(editedDevice.ports || [])];
    if (field === "label" || field === "type") {
      newPorts[index] = { ...newPorts[index]!, [field]: value };
    }
    setEditedDevice({ ...editedDevice, ports: newPorts });
  };

  const updatePortCount = (index: number, value: number) => {
    const newPorts = [...(editedDevice.ports || [])];
    newPorts[index] = { ...newPorts[index]!, count: value };
    setEditedDevice({ ...editedDevice, ports: newPorts });
  };

  const updateConfiguration = (index: number, field: "label" | "value", value: string) => {
    const newConfigs = [...(editedDevice.configurations || [])];
    newConfigs[index] = { ...newConfigs[index]!, [field]: value };
    setEditedDevice({ ...editedDevice, configurations: newConfigs });
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
        "z-50 w-80 sm:w-[480px] rounded-lg shadow-2xl",
        "backdrop-blur-md border border-white/20",
        position ? "" : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        "max-h-[85vh] overflow-y-auto"
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
        <div className="absolute top-3 right-3 flex gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Edit device details"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Close details popup"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-green-400 hover:text-green-300 hover:bg-white/10",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-green-400/50"
                )}
                aria-label="Save changes"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

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

          {isEditing ? (
            <Textarea
              value={editedDevice.description}
              onChange={(e) =>
                setEditedDevice({ ...editedDevice, description: e.target.value })
              }
              className="text-sm text-white bg-white/10 border-white/20 leading-relaxed min-h-[80px] resize-none"
              placeholder="Device description"
            />
          ) : (
            <p className="text-sm text-white/80 leading-relaxed">
              {device.description}
            </p>
          )}

          {device.specifications && device.specifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Specifications
              </h4>
              <div className="space-y-2">
                {(isEditing ? editedDevice.specifications : device.specifications)?.map((spec, index) => (
                  <div key={index} className="space-y-1">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={spec.label}
                          onChange={(e) => updateSpecification(index, "label", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Label"
                        />
                        <Input
                          value={spec.value}
                          onChange={(e) => updateSpecification(index, "value", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Value"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm gap-3">
                        <span className="text-white/60 min-w-[120px]">{spec.label}:</span>
                        <span className="text-white font-medium text-right flex-1">{spec.value}</span>
                      </div>
                    )}
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
              <div className="space-y-2">
                {(isEditing ? editedDevice.ports : device.ports)?.map((port, index) => (
                  <div key={index} className="space-y-1">
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={port.label}
                          onChange={(e) => updatePort(index, "label", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Label"
                        />
                        <Input
                          type="number"
                          value={port.count}
                          onChange={(e) => updatePortCount(index, parseInt(e.target.value) || 0)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Count"
                          min="0"
                        />
                        <Input
                          value={port.type}
                          onChange={(e) => updatePort(index, "type", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Type"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm gap-3">
                        <span className="text-white/60 min-w-[120px]">{port.label}:</span>
                        <span className="text-white font-medium text-right flex-1">
                          {port.count}x {port.type}
                        </span>
                      </div>
                    )}
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
              <div className="space-y-2">
                {(isEditing ? editedDevice.configurations : device.configurations)?.map((config, index) => (
                  <div key={index} className="space-y-1">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={config.label}
                          onChange={(e) => updateConfiguration(index, "label", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Label"
                        />
                        <Input
                          value={config.value}
                          onChange={(e) => updateConfiguration(index, "value", e.target.value)}
                          className="text-sm text-white bg-white/10 border-white/20 h-9"
                          placeholder="Value"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm gap-3">
                        <span className="text-white/60 min-w-[120px]">{config.label}:</span>
                        <span className="text-white font-medium text-right flex-1">
                          {config.value}
                        </span>
                      </div>
                    )}
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
