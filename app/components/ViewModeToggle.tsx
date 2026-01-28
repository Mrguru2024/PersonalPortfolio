import React, { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ViewModeToggleProps {
  isImmersive: boolean;
  setIsImmersive: (value: boolean) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ isImmersive, setIsImmersive }) => {
  // Save view mode preference in local storage
  useEffect(() => {
    localStorage.setItem('isImmersiveMode', isImmersive.toString());
  }, [isImmersive]);

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg flex items-center gap-2 touch-target"
      style={{
        bottom: "max(6rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1.5rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <Label htmlFor="view-mode" className="text-sm whitespace-nowrap">Standard</Label>
      <Switch
        id="view-mode"
        checked={isImmersive}
        onCheckedChange={setIsImmersive}
      />
      <Label htmlFor="view-mode" className="text-sm whitespace-nowrap">Immersive</Label>
    </div>
  );
};

export default ViewModeToggle;