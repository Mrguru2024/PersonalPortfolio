import {
  buildPersonalizedGreetingLine,
  emptyMentorState,
  firstNameFromUser,
  mentorStateToPromptBlock,
  parseStoredMentorState,
  shouldAttachWebSources,
} from "../adminAgentMentorService";

describe("shouldAttachWebSources", () => {
  it("returns false for short or pure navigation-style prompts", () => {
    expect(shouldAttachWebSources("open crm")).toBe(false);
    expect(shouldAttachWebSources("where is lead intake")).toBe(false);
    expect(shouldAttachWebSources("go to admin analytics")).toBe(false);
    expect(shouldAttachWebSources("hi")).toBe(false);
  });

  it("returns true for teaching / external fact questions", () => {
    expect(shouldAttachWebSources("What is OAuth 2.0 authorization code flow?")).toBe(true);
    expect(shouldAttachWebSources("Explain best practices for WCAG focus indicators")).toBe(true);
    expect(shouldAttachWebSources("How does GDPR define legitimate interest?")).toBe(true);
  });
});

describe("mentorStateToPromptBlock", () => {
  it("handles null state", () => {
    expect(mentorStateToPromptBlock(null)).toMatch(/No saved mentor profile/i);
  });

  it("includes non-empty arrays", () => {
    const s = emptyMentorState();
    s.painPoints.push("Juggling too many CRM follow-ups");
    s.goals.push("Ship weekly newsletter");
    expect(mentorStateToPromptBlock(s)).toMatch(/Pain points/);
    expect(mentorStateToPromptBlock(s)).toMatch(/CRM follow-ups/);
  });
});

describe("parseStoredMentorState", () => {
  it("accepts v1 objects", () => {
    const row = { v: 1, habits: ["Checks analytics Fridays"], painPoints: [] };
    const p = parseStoredMentorState(row);
    expect(p?.habits).toContain("Checks analytics Fridays");
  });

  it("rejects wrong version", () => {
    expect(parseStoredMentorState({ v: 2 })).toBeNull();
  });
});

describe("firstNameFromUser / greeting", () => {
  it("uses first token of full_name", () => {
    expect(firstNameFromUser({ full_name: "Alex Morgan", username: "am" })).toBe("Alex");
  });

  it("falls back to username", () => {
    expect(firstNameFromUser({ full_name: null, username: "pat" })).toBe("pat");
  });

  it("builds a greeting line with the name", () => {
    expect(buildPersonalizedGreetingLine("Sam")).toMatch(/^Good (morning|afternoon|evening), Sam/);
  });
});
