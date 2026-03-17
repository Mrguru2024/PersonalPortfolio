/**
 * Stage 4: Workflow automation — public API.
 */

export { fireWorkflows, getPrimaryEntity, buildPayloadFromContactId, buildPayloadFromDealId } from "./engine";
export type { FireOptions } from "./engine";
export { getWorkflowsByTrigger, getAllWorkflows } from "./registry";
export { runStaleCheck } from "./staleCheck";
export type { StaleCheckResult, StaleCheckOptions } from "./staleCheck";
export type { WorkflowTriggerType, WorkflowActionType, WorkflowDefinition, WorkflowPayload } from "./types";
