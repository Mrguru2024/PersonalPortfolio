"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker so the site can be installed as an app
 * and use offline caching for admin/CRM. Runs once per session.
 */
export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
