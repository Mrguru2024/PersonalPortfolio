import { isKnownSitePath, processAgentMessage } from "../adminAgentService";

describe("isKnownSitePath", () => {
  it("accepts static admin routes from the site directory", () => {
    expect(isKnownSitePath("/admin/analytics")).toBe(true);
    expect(isKnownSitePath("/admin/site-directory")).toBe(true);
  });

  it("accepts concrete paths under dynamic admin patterns", () => {
    expect(isKnownSitePath("/admin/crm/42")).toBe(true);
  });

  it("rejects unknown, unsafe, or bracket placeholder paths", () => {
    expect(isKnownSitePath("/admin/nonexistent-tool-xyz")).toBe(false);
    expect(isKnownSitePath("/blog/[slug]")).toBe(false);
    expect(isKnownSitePath("../admin")).toBe(false);
  });
});

describe("processAgentMessage without OpenAI", () => {
  it("returns navigate action for keyword intents when actions are allowed", async () => {
    const r = await processAgentMessage({
      message: "open analytics",
      canPerformActions: true,
      openaiAvailable: false,
    });
    expect(r.action).toEqual({ type: "navigate", url: "/admin/analytics" });
    expect(r.reply).toMatch(/\[.*\]\(\/admin\/analytics\)/);
  });

  it("omits action when actions are disabled", async () => {
    const r = await processAgentMessage({
      message: "open newsletters",
      canPerformActions: false,
      openaiAvailable: false,
    });
    expect(r.action).toBeUndefined();
    expect(r.reply).toMatch(/disabled|settings/i);
  });

  it("falls back to help when no intent matches", async () => {
    const r = await processAgentMessage({
      message: "asdfghjkl nonsense query zzzz",
      canPerformActions: true,
      openaiAvailable: false,
    });
    expect(r.action).toBeUndefined();
    expect(r.reply).toMatch(/not sure|site directory|refreshed/i);
  });
});
