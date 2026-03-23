import type { AppLocale } from "./constants";
import { getClientLocale } from "./runtime";

const TEMPLATES: Record<string, Record<AppLocale, string>> = {
  "auth.welcomeBack": {
    en: "Welcome back, {username}!",
    es: "¡Bienvenido de nuevo, {username}!",
  },
  "auth.welcomeRegister": {
    en: "Welcome, {username}!",
    es: "¡Bienvenido, {username}!",
  },
  "auth.portalSignedIn": {
    en: "Welcome back, {username}!",
    es: "¡Bienvenido de nuevo, {username}!",
  },
  "admin.resetEmailDescription": {
    en: "If an account exists for {email}, they will receive a link.",
    es: "Si existe una cuenta para {email}, recibirán un enlace.",
  },
  "communications.audiencePreviewDescription": {
    en: "{count} contacts match.",
    es: "{count} contactos coinciden.",
  },
  "communications.sendCompleteDescription": {
    en: "Sent {sent}, failed {failed}",
    es: "Enviados {sent}, fallidos {failed}",
  },
  "crm.bulkContactsUpdated": {
    en: "{count} contact(s) updated",
    es: "{count} contacto(s) actualizados",
  },
  "crm.importLeadsAdded": {
    en: "{count} lead(s) added",
    es: "{count} prospecto(s) añadidos",
  },
  "crm.importSkipped": {
    en: "{count} skipped",
    es: "{count} omitidos",
  },
  "growth.readinessScore": {
    en: "Score {score}",
    es: "Puntuación {score}",
  },
  "admin.remindersAdded": {
    en: "{count} new reminder(s) added",
    es: "{count} recordatorio(s) nuevo(s) añadido(s)",
  },
  "admin.remindersUpToDate": {
    en: "Reminders are up to date",
    es: "Los recordatorios están al día",
  },
};

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] !== undefined && values[key] !== null ? String(values[key]) : `{${key}}`,
  );
}

export function resolveToastTemplate(
  key: string,
  values?: Record<string, string | number>,
  locale?: AppLocale,
): string {
  const loc = locale ?? getClientLocale();
  const row = TEMPLATES[key];
  if (!row) return key;
  return interpolate(row[loc] ?? row.en, values);
}
