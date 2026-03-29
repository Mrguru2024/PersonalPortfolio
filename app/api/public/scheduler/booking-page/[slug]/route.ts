import { NextRequest, NextResponse } from "next/server";
import {
  getPublicBookingPageBySlug,
  getSchedulingSettings,
  listSchedulingHostUsers,
} from "@server/services/schedulingService";
import { bookingPageThemeFromSettingsJson } from "@/lib/bookingPageTheme";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public-safe payload for conversion-focused booking pages (no admin secrets). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const slug = (await ctx.params).slug;
  const settings = await getSchedulingSettings();
  if (!settings.publicBookingEnabled) {
    return NextResponse.json({ error: "Booking disabled" }, { status: 403 });
  }
  const res = await getPublicBookingPageBySlug(slug);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 404 });

  const { page, bookingType } = res;
  const hostRows = await listSchedulingHostUsers();
  const hosts = hostRows.map((h) => ({
    id: h.id,
    username: h.username,
    displayName: h.full_name?.trim() || h.username,
  }));
  return NextResponse.json({
    enabled: true,
    timezone: settings.businessTimezone,
    aiAssistantEnabled: settings.aiAssistantEnabled,
    hosts,
    page: {
      slug: page.slug,
      title: page.title,
      shortDescription: page.shortDescription,
      bestForBullets: page.bestForBullets,
      hostMode: page.hostMode,
      fixedHostUserId: page.fixedHostUserId,
      locationType: page.locationType,
      paymentRequirement: page.paymentRequirement,
      depositCents: page.depositCents,
      confirmationMessage: page.confirmationMessage,
      postBookingNextSteps: page.postBookingNextSteps,
      redirectUrl: page.redirectUrl,
      formFieldsJson: page.formFieldsJson,
      bookingTypeId: page.bookingTypeId,
    },
    bookingType: {
      id: bookingType.id,
      name: bookingType.name,
      slug: bookingType.slug,
      durationMinutes: bookingType.durationMinutes,
      description: bookingType.description,
    },
    branding: bookingPageThemeFromSettingsJson(page.settingsJson),
  });
}
