"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (opts: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      AppEvents?: { logPageView: () => void };
    };
    __ASCENDRA_FB_INITED__?: boolean;
  }
}

function sanitizeGraphApiVersion(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (/^v\d+(\.\d+)*$/.test(t)) return t;
  const digits = raw.trim().match(/^(\d+(?:\.\d+)*)$/);
  if (digits) return `v${digits[1]}`;
  return "v21.0";
}

type FacebookJsSdkProps = {
  appId: string;
  graphVersion: string;
};

/**
 * Loads the Meta Facebook JS SDK once (guarded against React Strict Mode / remounts).
 * Avoids next/script inline re-execution, which can interact badly with the SDK loader.
 */
export function FacebookJsSdk({ appId, graphVersion }: FacebookJsSdkProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !/^\d+$/.test(appId)) return;

    const version = sanitizeGraphApiVersion(graphVersion);

    window.fbAsyncInit = function fbAsyncInitAscendra() {
      if (window.__ASCENDRA_FB_INITED__ || !window.FB) return;
      try {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: true,
          version,
        });
        window.__ASCENDRA_FB_INITED__ = true;
        // Optional; not all web SDK builds expose AppEvents — avoid throwing if missing.
        try {
          window.FB.AppEvents?.logPageView?.();
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.warn("[Facebook SDK] FB.init failed", err);
      }
    };

    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      if (window.FB) {
        window.fbAsyncInit();
      }
      return;
    }

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.async = true;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) {
      first.parentNode.insertBefore(js, first);
    } else {
      document.body.appendChild(js);
    }
  }, [appId, graphVersion]);

  return null;
}
