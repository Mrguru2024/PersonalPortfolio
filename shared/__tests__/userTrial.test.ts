import {
  buildTrialSummaryForClient,
  defaultClientTrialWindow,
  DEFAULT_CLIENT_TRIAL_DAYS,
} from "../userTrial";

describe("userTrial", () => {
  it("defaultClientTrialWindow spans configured days", () => {
    const { trialStartedAt, trialEndsAt } = defaultClientTrialWindow(14);
    const ms = trialEndsAt.getTime() - trialStartedAt.getTime();
    const days = ms / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(13.9);
    expect(days).toBeLessThanOrEqual(14.1);
  });

  it("buildTrialSummaryForClient hides banner for approved admins", () => {
    const s = buildTrialSummaryForClient({
      trialEndsAt: new Date(Date.now() + 86400000),
      isAdmin: true,
      adminApproved: true,
    });
    expect(s.showBanner).toBe(false);
    expect(s.active).toBe(false);
  });

  it("buildTrialSummaryForClient hides banner for pending admins (no trial UX)", () => {
    const s = buildTrialSummaryForClient({
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 86400000),
      isAdmin: true,
      adminApproved: false,
    });
    expect(s.showBanner).toBe(false);
    expect(s.active).toBe(false);
  });

  it("buildTrialSummaryForClient shows active trial for client accounts", () => {
    const ends = new Date(Date.now() + 3 * 86_400_000);
    const s = buildTrialSummaryForClient({
      trialStartedAt: new Date(),
      trialEndsAt: ends,
      isAdmin: false,
      adminApproved: false,
    });
    expect(s.showBanner).toBe(true);
    expect(s.active).toBe(true);
    expect(s.daysRemaining).toBeGreaterThanOrEqual(3);
  });

  it("buildTrialSummaryForClient no banner when no trial end date", () => {
    const s = buildTrialSummaryForClient({
      isAdmin: false,
      trialEndsAt: null,
    });
    expect(s.showBanner).toBe(false);
  });

  it("buildTrialSummaryForClient tolerates invalid trial end date (no throw)", () => {
    const s = buildTrialSummaryForClient({
      isAdmin: false,
      trialEndsAt: "not-a-date",
    });
    expect(s.showBanner).toBe(false);
    expect(s.endsAt).toBe(null);
  });

  it("exports default duration constant", () => {
    expect(DEFAULT_CLIENT_TRIAL_DAYS).toBe(14);
  });
});
