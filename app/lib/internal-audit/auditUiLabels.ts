import type { ImplPriority, StrengthState } from "@/lib/internal-audit/leadAuditCategories";

export function strengthStateLabel(s: StrengthState | string): string {
  switch (s) {
    case "strength":
      return "Strong";
    case "weakness":
      return "Needs work";
    case "mixed":
      return "Mixed";
    default:
      return "Not rated";
  }
}

export function priorityLabel(p: ImplPriority | string): string {
  switch (p) {
    case "p0":
      return "Urgent";
    case "p1":
      return "High";
    case "p2":
      return "Medium";
    case "p3":
      return "Lower";
    default:
      return String(p);
  }
}
