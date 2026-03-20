import {
  resolveAscendraAccessRole,
  parseDataVisibilityTier,
  canAccessGrowthOsAdminPhase1,
} from "../accessScope";

describe("accessScope", () => {
  it("resolves PUBLIC for null user", () => {
    expect(resolveAscendraAccessRole(null)).toBe("PUBLIC");
  });

  it("resolves ADMIN for approved admin", () => {
    expect(
      resolveAscendraAccessRole({
        isAdmin: true,
        adminApproved: true,
        role: "user",
      }),
    ).toBe("ADMIN");
  });

  it("resolves INTERNAL_TEAM when internal_team permission set and not admin", () => {
    expect(
      resolveAscendraAccessRole({
        isAdmin: false,
        adminApproved: false,
        permissions: { internal_team: true },
      }),
    ).toBe("INTERNAL_TEAM");
  });

  it("resolves CLIENT for authenticated non-admin without internal_team", () => {
    expect(
      resolveAscendraAccessRole({
        id: 1,
        isAdmin: false,
        adminApproved: false,
        permissions: {},
      }),
    ).toBe("CLIENT");
  });

  it("parses visibility tiers", () => {
    expect(parseDataVisibilityTier("internal_only")).toBe("internal_only");
    expect(parseDataVisibilityTier("invalid")).toBeNull();
  });

  it("canAccessGrowthOsAdminPhase1 only for ADMIN tier", () => {
    expect(canAccessGrowthOsAdminPhase1({ isAdmin: true, adminApproved: true })).toBe(true);
    expect(canAccessGrowthOsAdminPhase1({ permissions: { internal_team: true } })).toBe(false);
  });
});
