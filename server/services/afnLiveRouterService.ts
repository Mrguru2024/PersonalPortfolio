/**
 * Timeline Live / group room provider router (Phase 9).
 * LiveKit (preferred) with Daily REST failover; Zoom Video SDK is env-detected but not server-provisioned here.
 */
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import {
  insertAfnLiveProviderLog,
  insertAfnLiveSession,
} from "@server/afnStorage";

export type AfnLiveProviderId = "livekit" | "daily" | "zoom_sdk" | "none";

export type TimelineLiveRoomResult = {
  provider: AfnLiveProviderId;
  sessionId?: number;
  roomUrl?: string | null;
  livekit?: { url: string; token: string; roomName: string };
  error?: string;
};

export function getAfnLiveProviderAvailability(): Record<AfnLiveProviderId, boolean> {
  const livekit = !!(
    process.env.LIVEKIT_URL &&
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET
  );
  const daily = !!process.env.DAILY_API_KEY;
  const zoomSdk = !!process.env.ZOOM_VIDEO_SDK_KEY;
  return {
    livekit,
    daily,
    zoom_sdk: zoomSdk,
    none: !livekit && !daily && !zoomSdk,
  };
}

export function pickTimelineLiveProvider(): AfnLiveProviderId {
  const a = getAfnLiveProviderAvailability();
  if (a.livekit) return "livekit";
  if (a.daily) return "daily";
  if (a.zoom_sdk) return "zoom_sdk";
  return "none";
}

function livekitHttpFromEnvUrl(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("wss://")) return `https://${t.slice(6)}`;
  if (t.startsWith("ws://")) return `http://${t.slice(5)}`;
  return t;
}

function livekitWsFromEnvUrl(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("https://")) return `wss://${t.slice(8)}`;
  if (t.startsWith("http://")) return `ws://${t.slice(7)}`;
  if (t.startsWith("wss://") || t.startsWith("ws://")) return t;
  return t.startsWith("ws") ? t : `wss://${t}`;
}

function makeRoomSlug(prefix: string, userId: number): string {
  const safe = `${prefix}-${userId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return safe.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}

async function logLive(
  entry: {
    userId: number;
    sessionId?: number | null;
    provider: string;
    eventType: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await insertAfnLiveProviderLog({
      userId: entry.userId,
      sessionId: entry.sessionId ?? null,
      provider: entry.provider,
      eventType: entry.eventType,
      message: entry.message,
      metadata: entry.metadata ?? null,
    });
  } catch {
    /* logging must not break room creation */
  }
}

async function tryLiveKitRoom(input: {
  title: string;
  userId: number;
  roomName: string;
}): Promise<TimelineLiveRoomResult | null> {
  const host = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!host || !apiKey || !apiSecret) return null;

  const httpUrl = livekitHttpFromEnvUrl(host);
  const wsUrl = livekitWsFromEnvUrl(host);
  const client = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  await client.createRoom({
    name: input.roomName,
    emptyTimeout: 300,
    maxParticipants: 50,
  });

  const token = new AccessToken(apiKey, apiSecret, {
    identity: String(input.userId),
    name: input.title.slice(0, 80),
  });
  token.addGrant({
    room: input.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  const jwt = await token.toJwt();

  const session = await insertAfnLiveSession({
    hostUserId: input.userId,
    sessionKind: "timeline_live",
    provider: "livekit",
    roomName: input.roomName,
    title: input.title,
    joinUrl: null,
    livekitWsUrl: wsUrl,
    livekitToken: jwt,
    status: "created",
    metadata: { roomName: input.roomName },
    updatedAt: new Date(),
  });

  await logLive({
    userId: input.userId,
    sessionId: session.id,
    provider: "livekit",
    eventType: "room_created",
    message: "LiveKit room created",
    metadata: { roomName: input.roomName },
  });

  return {
    provider: "livekit",
    sessionId: session.id,
    livekit: { url: wsUrl, token: jwt, roomName: input.roomName },
  };
}

async function tryDailyRoom(input: {
  title: string;
  userId: number;
  roomName: string;
}): Promise<TimelineLiveRoomResult | null> {
  const apiKey = process.env.DAILY_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.roomName,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 4 * 3600,
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 40,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(txt || `Daily HTTP ${res.status}`);
  }

  const data = (await res.json()) as { url?: string; name?: string; id?: string };
  const roomUrl = data.url ?? null;

  const session = await insertAfnLiveSession({
    hostUserId: input.userId,
    sessionKind: "timeline_live",
    provider: "daily",
    externalRoomId: data.id ?? null,
    roomName: data.name ?? input.roomName,
    title: input.title,
    joinUrl: roomUrl,
    livekitWsUrl: null,
    livekitToken: null,
    status: "created",
    metadata: { daily: { id: data.id, name: data.name } },
    updatedAt: new Date(),
  });

  await logLive({
    userId: input.userId,
    sessionId: session.id,
    provider: "daily",
    eventType: "room_created",
    message: "Daily room created",
    metadata: { roomName: data.name },
  });

  return {
    provider: "daily",
    sessionId: session.id,
    roomUrl,
  };
}

/**
 * Creates a host session: tries LiveKit, then Daily. Logs failover attempts.
 */
export async function createTimelineLiveRoom(input: {
  title: string;
  userId: number;
}): Promise<TimelineLiveRoomResult> {
  const availability = getAfnLiveProviderAvailability();
  if (availability.none) {
    return { provider: "none", roomUrl: null, error: "Live providers not configured" };
  }

  const roomName = makeRoomSlug("afn-tl", input.userId);

  if (availability.zoom_sdk && !availability.livekit && !availability.daily) {
    await logLive({
      userId: input.userId,
      provider: "zoom_sdk",
      eventType: "unsupported",
      message: "Zoom Video SDK is detected but server-side room provisioning uses LiveKit or Daily",
    });
    return {
      provider: "zoom_sdk",
      roomUrl: null,
      error: "Configure LIVEKIT_* or DAILY_API_KEY for server-provisioned Timeline Live rooms",
    };
  }

  if (availability.livekit) {
    try {
      const ok = await tryLiveKitRoom({ ...input, roomName });
      if (ok) return ok;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logLive({
        userId: input.userId,
        provider: "livekit",
        eventType: "failure",
        message: msg.slice(0, 2000),
      });
    }
  }

  if (availability.daily) {
    try {
      const ok = await tryDailyRoom({ ...input, roomName: makeRoomSlug("afn-tl", input.userId) });
      if (ok) return ok;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logLive({
        userId: input.userId,
        provider: "daily",
        eventType: "failure",
        message: msg.slice(0, 2000),
      });
    }
  }

  return {
    provider: pickTimelineLiveProvider(),
    roomUrl: null,
    error: "Could not provision a live room — check provider credentials and logs (afn_live_provider_logs)",
  };
}
