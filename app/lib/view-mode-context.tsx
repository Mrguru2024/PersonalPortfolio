"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "isImmersiveMode";

type ViewModeContextValue = {
  isImmersive: boolean;
  setIsImmersive: (value: boolean) => void;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isImmersive, setImmersiveState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    setImmersiveState(saved ? saved === "true" : true);
  }, [mounted]);

  const setIsImmersive = useCallback((value: boolean) => {
    setImmersiveState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }, []);

  return (
    <ViewModeContext.Provider value={{ isImmersive, setIsImmersive }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    return {
      isImmersive: true,
      setIsImmersive: () => {},
    };
  }
  return ctx;
}
