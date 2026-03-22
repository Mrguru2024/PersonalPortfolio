import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { getPipelineStageLabel } from "@/lib/crm-pipeline-stages";

/** Plain-language lines for admins (no JSON). */
export function describeCommSegmentFilters(f: CommSegmentFilters | null | undefined): string[] {
  if (!f || typeof f !== "object") return ["No audience rules set."];
  const lines: string[] = [];

  if (f.contactIds && f.contactIds.length > 0) {
    lines.push(`Specific contacts: ${f.contactIds.length} selected (IDs: ${f.contactIds.slice(0, 8).join(", ")}${f.contactIds.length > 8 ? "…" : ""})`);
  }
  if (f.type) lines.push(`Contact type: ${f.type}`);
  if (f.status) lines.push(`Status: ${f.status}`);
  if (f.intentLevel) lines.push(`Intent: ${f.intentLevel.replace(/_/g, " ")}`);
  if (f.source) lines.push(`Source: ${f.source}`);
  if (f.lifecycleStage) lines.push(`Lifecycle: ${f.lifecycleStage}`);
  if (f.pipelineStage) lines.push(`Deal pipeline stage: ${getPipelineStageLabel(f.pipelineStage)}`);
  if (f.tags && f.tags.length) lines.push(`Tags (any match): ${f.tags.join(", ")}`);
  if (f.noContactSinceDays != null) lines.push(`No activity for at least ${f.noContactSinceDays} days`);
  if (f.hasOpenTasks) lines.push("Has open CRM tasks");
  if (f.hasResearch === true) lines.push("Account has research profile");
  if (f.hasResearch === false) lines.push("Account has no research profile");
  if (f.excludeDoNotContact === false) lines.push("Includes do-not-contact leads");
  else if (f.excludeDoNotContact !== undefined) lines.push("Excludes do-not-contact leads");
  if (f.utmSource) lines.push(`UTM source (match): ${f.utmSource}`);
  if (f.utmMedium) lines.push(`UTM medium (match): ${f.utmMedium}`);
  if (f.utmCampaign) lines.push(`UTM campaign (match): ${f.utmCampaign}`);
  if (f.personaId) lines.push(`Marketing persona ID: ${f.personaId}`);
  if (f.bookedCall === true) lines.push("Booked a call");
  if (f.bookedCall === false) lines.push("Has not booked a call");
  if (f.serviceInterestContains?.trim()) lines.push(`Service interest contains: “${f.serviceInterestContains.trim()}”`);

  if (lines.length === 0) return ["No audience rules set."];
  return lines;
}
