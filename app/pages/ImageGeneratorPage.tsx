"use client";

import ImageGenerator from "@/components/ImageGenerator";

export default function ImageGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate images</h1>
        <p className="text-muted-foreground">
          Create images from text prompts using AI. Sign in to use.
        </p>
      </div>
      <ImageGenerator />
    </div>
  );
}
