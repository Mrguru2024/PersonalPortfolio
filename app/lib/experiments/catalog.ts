export type ExperimentKey =
  | "strategy_call_messaging_v1"
  | "audit_form_cta_v1"
  | "strategy_call_submit_cta_v1";

export interface ExperimentDefinition {
  key: ExperimentKey;
  description: string;
  variants: readonly string[];
  defaultVariant: string;
}

export const EXPERIMENT_CATALOG: Record<ExperimentKey, ExperimentDefinition> = {
  strategy_call_messaging_v1: {
    key: "strategy_call_messaging_v1",
    description: "Test strategy-call hero messaging to improve form starts.",
    variants: ["control", "speed", "clarity"],
    defaultVariant: "control",
  },
  audit_form_cta_v1: {
    key: "audit_form_cta_v1",
    description: "Test audit form submit CTA copy for completion lift.",
    variants: ["control", "urgency", "value"],
    defaultVariant: "control",
  },
  strategy_call_submit_cta_v1: {
    key: "strategy_call_submit_cta_v1",
    description: "Test strategy call submit CTA emphasis.",
    variants: ["control", "book_now", "get_plan"],
    defaultVariant: "control",
  },
};

export function isExperimentKey(value: string): value is ExperimentKey {
  return Object.prototype.hasOwnProperty.call(EXPERIMENT_CATALOG, value);
}
