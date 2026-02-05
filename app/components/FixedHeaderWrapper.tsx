"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "./Header";

const SCROLL_THRESHOLD = 60;

/**
 * Fixed header (logo + nav) that hides when user scrolls down and reappears when they scroll up or are at top.
 */
export default function FixedHeaderWrapper() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current && y > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (y < lastY.current || y <= SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`site-top-no-box fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out`}
      style={{
        background: "transparent",
        position: "fixed",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div
        className="w-full pt-0 pb-0.5 pl-4 pr-4 sm:pl-6 sm:pr-6"
        style={{ background: "transparent" }}
      >
        <Link
          href="/"
          className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Ascendra Technologies – Home"
        >
          <img
            src="/ascendra-logo.svg"
            alt="Ascendra Technologies"
            className="header-logo h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain bg-transparent"
            width={320}
            height={128}
          />
        </Link>
      </div>
      <div style={{ background: "transparent" }}>
        <Header />
      </div>
    </div>
  );
}
