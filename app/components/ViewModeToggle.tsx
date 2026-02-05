"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useViewMode } from "@/lib/view-mode-context";
import { motion } from "framer-motion";

export default function ViewModeToggle() {
  const { isImmersive, setIsImmersive } = useViewMode();

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-50 bg-background/95 dark:bg-card/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-border flex items-center gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="group"
      aria-label="View mode"
    >
      <Label
        htmlFor="view-mode"
        className={`text-sm cursor-pointer transition-colors ${!isImmersive ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        Standard
      </Label>
      <Switch
        id="view-mode"
        checked={isImmersive}
        onCheckedChange={setIsImmersive}
        className="transition-transform duration-200 data-[state=checked]:bg-primary"
      />
      <Label
        htmlFor="view-mode"
        className={`text-sm cursor-pointer transition-colors ${isImmersive ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        Immersive
      </Label>
    </motion.div>
  );
}
