import { assignExperiments } from "@/lib/experiments/assignment";

describe("experiment assignment", () => {
  it("returns deterministic variants for the same visitor", () => {
    const first = assignExperiments(
      ["strategy_call_messaging_v1", "audit_form_cta_v1"],
      "visitor_123"
    );
    const second = assignExperiments(
      ["strategy_call_messaging_v1", "audit_form_cta_v1"],
      "visitor_123"
    );
    expect(first.strategy_call_messaging_v1.variant).toBe(
      second.strategy_call_messaging_v1.variant
    );
    expect(first.audit_form_cta_v1.variant).toBe(
      second.audit_form_cta_v1.variant
    );
  });

  it("returns one of the declared variants", () => {
    const assignment = assignExperiments(
      ["strategy_call_submit_cta_v1"],
      "visitor_abc"
    );
    expect(["control", "book_now", "get_plan"]).toContain(
      assignment.strategy_call_submit_cta_v1.variant
    );
  });
});
