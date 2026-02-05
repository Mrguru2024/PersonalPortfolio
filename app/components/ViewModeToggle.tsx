"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

interface ViewModeToggleProps {
  isImmersive: boolean;
  setIsImmersive: (value: boolean) => void;
}

export default function ViewModeToggle({
  isImmersive,
  setIsImmersive,
}: ViewModeToggleProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isImmersiveMode", String(isImmersive));
    }
  }, [isImmersive]);

  return (
    <div className="fixed bottom-24 right-6 z-50 bg-background/95 dark:bg-card p-3 rounded-xl shadow-lg border border-border flex items-center gap-2">
      <Label htmlFor="view-mode" className="text-sm cursor-pointer">
        Standard
      </Label>
      <Switch
        id="view-mode"
        checked={isImmersive}
        onCheckedChange={setIsImmersive}
      />
      <Label htmlFor="view-mode" className="text-sm cursor-pointer">
        Immersive
      </Label>
    </div>
  );
}
