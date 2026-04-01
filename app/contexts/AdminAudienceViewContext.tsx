"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ascendra_admin_audience_view";

export type AdminAudienceViewMode = "admin" | "customer" | "community";

function parseStoredMode(raw: string | null): AdminAudienceViewMode {
  if (raw === "customer" || raw === "community") return raw;
  return "admin";
}

type AdminAudienceViewContextValue = {
  mode: AdminAudienceViewMode;
  setMode: (mode: AdminAudienceViewMode) => void;
  /** False until client has read localStorage (avoid SSR mismatch). */
  ready: boolean;
};

const AdminAudienceViewContext = createContext<AdminAudienceViewContextValue | null>(null);

export function AdminAudienceViewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AdminAudienceViewMode>("admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(parseStoredMode(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null));
    setReady(true);
  }, []);

  const setMode = useCallback((next: AdminAudienceViewMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      if (next === "admin") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      ready,
    }),
    [mode, setMode, ready],
  );

  return <AdminAudienceViewContext.Provider value={value}>{children}</AdminAudienceViewContext.Provider>;
}

export function useAdminAudienceView() {
  const ctx = useContext(AdminAudienceViewContext);
  if (!ctx) {
    throw new Error("useAdminAudienceView must be used within AdminAudienceViewProvider");
  }
  return ctx;
}
