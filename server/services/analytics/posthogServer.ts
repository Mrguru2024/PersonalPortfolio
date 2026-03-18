import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

function getProjectApiKey(): string | null {
  return process.env.POSTHOG_API_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null;
}

function getPosthogHost(): string {
  return process.env.POSTHOG_HOST?.trim() || process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

function getPosthogClient(): PostHog | null {
  const apiKey = getProjectApiKey();
  if (!apiKey) return null;
  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: getPosthogHost(),
      flushAt: 20,
      flushInterval: 5000,
    });
  }
  return posthogClient;
}

export async function captureServerTrackingEvent(input: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const client = getPosthogClient();
  if (!client) return;
  await client.capture({
    distinctId: input.distinctId,
    event: input.event,
    properties: input.properties ?? {},
  });
}

export async function getPosthogFeatureFlagVariant(
  featureKey: string,
  distinctId: string
): Promise<string | boolean | null> {
  const client = getPosthogClient();
  if (!client) return null;
  try {
    const value = await client.getFeatureFlag(featureKey, distinctId);
    return value ?? null;
  } catch {
    return null;
  }
}
