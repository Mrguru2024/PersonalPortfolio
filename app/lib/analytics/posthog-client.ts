"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHogClient(distinctId?: string): void {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey || initialized) return;

  posthog.init(apiKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    loaded: (instance) => {
      if (distinctId) instance.identify(distinctId);
    },
  });
  initialized = true;
}

export function getPostHogClient() {
  return posthog;
}
