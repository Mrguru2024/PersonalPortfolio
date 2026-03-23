import { Suspense } from "react";
import type { Metadata } from "next";
import ThankYouContent from "./ThankYouContent";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your request was received.",
  robots: { index: false, follow: true },
};

function ThankYouFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouContent />
    </Suspense>
  );
}
