"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

const MAIN_CLASS =
  "relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[158px] fold:pt-[178px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-[max(5rem,calc(56px+env(safe-area-inset-bottom,0px)+2rem))] lg:pb-[max(1rem,env(safe-area-inset-bottom))]";

/**
 * Main column with padding-top derived from fixed header + optional trial banner.
 * ResizeObserver + visualViewport keep layout correct on foldables (e.g. Z Fold)
 * and when the chrome height changes (font scale, orientation, split-screen).
 */
export function SiteMain({ children }: { children: ReactNode }) {
  const [paddingTop, setPaddingTop] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    const compute = () => {
      const header = document.querySelector(".site-top-no-box");
      if (!header || !(header instanceof HTMLElement)) return;

      const trial = document.querySelector("[data-site-trial-banner]");
      const trialEl = trial instanceof HTMLElement && trial.getClientRects().length > 0 ? trial : null;

      let maxBottom = 0;
      const hr = header.getBoundingClientRect();
      if (hr.height > 1) {
        maxBottom = Math.max(maxBottom, hr.bottom);
      }
      if (trialEl) {
        const tr = trialEl.getBoundingClientRect();
        if (tr.height > 1) {
          maxBottom = Math.max(maxBottom, tr.bottom);
        }
      }

      // Immersive scroll hides header via transform — rects can sit above the viewport
      if (maxBottom < 48) {
        maxBottom = header.offsetHeight;
        if (trialEl) {
          const tr = trialEl.getBoundingClientRect();
          maxBottom = Math.max(
            maxBottom,
            tr.bottom > 8 ? tr.bottom : header.offsetHeight + trialEl.offsetHeight,
          );
        }
      }

      const vv = window.visualViewport;
      const inset = vv && vv.offsetTop > 0 ? vv.offsetTop : 0;
      const px = Math.min(Math.ceil(maxBottom + inset + 12), 440);
      setPaddingTop(`${Math.max(px, 120)}px`);
    };

    compute();

    const header = document.querySelector(".site-top-no-box");
    const trial = document.querySelector("[data-site-trial-banner]");
    const ro = new ResizeObserver(compute);
    if (header) ro.observe(header);
    if (trial) ro.observe(trial);

    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", compute);
    vv?.addEventListener("scroll", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
      vv?.removeEventListener("resize", compute);
      vv?.removeEventListener("scroll", compute);
    };
  }, []);

  return (
    <main
      className={MAIN_CLASS}
      style={paddingTop !== undefined ? { paddingTop } : undefined}
    >
      {children}
    </main>
  );
}
