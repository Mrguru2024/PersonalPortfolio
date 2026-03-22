# Ascendra OS — Paid Growth / PPC Module

## 1. Audit summary — existing systems reused

| Capability | Existing engine | How Paid Growth uses it |
|------------|-----------------|-------------------------|
| Offers | `site_offers`, `storage.getSiteOffer` / `listSiteOffers` | Campaign `offerSlug` + readiness checks |
| Landing / funnels | `funnel_content`, `getFunnelContent` | Landing path + readiness |
| Personas | `marketing_personas` | Builder picker + `personaId` on campaign |
| CRM | `crm_contacts`, UTM fields, timeline | Lead quality keyed by `crm_contact_id`; forms should pass UTMs |
| Communications | `comm_campaigns` | Optional `commCampaignId` for follow-up |
| Email transport | Brevo (`BREVO_API_KEY`) | Readiness + same path as rest of OS (no new provider) |
| Growth diagnosis | `/growth-diagnosis`, `growth_diagnosis_reports` | **Not duplicated** — deep audits stay there; PPC readiness is a launch checklist |
| Meta Graph (organic) | `FACEBOOK_ACCESS_TOKEN`, page post adapters | Paid layer uses Marketing API env vars (`META_*`) to avoid conflating page publish with ads |
| Admin auth | `isAdmin`, `Header` nav | Same gate; nav uses `funnel` permission |
| Analytics | Website analytics, comm analytics | Dashboard links; performance snapshots table for future sync |

## 2. Integration targets

- **CRM engine** — `ppc_lead_quality.crm_contact_id` (unique), links to `/admin/crm/[id]`.
- **Offer engine** — `ppc_campaigns.offer_slug` → `site_offers.slug`.
- **Landing engine** — `landing_page_path` + funnel slug resolution in readiness.
- **Communications** — optional `comm_campaign_id` → `comm_campaigns.id`.
- **Attribution** — `tracking_params_json` (UTM) aligned with `crm_contacts.utm_*` on capture.
- **Admin permissions** — `funnel` for menu visibility (same section as funnel).

## 3. Duplication avoided

- No second CRM, audience DB, communications stack, or newsletter system.
- No duplicate site audit — complements Growth Diagnosis.
- No standalone landing CMS — paths point at existing routes/funnels.

## 4. Data model (`npm run db:push`)

- `ppc_ad_accounts` — platform account IDs + labels (tokens in env).
- `ppc_campaigns` — builder + platform IDs + readiness snapshot.
- `ppc_publish_logs` — request/response summaries.
- `ppc_performance_snapshots` — for future Insights sync.
- `ppc_lead_quality` — one row per CRM contact (unique index).
- `ppc_readiness_assessments` — history when POST readiness.

## 5. Publish behavior

### Meta (Marketing API)

- Creates **campaign** + **ad set** via JSON POST (`special_ad_categories: []`), default **PAUSED** unless `publishPausedDefault` is false.
- Requires `META_SYSTEM_USER_ACCESS_TOKEN` (or `META_ACCESS_TOKEN` / `FACEBOOK_ACCESS_TOKEN` fallback) and `META_AD_ACCOUNT_ID` or a linked `ppc_ad_accounts` row.
- **Creative / ad level** is not fully automated — extend `metaMarketingPublish.ts` when creative hashes or image URLs are wired to your asset library.

### Google Ads

- **Connection validation**: OAuth refresh + developer token presence (`googleAdsConnection.ts`).
- **Campaign mutate**: not executed in-repo (API is gRPC/SDK-heavy). Publish logs record validation; extend with `google-ads-api` or Google’s official client when ready. See [Google Ads campaign creation](https://developers.google.com/google-ads/api/docs/campaigns/creating-campaigns).

## 6. Readiness threshold

- Default minimum overall score **58** before `runPpcPublishPipeline` proceeds (`publishPipeline.ts`).
- Adjust if your ops standard differs.

## 7. Lead capture & routing (manual contract)

On form submit (funnel / contact):

1. Create or update **CRM contact** (existing APIs).
2. Set `utm_source`, `utm_medium`, `utm_campaign` from campaign `tracking_params_json`.
3. Optionally pass **`ascendra_ppc=<campaignId>`** as a hidden field for internal joins.
4. Map `personaId` into `custom_fields.marketingPersonaId` if you use that for segmentation.
5. Trigger **Communications** via linked `comm_campaign_id` or existing automation.

## 8. Environment variables

See root `.env.example` (Paid Growth section). All secrets are **server-only**.

## 9. Background jobs

- No new queue in this PR. Optional `PPC_SYNC_INTERVAL_MINUTES` is documented for future cron to call Meta/Google Insights and fill `ppc_performance_snapshots`.

## 10. File map

```
shared/paidGrowthSchema.ts
server/storage.ts                          # CRUD
server/services/paid-growth/
  readinessEngine.ts
  googleAdsConnection.ts
  metaMarketingPublish.ts
  publishPipeline.ts
app/api/admin/paid-growth/**               # REST admin API
app/admin/paid-growth/**                   # UI
app/components/paid-growth/PaidGrowthSubnav/
scripts/seed-paid-growth.ts
```

## 11. Future (Phase 2)

- Provider adapters: TikTok / LinkedIn slots alongside `google_ads` | `meta`.
- Insights sync + CPL/CPQL from snapshots + CRM outcomes.
- Webhooks (`META_WEBHOOK_VERIFY_TOKEN`) for disapprovals.
- Creative library mapping to `funnel_content_assets` / uploads.
