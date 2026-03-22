/**
 * Seed example PPC campaign drafts (Ascendra OS Paid Growth).
 * Run: npx tsx scripts/seed-paid-growth.ts
 */
import { storage } from "../server/storage";

async function main() {
  const existing = await storage.listPpcCampaigns();
  if (existing.length > 0) {
    console.log(`Skipping: ${existing.length} PPC campaign(s) already exist.`);
    return;
  }

  const drafts = [
    {
      name: "Marcus local service — Google Search (draft)",
      platform: "google_ads" as const,
      objective: "leads",
      clientLabel: "Internal — Marcus persona",
      offerSlug: null as string | null,
      landingPagePath: "/local-business-growth",
      personaId: "local_business_owner",
      trackingParamsJson: { utm_source: "google", utm_medium: "cpc", utm_campaign: "marcus_search_draft" },
      adCopyJson: { headline: "Local growth without guesswork", primaryText: "Systems-first positioning for service brands." },
    },
    {
      name: "Tasha promo — Meta (draft)",
      platform: "meta" as const,
      objective: "traffic",
      clientLabel: "Promo test",
      offerSlug: null,
      landingPagePath: "/launch-your-brand",
      personaId: "creative_entrepreneur",
      trackingParamsJson: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "tasha_promo_draft" },
      adCopyJson: { headline: "Launch-ready brand kit", primaryText: "Positioning + site path for creative founders." },
    },
    {
      name: "Kristopher — consultation offer (draft)",
      platform: "meta" as const,
      objective: "leads",
      clientLabel: "Consultation funnel",
      offerSlug: null,
      landingPagePath: "/rebrand-your-business",
      personaId: "consultant_expert",
      trackingParamsJson: { utm_source: "meta", utm_medium: "cpc", utm_campaign: "kristopher_consult_draft" },
      adCopyJson: { headline: "Rebrand with revenue clarity", primaryText: "Offer + funnel alignment for consultants." },
    },
    {
      name: "Devon — validation landing (draft)",
      platform: "google_ads" as const,
      objective: "traffic",
      clientLabel: "Technical validation",
      offerSlug: null,
      landingPagePath: "/startup-mvp-development",
      personaId: "technical_founder",
      trackingParamsJson: { utm_source: "google", utm_medium: "cpc", utm_campaign: "devon_validation_draft" },
      adCopyJson: { headline: "Ship MVPs without tech debt", primaryText: "Architecture-first builds for serious founders." },
    },
  ];

  for (const d of drafts) {
    const row = await storage.createPpcCampaign({
      name: d.name,
      clientLabel: d.clientLabel,
      platform: d.platform,
      objective: d.objective,
      status: "draft",
      offerSlug: d.offerSlug,
      landingPagePath: d.landingPagePath,
      thankYouPath: null,
      personaId: d.personaId,
      locationTargetingJson: { countries: ["US"] },
      budgetDailyCents: 500,
      scheduleJson: {},
      adCopyJson: d.adCopyJson,
      creativeAssetUrls: [],
      trackingParamsJson: d.trackingParamsJson,
      commCampaignId: null,
      ppcAdAccountId: null,
      publishPausedDefault: true,
      notes: "Seeded draft — attach real offer slugs and accounts before publish.",
      createdBy: null,
    });
    console.log("Created", row.id, row.name);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
