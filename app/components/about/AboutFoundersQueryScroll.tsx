"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * When `/ecosystem-founders` redirects to `/about?founders=1`, scroll to the team section
 * and clean the query from the address bar.
 */
export function AboutFoundersQueryScroll() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("founders") !== "1") return;
    const el = document.getElementById("ecosystem-team");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("founders");
    window.history.replaceState(null, "", url.pathname + url.hash);
  }, [searchParams]);

  return null;
}
