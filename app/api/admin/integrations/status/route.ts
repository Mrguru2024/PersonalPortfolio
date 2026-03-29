import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { isZoomConfigured } from "@/lib/zoom";
import {
  isGoogleCalendarConnectedForUser,
  isGoogleCalendarLegacyConnected,
  isGoogleCalendarOAuthConfigured,
  isGoogleCalendarPersonalConnected,
} from "@server/services/googleCalendarSchedulingService";
import type { ContentStudioSocialPayload, IntegrationStatus } from "../types";
import { MAX_SOCIAL_CONNECTIONS_PER_PLATFORM } from "@server/lib/contentStudioSocialConstants";
import {
  hasFacebookPagePublishConfig,
  hasLinkedInPublishConfig,
  hasThreadsPublishConfig,
  hasXPublishConfig,
  hasWebhookPublishConfig,
} from "@server/services/internalStudio/publishAdapters";
import {
  getFacebookOAuthRedirectUri,
  isContentStudioFacebookOAuthConnected,
  isFacebookAppConfiguredForOAuth,
  listFacebookAccountSummaries,
} from "@server/services/contentStudioFacebookConnectService";
import {
  getLinkedInOAuthRedirectUri,
  isContentStudioLinkedInOAuthConnected,
  isLinkedInOAuthAppConfigured,
  listLinkedInAccountSummaries,
} from "@server/services/contentStudioLinkedInConnectService";
import {
  getThreadsOAuthRedirectUri,
  isContentStudioThreadsOAuthConnected,
  isThreadsOAuthConfigured,
  listThreadsAccountSummaries,
} from "@server/services/contentStudioThreadsConnectService";
import {
  getXOAuthRedirectUri,
  isContentStudioXOAuthConnected,
  isXOAuthAppConfigured,
  listXAccountSummaries,
} from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";

/** @deprecated Use ContentStudioSocialPayload from ../types */
export type ContentStudioSocialFlags = ContentStudioSocialPayload;

/**
 * GET /api/admin/integrations/status
 * Approved admin only. Returns status of each integrated service (env/config only; no live API calls).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 }
      );
    }

    const gcalEnv = isGoogleCalendarOAuthConfigured();
    const sessionUser = await getSessionUser(req);
    const gcalUserId = sessionUser?.id != null ? Number(sessionUser.id) : NaN;
    const gcalUid = Number.isFinite(gcalUserId) && gcalUserId > 0 ? gcalUserId : 0;
    const gcalPersonal = gcalUid > 0 ? await isGoogleCalendarPersonalConnected(gcalUid) : false;
    const gcalLegacy = await isGoogleCalendarLegacyConnected();
    const gcalConnected = gcalUid > 0 ? await isGoogleCalendarConnectedForUser(gcalUid) : gcalLegacy;

    const baseUrl = getOAuthBaseUrlFromRequest(req);
    const [
      facebookPage,
      facebookOAuthConnected,
      facebookAccounts,
      linkedinOk,
      linkedinOAuthConnected,
      linkedinAccounts,
      xOk,
      xOAuthConnected,
      xAccounts,
      threadsOk,
      threadsOAuthConnected,
      threadsAccounts,
    ] = await Promise.all([
      hasFacebookPagePublishConfig(),
      isContentStudioFacebookOAuthConnected(),
      listFacebookAccountSummaries(),
      hasLinkedInPublishConfig(),
      isContentStudioLinkedInOAuthConnected(),
      listLinkedInAccountSummaries(),
      hasXPublishConfig(),
      isContentStudioXOAuthConnected(),
      listXAccountSummaries(),
      hasThreadsPublishConfig(),
      isContentStudioThreadsOAuthConnected(),
      listThreadsAccountSummaries(),
    ]);
    const facebookOAuthAvailable = isFacebookAppConfiguredForOAuth();
    const facebookContentStudioRedirectUri = getFacebookOAuthRedirectUri(baseUrl);
    const linkedinOAuthAvailable = isLinkedInOAuthAppConfigured();
    const linkedinContentStudioRedirectUri = getLinkedInOAuthRedirectUri(baseUrl);
    const xOAuthAvailable = isXOAuthAppConfigured();
    const xContentStudioRedirectUri = getXOAuthRedirectUri(baseUrl);
    const threadsOAuthAvailable = isThreadsOAuthConfigured();
    const threadsContentStudioRedirectUri = getThreadsOAuthRedirectUri(baseUrl);

    const max = MAX_SOCIAL_CONNECTIONS_PER_PLATFORM;

    const contentStudioSocial: ContentStudioSocialPayload = {
      facebookPage,
      facebookOAuthConnected,
      facebookOAuthAvailable,
      facebookAccounts,
      facebookMaxConnections: max,
      facebookCanAddConnection: facebookOAuthAvailable && facebookAccounts.length < max,
      facebookContentStudioRedirectUri,
      linkedin: linkedinOk,
      linkedinOAuthConnected,
      linkedinOAuthAvailable,
      linkedinAccounts,
      linkedinMaxConnections: max,
      linkedinCanAddConnection: linkedinOAuthAvailable && linkedinAccounts.length < max,
      linkedinContentStudioRedirectUri,
      x: xOk,
      xOAuthConnected,
      xOAuthAvailable,
      xAccounts,
      xMaxConnections: max,
      xCanAddConnection: xOAuthAvailable && xAccounts.length < max,
      xContentStudioRedirectUri,
      threads: threadsOk,
      threadsOAuthConnected,
      threadsOAuthAvailable,
      threadsAccounts,
      threadsMaxConnections: max,
      threadsCanAddConnection: threadsOAuthAvailable && threadsAccounts.length < max,
      threadsContentStudioRedirectUri,
      webhook: hasWebhookPublishConfig(),
    };
    const socialChannels = [
      contentStudioSocial.facebookPage ? "Facebook Page" : null,
      contentStudioSocial.linkedin ? "LinkedIn" : null,
      contentStudioSocial.x ? "X" : null,
      contentStudioSocial.threads ? "Threads" : null,
      contentStudioSocial.webhook ? "Webhook hub" : null,
    ].filter((x): x is string => x != null);
    const socialAny = socialChannels.length > 0;

    const services: IntegrationStatus[] = [
      {
        id: "facebook",
        name: "Facebook login",
        description: "Lets people sign in with Facebook where your site uses it.",
        configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        status: process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET ? "ok" : "not_configured",
        message: process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
          ? `Looks good (app starts with ${String(process.env.FACEBOOK_APP_ID).slice(0, 8)}…).`
          : "Add your Meta app ID and secret in the site’s settings.",
        reconnectUrl: "https://developers.facebook.com/apps/",
      },
      {
        id: "brevo",
        name: "Email (Brevo)",
        description: "Sends booking emails, contact form mail, and newsletters.",
        configured: !!process.env.BREVO_API_KEY,
        status: process.env.BREVO_API_KEY ? "ok" : "not_configured",
        message: process.env.BREVO_API_KEY
          ? "Email sending is configured."
          : "Add your Brevo key in the site’s settings.",
        reconnectUrl: "https://app.brevo.com/settings/keys/api",
      },
      {
        id: "zoom",
        name: "Zoom meetings",
        description: "Create and open Zoom meetings from lead profiles in the CRM.",
        configured: isZoomConfigured(),
        status: isZoomConfigured() ? "ok" : "not_configured",
        message: isZoomConfigured()
          ? "Zoom is connected."
          : "Add your Zoom app details in the site’s settings (Zoom Marketplace → build a server app).",
        reconnectUrl: "https://marketplace.zoom.us/",
      },
      {
        id: "social-scheduling",
        name: "Scheduled social posts",
        description:
          "Content Studio can post to Facebook Pages, LinkedIn, X, or Threads from the calendar. Separate from the Facebook login item above.",
        configured: socialAny,
        status: socialAny ? "ok" : "not_configured",
        message: socialAny
          ? `Ready for: ${socialChannels.join(", ")}. On the calendar, pick the channel that matches each post.`
          : "Connect a social account below, or add keys in the site’s settings.",
        reconnectUrl: "https://developers.facebook.com/docs/pages-api/posts",
      },
      {
        id: "google_calendar",
        name: "Google Calendar sync",
        description:
          "When someone books on your site, an event can appear on your Google Calendar.",
        configured: gcalEnv && gcalConnected,
        status: gcalConnected ? "ok" : gcalEnv ? "not_configured" : "not_configured",
        message: gcalConnected
          ? gcalPersonal
            ? "Your calendar is connected — bookings you host sync to your Google Calendar."
            : gcalLegacy
              ? "A shared site calendar is connected. Connect your own so bookings you host use your Google Calendar."
              : "Connected — new bookings will show on your calendar."
          : gcalEnv
            ? "Almost there — click “Connect Google Calendar” (each admin connects their own)."
            : "Add your Google Calendar app details in the site’s settings, then connect here.",
        reconnectUrl: "https://console.cloud.google.com/apis/credentials",
        connectHref: gcalEnv && !gcalPersonal ? "/api/admin/integrations/google-calendar/start" : undefined,
      },
      {
        id: "calendly",
        name: "Calendly (optional)",
        description: "Optional link or future hook to Calendly alongside native booking.",
        configured: !!process.env.CALENDLY_API_TOKEN?.trim(),
        status: process.env.CALENDLY_API_TOKEN?.trim() ? "ok" : "not_configured",
        message: process.env.CALENDLY_API_TOKEN?.trim()
          ? "Calendly token is saved."
          : "Optional — only if you use Calendly with this site.",
        reconnectUrl: "https://calendly.com/integrations/api_webhooks",
      },
    ];

    return NextResponse.json({ services, contentStudioSocial });
  } catch (error) {
    console.error("Integrations status error:", error);
    return NextResponse.json(
      { message: "Could not load integration status. Try again." },
      { status: 500 }
    );
  }
}
