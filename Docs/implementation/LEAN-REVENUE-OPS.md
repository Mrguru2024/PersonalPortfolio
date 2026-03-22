# Lean Revenue Ops (internal) — implementation notes

This module extends **Ascendra OS** without adding a parallel CRM, communications stack, or payments product. It wires **Twilio SMS/voice**, **Stripe invoice webhooks**, **booking link tracking**, and **CRM activity log** types into the existing Growth OS + CRM surfaces.

## What was already in the repo (reused)

- **CRM**: `crm_contacts` (phone, UTM fields, `booked_call_at`, `stripe_customer_id`, tags, `custom_fields`), `crm_activity_log` for timeline.
- **SMS**: `server/services/smsService.ts` (Twilio REST).
- **Stripe**: `server/services/stripeInvoiceService.ts`, `client_invoices`, admin send invoice flow.
- **Lead creation**: `app/api/admin/crm/contacts` POST, `server/services/leadFromFormService.ts` for form-sourced leads.
- **Workflows**: `fireWorkflows(..., "contact_created", ...)` unchanged; welcome SMS is a separate hook to avoid workflow UI churn for this phase.

## What was added

- **Table**: `revenue_ops_settings` (singleton `id = 1`, JSON `config`) for templates, toggles, default booking URL.
- **Service**: `server/services/revenueOpsService.ts` — welcome SMS, missed-call SMS, manual SMS, booking link SMS, deposit timeline helper, tracked `/go/book/[token]` URL builder.
- **Webhooks**: `POST /api/webhooks/twilio/sms`, `POST /api/webhooks/twilio/voice`, `POST /api/webhooks/stripe`.
- **Admin API**: `GET/PUT /api/admin/revenue-ops/settings`, `GET /api/admin/revenue-ops/dashboard`, CRM subroutes for SMS and booking link.
- **UI**: Growth OS → **Revenue ops** (dashboard + settings), CRM contact **Revenue ops** card.
- **Activity types** (timeline): `revenue_ops_*` as listed in `crmFoundationService.ts`.

## Merge strategy / duplication avoided

- No new CRM tables besides the small settings row.
- No duplicate timelines: all events go through `logActivity` → `crm_activity_log`.
- Stripe: extends existing invoice send (metadata `crmContactId` when recipient email matches a CRM contact) and webhook updates `client_invoices` + CRM.
- Booking: external URL only; optional click tracking via signed redirect (`REVENUE_OPS_BOOKING_LINK_SECRET`).

## Setup checklist

1. **Database**: `npm run db:push` (adds `revenue_ops_settings`).
2. **Twilio**
   - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` **or** `TWILIO_MESSAGING_SERVICE_SID`.
   - **Messaging**: When a number is linked to your app, set “A message comes in” webhook to `https://<host>/api/webhooks/twilio/sms` (POST).
   - **Voice**: For the same (or dedicated) number, set **Status callback URL** to `https://<host>/api/webhooks/twilio/voice` and subscribe to `completed` (and other terminal states as needed). Missed / no-answer flows use `CallStatus` values `no-answer`, `busy`, `failed`, `canceled`.
3. **Stripe**
   - Create a webhook endpoint for `invoice.paid` pointing to `https://<host>/api/webhooks/stripe`.
   - Set `STRIPE_WEBHOOK_SECRET` to the signing secret from the Stripe dashboard.
4. **Tracked booking links** (optional): set `REVENUE_OPS_BOOKING_LINK_SECRET` and optionally `NEXT_PUBLIC_APP_URL` for absolute URLs in SMS.
5. **Templates**: Admin → Growth OS → Revenue ops → **Settings**. Placeholders: `{{first_name}}`, `{{name}}`, `{{booking_link}}`.

## Starter copy (examples)

- **Welcome SMS**: “Hi {{first_name}} — thanks for reaching out to Ascendra. Book a quick call: {{booking_link}}”
- **Missed call SMS**: “Sorry we missed your call — book here when ready: {{booking_link}}”
- **Booking push (default in code)**: “Here's my calendar to book a quick call: …” (when using “Send booking link” on the CRM card).

## Dependencies

No new npm packages: Twilio signing uses Node `crypto`; Stripe webhook uses existing `stripe` SDK.
