/**
 * Simple merge tags for transactional email HTML/text/subject lines.
 * Supports {{Name}}, {{name}}, {{firstName}}, {{company}}, {{email}} (spacing inside braces allowed).
 */

export type EmailMergeFields = {
  email: string;
  firstName?: string | null;
  name?: string | null;
  company?: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Friendly display name when there is no CRM row (uses the part before @). */
export function mergeFieldsFromEmailOnly(email: string): EmailMergeFields {
  const e = email.trim().toLowerCase();
  const local = e.split("@")[0] || "there";
  const words = local.replace(/[.+_-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const titleCase = (w: string) =>
    w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const full = words.map(titleCase).join(" ") || "there";
  const first = words.length > 0 ? titleCase(words[0]) : full;
  return { email: e, firstName: first, name: full, company: null };
}

export function mergeFieldsFromCrmContact(
  email: string,
  contact: { firstName?: string | null; name: string; company?: string | null }
): EmailMergeFields {
  return {
    email: email.trim().toLowerCase(),
    firstName: contact.firstName,
    name: contact.name,
    company: contact.company,
  };
}

export function applyEmailMergeTags(
  text: string,
  fields: EmailMergeFields,
  opts?: { htmlEscape?: boolean }
): string {
  if (!text) return text;
  const esc = (s: string) => (opts?.htmlEscape ? escapeHtml(s) : s);

  const rawFirst =
    (fields.firstName?.trim() ||
      (fields.name?.trim() || "").split(/\s+/)[0] ||
      mergeFieldsFromEmailOnly(fields.email).firstName) ??
    "there";
  const rawName =
    (fields.name?.trim() || fields.firstName?.trim() || rawFirst || mergeFieldsFromEmailOnly(fields.email).name) ??
    "there";
  const rawCompany = (fields.company?.trim() || "").length > 0 ? fields.company!.trim() : "your team";
  const rawEmail = fields.email.trim().toLowerCase();

  const escFirst = esc(rawFirst);
  const escName = esc(rawName);
  const escCompany = esc(rawCompany);
  const escMail = esc(rawEmail);

  const replaceAliasGroup = (src: string, aliases: string[], value: string) => {
    const inner = aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const re = new RegExp(`\\{\\{\\s*(?:${inner})\\s*\\}\\}`, "gi");
    return src.replace(re, value);
  };

  let out = text;
  out = replaceAliasGroup(out, ["firstName", "firstname", "FirstName", "FIRSTNAME"], escFirst);
  out = replaceAliasGroup(out, ["name", "NAME"], escName);
  out = replaceAliasGroup(out, ["company", "COMPANY"], escCompany);
  out = replaceAliasGroup(out, ["email", "EMAIL"], escMail);
  return out;
}
