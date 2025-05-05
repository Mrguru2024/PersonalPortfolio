import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';

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
    <div className="fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg flex items-center gap-2">
      <Label htmlFor="view-mode" className="text-sm">Standard</Label>
      <Switch
        id="view-mode"
        checked={isImmersive}
        onCheckedChange={setIsImmersive}
      />
      <Label htmlFor="view-mode" className="text-sm">Immersive</Label>
    </div>
  );
};

export default ViewModeToggle;