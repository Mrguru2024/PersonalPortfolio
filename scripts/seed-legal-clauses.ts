/**
 * Seed default clause-library rows (template text — have your counsel review and set lawyer_review fields in admin).
 * Run: npx tsx scripts/seed-legal-clauses.ts
 */
import "dotenv/config";
import { db } from "../server/db";
import { legalClauseLibrary } from "../shared/schema";
import { upsertLegalClause } from "../server/services/legalClauseService";

const SEED = [
  {
    slug: "no-guarantee",
    category: "disclaimer",
    title: "No guaranteed results",
    sortOrder: 10,
    bodyHtml: `<p>Marketing and growth outcomes depend on your market, offer, operations, budget, and follow-up. Deliverables and activities are described in writing; Provider does not guarantee rankings, lead counts, revenue, ROAS, or similar metrics.</p>`,
  },
  {
    slug: "client-cooperation",
    category: "performance",
    title: "Client cooperation",
    sortOrder: 20,
    bodyHtml: `<p>Timely feedback, access to assets, accurate information, and sales follow-up affect timelines and outcomes. Delays or scope changes may require change orders and additional fees.</p>`,
  },
  {
    slug: "ad-spend-platforms",
    category: "media",
    title: "Advertising spend and platforms",
    sortOrder: 30,
    bodyHtml: `<p>Unless a signed scope states otherwise, advertising spend is paid to third-party platforms (e.g., Google, Meta) by Client or under a separate media agreement. Management fees, if any, are stated separately from media.</p>`,
  },
  {
    slug: "third-party-risk",
    category: "liability",
    title: "Third-party platforms and force majeure",
    sortOrder: 40,
    bodyHtml: `<p>Provider is not liable for outages, policy changes, disapprovals, or enforcement actions by third-party platforms, ad networks, hosts, or regulators. Work may pause or pivot when platforms change rules.</p>`,
  },
  {
    slug: "payment-terms",
    category: "payment",
    title: "Fees, taxes, and payment",
    sortOrder: 50,
    bodyHtml: `<p>Fees and milestones are as set forth in the order form, milestone invoices, or subscription. Applicable taxes may be added where required. Late payments may accrue interest or pause work per the order form.</p>`,
  },
  {
    slug: "scope-revisions-termination",
    category: "termination",
    title: "Scope, revisions, and termination",
    sortOrder: 60,
    bodyHtml: `<p>Deliverables and revision rounds are defined in the order form or SOW. Either party may terminate as stated in the order form; fees for work completed and non‑cancelable commitments typically remain due unless otherwise stated.</p>`,
  },
] as const;

async function main() {
  for (const c of SEED) {
    await upsertLegalClause({
      slug: c.slug,
      category: c.category,
      title: c.title,
      bodyHtml: c.bodyHtml,
      sortOrder: c.sortOrder,
      isActive: true,
      reviewNotes: "Seeded template — replace with counsel-reviewed language and set review metadata in admin.",
    });
    console.log("clause:", c.slug);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
