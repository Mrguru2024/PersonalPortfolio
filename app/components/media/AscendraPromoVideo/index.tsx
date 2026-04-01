"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWPORT_PRELOAD_MARGIN = "140px 0px";

export interface AscendraPromoVideoProps {
  src: string;
  /** Accessibility label for the video element */
  ariaLabel: string;
  /** `cover` fills frame (YouTube-style); `contain` for logo/graphic reveals */
  objectFit?: "cover" | "contain";
  /** Outer wrapper max width — default wide cinematic (not phone-narrow) */
  maxWidthClassName?: string;
  className?: string;
  /** Extra classes on the aspect-ratio frame */
  frameClassName?: string;
  /**
   * `autoplayMuted` — loops, starts muted (browser autoplay rules); use **Sound on** overlay + native controls.
   * `clickToPlay` — no autoplay; sound works as soon as the user presses **play** on the native bar (best for tutorials).
   */
  playback?: "autoplayMuted" | "clickToPlay";
}

/**
 * Promo / embed-style video: **16:9 (YouTube / IG feed landscape)** frame, generous width, native controls.
 */
export function AscendraPromoVideo({
  src,
  ariaLabel,
  objectFit = "cover",
  maxWidthClassName = "max-w-5xl",
  className,
  frameClassName,
  playback = "autoplayMuted",
}: AscendraPromoVideoProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAutoplay = playback === "autoplayMuted";
  const [muted, setMuted] = useState(isAutoplay);
  const [inView, setInView] = useState(false);

  const syncMuted = useCallback(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  useEffect(() => {
    syncMuted();
  }, [syncMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onVolumeChange = () => {
      setMuted(v.muted);
    };
    v.addEventListener("volumechange", onVolumeChange);
    return () => v.removeEventListener("volumechange", onVolumeChange);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: VIEWPORT_PRELOAD_MARGIN, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.load();
    } catch {
      /* jsdom / non-media environments */
    }
    if (isAutoplay) {
      try {
        const p = v.play();
        if (p !== undefined && typeof (p as Promise<void>).then === "function") {
          void (p as Promise<void>).catch(() => {});
        }
      } catch {
        /* autoplay blocked */
      }
    }
  }, [inView, isAutoplay]);

  const toggleSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    void v.play().catch(() => {});
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative w-full mx-auto", maxWidthClassName, className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-xl ring-1 ring-black/5 dark:ring-white/10",
          "aspect-video",
          frameClassName,
        )}
      >
        <video
          ref={videoRef}
          autoPlay={isAutoplay && inView}
          muted={isAutoplay ? muted : false}
          loop={isAutoplay}
          playsInline
          controls
          controlsList="nodownload"
          preload={inView ? (isAutoplay ? "auto" : "metadata") : "none"}
          className={cn(
            "absolute inset-0 h-full w-full",
            objectFit === "cover" ? "object-cover" : "object-contain",
          )}
          aria-label={ariaLabel}
        >
          <source src={src} type="video/mp4" />
        </video>

        {isAutoplay ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-2 sm:p-3">
            <button
              type="button"
              onClick={toggleSound}
              className={cn(
                "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-lg transition",
                "bg-background/95 text-foreground backdrop-blur-sm border border-border/80",
                "hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-label={muted ? "Turn sound on" : "Mute video"}
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Sound on</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
