"use client";

import SectionPlaceholder from "@/components/SectionPlaceholder";

/** Rendered when a lazy section chunk fails to load (ChunkLoadError). Preserves layout. */
export default function SectionLoadErrorFallback({
  sectionName = "section",
  minHeight = "min-h-[380px]",
}: {
  sectionName?: string;
  minHeight?: string;
}) {
  return (
    <section
      className="w-full py-16 md:py-20"
      aria-label={`${sectionName} (unavailable)`}
    >
      <div className="container mx-auto px-4">
        <SectionPlaceholder minHeight={minHeight} />
      </div>
    </section>
  );
}
