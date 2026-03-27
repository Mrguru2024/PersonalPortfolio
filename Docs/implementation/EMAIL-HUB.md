# Email Hub (Ascendra OS)

Admin-first outbound workspace backed by **Brevo**, separate from **Communications** bulk campaigns (`comm_campaigns` / `comm_email_designs`) and **Newsletters** (`newsletters`).

## Audit summary — reused

| Area | Reuse |
|------|--------|
| Auth / roles | `getSessionUser`, approved admin gate; super-admin via `isSuperAdminUser` / `isSuperUser` on session |
| Brevo | New `sendEmailHubViaBrevo` in `server/services/emailHub/emailHubBrevo.ts`; existing `BREVO_API_KEY`, `FROM_*`, `@getbrevo/brevo` elsewhere untouched |
| Webhooks | Extended `app/api/webhooks/brevo/route.ts` — tries Email Hub message id first, then CRM campaign send |
| CRM | `crm_contacts` via `relatedContactId`; `storage.createCommunicationEvent` on send + webhook (open/click); **Email Hub** button on `/admin/crm/[id]` |
| Rich text | `RichTextEditor` (newsletter/communications stack) in compose |
| Merge tags | Extended `app/lib/emailMergeTags.ts` for `companyName`, `offerName`, `bookingLink`, `founderName`, `founderSignature` |
| Templates (no duplicate editor) | Hub lists `email_hub_templates` + read-only links to **Communications designs** |
| Nav | `CommunicationsSubnav` adds **Email Hub** |

## New files (high level)

- `shared/emailHubSchema.ts` — Drizzle tables
- `server/services/emailHub/emailHubAccess.ts`, `emailHubBrevo.ts`, `emailHubService.ts`
- `app/api/admin/email-hub/**` — overview, senders, drafts, messages, send, templates, assets, settings, `lib/session.ts`
- `app/api/cron/email-hub-scheduled/route.ts`
- `app/admin/email-hub/**` — layout + pages
- `app/components/email-hub/EmailHubSidebar.tsx`
- This doc

## Modified files

- `shared/schema.ts` — export `emailHubSchema`
- `app/lib/emailMergeTags.ts` — extra merge fields
- `app/api/webhooks/brevo/route.ts` — Email Hub event logging
- `vercel.json` — cron every 5m for scheduled sends
- `app/components/communications/CommunicationsSubnav/index.tsx` — Email Hub link
- `app/admin/crm/[id]/page.tsx` — **Email Hub** CTA
- `app/lib/siteDirectory.ts` — `/admin/email-hub`
- `.env.example` — Brevo Email Hub–related vars

## Database

Run after pull:

```bash
npm run db:push
```

Tables: `email_hub_senders`, `email_hub_sender_permissions`, `email_hub_brand_profiles`, `email_hub_assets`, `email_hub_templates`, `email_hub_drafts`, `email_hub_messages`, `email_hub_events`, plus Phase 2 `email_hub_mailbox_accounts`, `email_hub_inbox_threads`, `email_hub_inbox_messages`.

## Environment

Required for sending (existing): `BREVO_API_KEY`, verified `FROM_EMAIL` / `FROM_NAME`.

Recommended: `BREVO_WEBHOOK_SECRET` — same secret as query param on `POST /api/webhooks/brevo?secret=...`.

Optional (documented in `.env.example`): `BREVO_DEFAULT_REPLY_TO`, `BREVO_TRACKING_DOMAIN`, `BREVO_SENDER_*` hint ids.

Cron: `CRON_SECRET` — `GET /api/cron/email-hub-scheduled` with `Authorization: Bearer <CRON_SECRET>`.

## Local setup

1. `npm install` (if needed), configure `.env.local` with DB + Brevo.
2. `npm run db:push`
3. Super admin: open `/admin/email-hub/settings`, add a **sender** (email must be verified in Brevo). Grant user id defaults to you.
4. `npm run dev` → `/admin/email-hub/compose` — send a test to yourself.
5. In Brevo, add webhook URL with secret; trigger open/click to see `email_hub_events` and **Sent → Timeline**.

## Brevo production checklist

- [ ] Verified domain + senders in Brevo dashboard
- [ ] `BREVO_API_KEY` in Vercel production
- [ ] Webhook: `https://<domain>/api/webhooks/brevo?secret=<BREVO_WEBHOOK_SECRET>`
- [ ] Subscribe webhook to transactional events (delivered, open, click, bounce, unsubscribe, etc.)
- [ ] `CRON_SECRET` set; Vercel cron hits `/api/cron/email-hub-scheduled`
- [ ] Seed `email_hub_senders` + `email_hub_sender_permissions` for each founder

## Phase 2 (inbox sync)

- **Gmail** and **Microsoft Graph** OAuth (`EMAIL_HUB_GMAIL_*`, `EMAIL_HUB_MICROSOFT_*`) — separate from `GOOGLE_CALENDAR_*`.
- Tables: `email_hub_mailbox_accounts`, `email_hub_inbox_threads`, `email_hub_inbox_messages` (`npm run db:push`).
- Admin UI: `/admin/email-hub/inbox` — connect, sync, threaded list, read/unread, HTML reply.
- APIs under `/api/admin/email-hub/mailbox/*`, `/api/admin/email-hub/inbox/*`; cron `/api/cron/email-hub-inbox-sync` (Vercel: every 15m, requires `CRON_SECRET`).

Architecture hooks: Brevo outbound unchanged; inbox rows are provider-scoped copies for UI and reply, not merged into `email_hub_messages`.
