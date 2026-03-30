import { behaviorIngestPayloadSchema } from "../behaviorIngestPayload";

describe("behaviorIngestPayloadSchema", () => {
  it("accepts minimal payload", () => {
    const p = behaviorIngestPayloadSchema.parse({
      sessionId: "sess_12345678",
      events: [{ eventType: "page_view", timestamp: Date.now() }],
    });
    expect(p.sessionId).toBe("sess_12345678");
    expect(p.events).toHaveLength(1);
  });

  it("rejects oversized session id", () => {
    expect(() =>
      behaviorIngestPayloadSchema.parse({
        sessionId: "x".repeat(200),
        events: [],
      }),
    ).toThrow();
  });
});
