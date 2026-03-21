/**
 * Groups internal audit runs with Growth OS / Content Studio rows in the DB.
 * Single-tenant deployments use this default; change only for a custom multi-workspace setup.
 */
export const DEFAULT_INTERNAL_AUDIT_PROJECT_KEY = "ascendra_main";

export function workspaceLabelForProjectKey(key: string): string {
  if (key === DEFAULT_INTERNAL_AUDIT_PROJECT_KEY) return "This workspace";
  return key;
}
