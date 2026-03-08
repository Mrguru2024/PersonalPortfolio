"use client";

import { useTheme } from "@/components/ui/theme-provider";
import { useEffect, useState } from "react";

export type ResolvedTheme = "light" | "dark";

export function useResolvedTheme(): ResolvedTheme {
  const { theme } = useTheme();
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme === "dark") {
      setResolved("dark");
      return;
    }
    if (theme === "light") {
      setResolved("light");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");
    const handler = () => setResolved(mq.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return resolved;
}
