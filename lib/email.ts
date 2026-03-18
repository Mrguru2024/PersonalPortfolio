/**
 * Email integration for the growth funnel and site forms.
 *
 * Transactional email (Brevo) is implemented server-side in server/services/emailService.ts.
 * Set BREVO_API_KEY and ADMIN_EMAIL in .env.local (or production env) to enable:
 * - Growth diagnosis results to user
 * - New growth lead notification to admin
 * - Contact form and other notifications
 *
 * This file exists for documentation and any shared types; no secrets or
 * server-only code should be imported in client components.
 */

export const GROWTH_DIAGNOSIS_EMAIL_SUBJECT = "Your Growth Diagnosis Results" as const;
