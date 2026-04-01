import type { OfferValuationSettings } from "@shared/schema";
import type { AscendraAccessRole } from "@shared/accessScope";

export function canUseOfferValuation(
  settings: OfferValuationSettings,
  role: AscendraAccessRole,
): { allowed: boolean; reason?: string } {
  if (role === "ADMIN") return { allowed: true };
  if (role === "CLIENT" || role === "INTERNAL_TEAM") {
    const enabled =
      settings.clientAccessEnabled || settings.accessMode === "client_tool";
    if (!enabled) {
      return {
        allowed: false,
        reason: "Client access is currently disabled for this tool.",
      };
    }
    return { allowed: true };
  }
  if (settings.accessMode === "paid_tool" && settings.paidModeEnabled) {
    return {
      allowed: false,
      reason:
        "This tool is currently in paid mode and public access is not yet enabled.",
    };
  }
  const publicEnabled =
    settings.publicAccessEnabled || settings.accessMode === "lead_magnet";
  if (!publicEnabled) {
    return {
      allowed: false,
      reason: "Public offer audit is currently disabled.",
    };
  }
  return { allowed: true };
}

export function sanitizePersonaTag(persona: string | null | undefined): string {
  const clean = (persona || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return clean ? `persona_${clean}` : "";
}

