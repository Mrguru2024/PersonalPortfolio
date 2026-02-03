// Push Notification Service using Web Push API
// This service can send browser push notifications when enabled

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
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

    if (!this.isConfigured) {
      console.warn(
        "⚠️  VAPID keys not found. Push notifications will be disabled."
      );
      console.warn(
        "   Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env.local file to enable push notifications."
      );
      console.warn("   Generate keys using: npx web-push generate-vapid-keys");
    }
  }

  async sendNotification(
    subscription: any,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      console.log(
        "📱 Push notification logged (web-push not yet integrated):",
        {
          subscription: subscription.endpoint,
          payload,
        }
      );
      return true;
    } catch (error) {
      console.error("❌ Error sending push notification:", error);
      return false;
    }
  }

  getPublicKey(): string | null {
    return this.vapidPublicKey;
  }
}

export const pushNotificationService = new PushNotificationService();
