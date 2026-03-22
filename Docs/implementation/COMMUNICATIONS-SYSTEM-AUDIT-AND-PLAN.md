# Ascendra OS — Communications System (Audit, Integration, MVP)

## 1. Audit — what already existed

| Area | Existing assets |
|------|-----------------|
| **Admin shell** | `app/admin/layout.tsx`, `Header.tsx` admin menu, `isAdmin` + `adminApproved` gate (same pattern as newsletters). |
| **Email transport** | Brevo: `server/services/emailService.ts`, `publishAdapters.ts` (notify), newsletter send route inline SDK, `sendBrevoTransactional` REST pattern. |
| **Newsletters (subscribers)** | `shared/newsletterSchema.ts`, `/admin/newsletters/*`, subscriber list — **not duplicated**; communications targets **CRM contacts**. |
| **CRM** | `crm_contacts`, `crm_activity_log`, `crm_saved_lists` filters, `getCrmContactsBySavedListFilters`. |
| **Engagement** | `communication_events` (open/click/reply/delivered), `GET /api/track/email/open`, `GET /api/track/email/click`, `signEmailTrackingPayload` / `verifyEmailTrackingToken` in `app/lib/track-email.ts`. |
| **Lead profile** | `/admin/crm/[id]` timeline + communication-events tab. |
| **Rich editor** | `RichTextEditor` (TipTap) shared with newsletters. |
| **Offers / magnets (metadata)** | `site_offers`, `ascendra_lead_magnets` — stored on campaign as `offerSlug` / `leadMagnetId` for reporting and future deep links (MVP: fields only). |
| **Personas** | `marketing_personas` — campaign `targetPersonaIdsJson` + design `personaIdsJson`; segment filter `personaId` matches `customFields.marketingPersonaId` when present. |

## 2. Integration targets (plugged in)

1. **CRM engine** — audience from `crm_contacts` + saved-list filter semantics; `doNotContact` respected; activity log entries `comm_campaign_sent` / `comm_unsubscribed`.
2. **communication_events** — delivered (on send), open/click (existing trackers + enriched metadata).
3. **Email tracking** — extended `/api/track/email/open` and `click` to detect `commSend-{id}` and update `comm_campaign_sends` + campaign aggregates (first open / first click).
4. **Unsubscribe** — `GET /api/track/email/unsubscribe` with signed `unsubcomm-{campaignId}` token; sets `crm_contacts.do_not_contact`.
5. **Brevo** — `server/services/communications/brevoTransactional.ts` (REST, swappable provider later).
6. **Analytics** — `/api/admin/communications/analytics` reads campaign counters; complements CRM + website analytics, does not replace them.

## 3. Duplication risks avoided

- No second subscriber database for CRM sends.
- No duplicate tracking URLs: reused `/api/track/email/*` with stable HMAC tokens.
- No second rich editor: TipTap `RichTextEditor` reused.
- No parallel admin layout: same container + new subnav under `/admin/communications`.
- Newsletters remain the path for **newsletter_subscribers** bulk flows.

## 4. New schema (Drizzle)

- `comm_email_designs` — template/design storage (HTML + optional `blocks_json`).
- `comm_campaigns` — campaign metadata, `segment_filters` JSON, UTM fields, offer/magnet references.
- `comm_campaign_sends` — per-recipient log; tracking id encoded as `emailId` = `commSend-{sendRowId}`.

Run: `npm run db:push`

## 5. MVP scope delivered

- Dashboard, designs list/create/edit, duplicate, test send (no pixel), campaigns create/detail/send, audience preview API, analytics page.
- Guardrails: segment must have **explicit** constraints (not “all CRM”); campaign send **once** (duplicate campaign row to resend).

## 6. Phase 2 (delivered)

- **AI assist**: `POST /api/admin/communications/designs/[id]/ai-assist` (`subject_lines`, `preheader`, `html_section`, `polish_html`); optional `subject`, `previewText`, `htmlSample` in body to use unsaved editor state. Env: `OPENAI_COMM_MODEL` (default `gpt-4o-mini`).
- **A/B**: `variant_email_design_id`, `ab_test_enabled`, `ab_variant_b_percent` on `comm_campaigns`; per-send `ab_variant`; admin create/edit + analytics split.
- **Block analytics**: `blocks_json` on designs; tracked links get `block=`; `first_clicked_block_id` on sends; analytics API aggregates `blockClicks`.
- **Automation**: workflow action `send_comm_campaign` (draft campaign, segment `contactIds` exactly `[workflow contact]`).
- **Brevo webhooks**: `POST /api/webhooks/brevo` with shared secret; matches Brevo `message-id` to `comm_campaign_sends` bounce fields.
- **Multi-tenant prep**: nullable `organization_id` on `comm_email_designs` and `comm_campaigns`.

## 7. Future packaging

- Reuse `comm_*` tables; add RLS or app-layer scoping; keep Brevo sub-accounts or sender domains per client if needed.
