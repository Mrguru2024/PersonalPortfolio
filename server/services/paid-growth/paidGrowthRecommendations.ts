import type { PpcLeadQuality } from "@shared/paidGrowthSchema";

/**
 * Guidance for admins from classified lead quality (reporting + future campaign tuning).
 */
export function leadQualityGuidanceFromRows(rows: PpcLeadQuality[]): string[] {
  const hints: string[] = [];
  if (rows.length === 0) {
    hints.push("Classify more PPC-attributed CRM contacts in Lead quality to sharpen CPQL and optimization signals.");
    return hints;
  }

  const valid = rows.filter((r) => r.leadValid && !r.spamFlag);
  const withFit = valid.filter((r) => r.fitScore != null);
  const avgFit =
    withFit.length > 0 ?
      Math.round(withFit.reduce((s, r) => s + (r.fitScore ?? 0), 0) / withFit.length)
    : null;

  const spamRate = rows.filter((r) => r.spamFlag).length / rows.length;
  if (spamRate > 0.15) {
    hints.push(
      `High spam or invalid rate (~${Math.round(spamRate * 100)}%) — tighten landing form validation and audience exclusions before scaling spend.`
    );
  }

  if (avgFit != null && avgFit < 5) {
    hints.push("Average fit score is low — revisit offer–audience match and lead magnet; consider narrowing geo or placements.");
  }

  const sold = valid.filter((r) => r.sold).length;
  const booked = valid.filter((r) => r.bookedCall).length;
  if (valid.length >= 5 && sold + booked === 0) {
    hints.push("Few booked calls or wins from recent classified leads — review sales follow-up and Communications enrollment.");
  }

  const recent = rows.slice(0, Math.min(10, rows.length));
  const recentAvg =
    recent.filter((r) => r.fitScore != null).length > 0 ?
      recent.reduce((s, r) => s + (r.fitScore ?? 0), 0) / recent.filter((r) => r.fitScore != null).length
    : null;
  const older = rows.slice(10, 20);
  const olderAvg =
    older.filter((r) => r.fitScore != null).length > 0 ?
      older.reduce((s, r) => s + (r.fitScore ?? 0), 0) / older.filter((r) => r.fitScore != null).length
    : null;
  if (recentAvg != null && olderAvg != null && recentAvg < olderAvg - 0.75) {
    hints.push("Lead quality trend is declining — pause broad targeting and rerun readiness before increasing budget.");
  }

  if (hints.length === 0) {
    hints.push("Lead quality signals look stable — keep logging fit, spam, and outcomes after each sales touch.");
  }

  return hints;
}
