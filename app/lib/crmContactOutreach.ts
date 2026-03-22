/** Digits suitable for tel:/sms: (preserves leading +). */
export function dialStringFromPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return "";
  const t = phone.trim();
  if (t.startsWith("+")) return `+${t.slice(1).replace(/\D/g, "")}`;
  return t.replace(/\D/g, "");
}

export function mailtoLeadHref(email: string): string | null {
  const e = email.trim();
  return e ? `mailto:${e}` : null;
}

export function telHref(phone: string | null | undefined): string | null {
  const d = dialStringFromPhone(phone);
  return d ? `tel:${d}` : null;
}

export function smsHref(phone: string | null | undefined): string | null {
  const d = dialStringFromPhone(phone);
  return d ? `sms:${d}` : null;
}
