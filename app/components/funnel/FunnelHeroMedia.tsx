import Image from "next/image";
import { cn } from "@/lib/utils";

export type FunnelHeroMediaMaxWidth =
  | "md"
  | "lg"
  | "2xl"
  | "3xl"
  | "4xl"
  | "full";
/** cinematic: 21/9 → 2/1 sm+. wide: 2/1 (section lead photos). video: 16/9 */
export type FunnelHeroMediaAspect = "cinematic" | "wide" | "video";

const maxWidthClass: Record<FunnelHeroMediaMaxWidth, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-none",
};

export interface FunnelHeroMediaProps {
  src: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  maxWidth?: FunnelHeroMediaMaxWidth;
  aspect?: FunnelHeroMediaAspect;
  /** after-copy: gap above (from copy) and below (to CTAs / next block). before-copy: gap under image before headline. none: no preset vertical margin. */
  spacing?: "after-copy" | "before-copy" | "none";
  showGradientOverlay?: boolean;
  gradientClassName?: string;
  className?: string;
}

export function FunnelHeroMedia({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 672px",
  priority = false,
  maxWidth = "3xl",
  aspect = "cinematic",
  spacing = "after-copy",
  showGradientOverlay = true,
  gradientClassName = "from-background/70 via-transparent to-transparent",
  className,
}: FunnelHeroMediaProps) {
  const aspectClass =
    aspect === "video"
      ? "aspect-video"
      : aspect === "wide"
        ? "aspect-[2/1]"
        : "aspect-[21/9] sm:aspect-[2/1]";
  const spacingClass =
    spacing === "after-copy"
      ? "mt-6 sm:mt-8 mb-6 sm:mb-8"
      : spacing === "before-copy"
        ? "mb-6 sm:mb-8"
        : "";

  return (
    <div
      className={cn(
        "relative w-full mx-auto rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5",
        maxWidthClass[maxWidth],
        aspectClass,
        spacingClass,
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
      {showGradientOverlay ? (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t pointer-events-none",
            gradientClassName,
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
