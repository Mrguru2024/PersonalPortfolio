// Push Notification Service using Web Push API (web-push)

import * as webpush from "web-push";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

export class PushNotificationService {
  private vapidPublicKey: string | null;
  private vapidPrivateKey: string | null;
  private isConfigured: boolean;

  constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || null;
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || null;
    this.isConfigured = !!(this.vapidPublicKey && this.vapidPrivateKey);

    if (this.isConfigured) {
      webpush.setVapidDetails(
        "mailto:" + (process.env.ADMIN_EMAIL || "admin@localhost"),
        this.vapidPublicKey,
        this.vapidPrivateKey!
      );
    } else {
      console.warn(
        "⚠️  VAPID keys not found. Push notifications will be disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. Generate: npx web-push generate-vapid-keys"
      );
    }
  }

  async sendNotification(
    subscription: PushSubscriptionPayload,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      };
      const payloadStr = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
      });
      await webpush.sendNotification(pushSubscription, payloadStr);
      return true;
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.warn("Push subscription expired or invalid:", subscription.endpoint);
      } else {
        console.error("Error sending push notification:", error);
      }
      return false;
    }
  }

  /** Send to multiple subscriptions; returns count of successful sends. */
  async sendToSubscriptions(
    subscriptions: PushSubscriptionPayload[],
    payload: PushNotificationPayload
  ): Promise<number> {
    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await this.sendNotification(sub, payload);
      if (ok) sent++;
    }
    return sent;
  }

  getPublicKey(): string | null {
    return this.vapidPublicKey;
  }
}

export const pushNotificationService = new PushNotificationService();
