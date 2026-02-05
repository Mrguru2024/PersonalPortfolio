"use client";

/** Lightweight placeholder for lazy-loaded sections. Preserves layout to avoid CLS. */
export default function SectionPlaceholder({
  minHeight = "min-h-[320px]",
}: {
  minHeight?: string;
}) {
  return (
    <div
      className={`w-full animate-pulse rounded-lg bg-muted/30 ${minHeight}`}
      aria-hidden
    />
  );
}
