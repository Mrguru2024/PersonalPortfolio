# IONOS system email (Ascendra OS)

Internal admin mailbox: **SMTP** (transactional sends) and **IMAP** (inbox UI) via IONOS, parallel to **Brevo** (API-driven campaigns and Email Hub).

## Environment variables

- `IONOS_EMAIL` — mailbox login and default primary From unless `ASCENDRA_PRIMARY_FROM_EMAIL` is set
- `ASCENDRA_PRIMARY_FROM_EMAIL` — canonical “Ascendra” From address (e.g. admin@ascendra.tech)
- `ASCENDRA_PRIMARY_SENDER_NAME` — display name for primary sender
- `ASCENDRA_OUTBOUND_EMAIL_DOMAIN` — default `ascendra.tech`; authorized admin `senderEmail` must be on this domain
- `ASCENDRA_DEFAULT_REPLY_TO_EMAIL` — fallback Reply-To when CRM lead has no `ownerUserId`
- `IONOS_PASSWORD` — mailbox password (app-specific password if your org uses one)
- `IONOS_IMAP_HOST` — default `imap.ionos.com`
- `IONOS_IMAP_PORT` — default `993`
- `IONOS_SMTP_HOST` — default `smtp.ionos.com`
- `IONOS_SMTP_PORT` — default `587`
- `IONOS_FROM_NAME` — optional display name; falls back to `FROM_NAME`, then `Ascendra Technologies`

Secrets are **server-only**. Routes: `GET/POST /api/admin/system-email/*` (approved admin session).

## Deliverability (DNS)

For best inbox placement at recipient domains, configure at the **sending domain** (where recipients see mail from):

- **SPF** — authorize IONOS / your mail servers to send for the domain (IONOS help documents the value to publish).
- **DKIM** — sign outgoing mail (enable in IONOS mail admin when available).
- **DMARC** — policy record (`_dmarc`) aligning SPF/DKIM; start with `p=none` for monitoring, then tighten.

Exact record strings depend on IONOS UI and your domain registrar — do not copy fictional placeholders into production DNS.

## Product surfaces

- `/admin/system-email` — IMAP inbox list + sandboxed HTML preview, CRM sender match
- **Settings** — IONOS card (status + test send)
- **Code**: `server/services/ionosMail/*`, templates in `emailTemplates.ts`

## Brevo vs IONOS

- **Brevo** remains the default for newsletters, Email Hub outbound, and many existing transactional wrappers.
- **IONOS** is optional: use when you want a dedicated hosted mailbox and direct SMTP/IMAP without routing through Brevo’s API.
