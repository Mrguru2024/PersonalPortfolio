import {
  PAID_CAMPAIGN_URLS,
  resolveCampaignLandingPath,
} from "../campaignRouting";

describe("campaign routing", () => {
  it("routes explicit persona query", () => {
    const target = resolveCampaignLandingPath({ persona: "contractor" });
    expect(target).toBe("/contractor-systems");
  });

  it("routes by utm campaign keywords", () => {
    const target = resolveCampaignLandingPath({
      utm_campaign: "startup-mvp-development",
    });
    expect(target).toBe("/startup-mvp-development");
  });

  it("routes by campaign source keywords", () => {
    const target = resolveCampaignLandingPath({
      utm_source: "local-business-google-ads",
    });
    expect(target).toBe("/local-business-growth");
  });

  it("returns null when no persona/campaign hint is provided", () => {
    const target = resolveCampaignLandingPath({
      utm_source: "newsletter",
      utm_medium: "email",
    });
    expect(target).toBeNull();
  });

  it("exposes ready-to-use paid campaign URL presets", () => {
    expect(PAID_CAMPAIGN_URLS.contractorGoogleAds).toContain("persona=contractor");
    expect(PAID_CAMPAIGN_URLS.localBusinessMetaAds).toContain(
      "utm_campaign=local-business-growth"
    );
    expect(PAID_CAMPAIGN_URLS.startupLinkedInAds).toContain(
      "utm_campaign=startup-mvp-development"
    );
  });
});

