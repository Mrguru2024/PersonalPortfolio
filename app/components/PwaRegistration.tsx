"use client";

import { useEffect } from "react";

function applyPwaStandaloneDataset() {
  if (typeof document === "undefined") return;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (typeof navigator !== "undefined" &&
      "standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  document.documentElement.dataset.pwaStandalone = standalone ? "true" : "false";
}

/**
 * Registers the service worker for install + offline shells, and flags
 * `html[data-pwa-standalone]` so CSS can tune the tab bar for installed app mode.
 */
export default function PwaRegistration() {
  useEffect(() => {
    applyPwaStandaloneDataset();

    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    const mqMinimal = window.matchMedia("(display-mode: minimal-ui)");
    const onDisplayMode = () => applyPwaStandaloneDataset();
    mqStandalone.addEventListener("change", onDisplayMode);
    mqMinimal.addEventListener("change", onDisplayMode);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      mqStandalone.removeEventListener("change", onDisplayMode);
      mqMinimal.removeEventListener("change", onDisplayMode);
    };
  }, []);
  return null;
}
