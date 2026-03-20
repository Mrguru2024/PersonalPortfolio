import { processAgentMessage } from "./adminAgentService";

describe("processAgentMessage", () => {
  it("recognizes natural language navigation for newer admin sections", async () => {
    const result = await processAgentMessage({
      message: "open content studio",
      canPerformActions: true,
      currentPath: "/admin/dashboard",
    });

    expect(result.action).toEqual(
      expect.objectContaining({
        type: "navigate",
        url: "/admin/content-studio",
      }),
    );
    expect(result.reply.toLowerCase()).toContain("opening");
  });

  it("recognizes slash command navigation", async () => {
    const result = await processAgentMessage({
      message: "/open crm pipeline",
      canPerformActions: true,
      currentPath: "/admin/dashboard",
    });

    expect(result.action).toEqual(
      expect.objectContaining({
        type: "navigate",
        url: "/admin/crm/pipeline",
      }),
    );
  });

  it("answers command/capability questions with suggestions", async () => {
    const result = await processAgentMessage({
      message: "what can you do?",
      canPerformActions: true,
      currentPath: "/admin/dashboard",
    });

    expect(result.action).toBeUndefined();
    expect(result.reply.toLowerCase()).toContain("slash commands");
    expect(result.suggestions?.length).toBeGreaterThan(0);
  });

  it("answers current-location question using currentPath", async () => {
    const result = await processAgentMessage({
      message: "where am I?",
      canPerformActions: true,
      currentPath: "/admin/growth-os/intelligence",
    });

    expect(result.action).toBeUndefined();
    expect(result.reply).toContain("/admin/growth-os/intelligence");
    expect(result.reply).toContain("Growth OS intelligence");
  });

  it("returns action-disabled guidance when actions are not allowed", async () => {
    const result = await processAgentMessage({
      message: "open reminders",
      canPerformActions: false,
      currentPath: "/admin/dashboard",
    });

    expect(result.action).toBeUndefined();
    expect(result.reply.toLowerCase()).toContain("performing actions is disabled");
  });

  it("recognizes reminder generation command", async () => {
    const result = await processAgentMessage({
      message: "generate reminders",
      canPerformActions: true,
      currentPath: "/admin/dashboard",
    });

    expect(result.action).toEqual(
      expect.objectContaining({
        type: "generate_reminders",
        api: "POST /api/admin/reminders",
      }),
    );
  });
});
