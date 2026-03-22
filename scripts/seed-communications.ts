/**
 * Seed starter Ascendra OS communications designs (templates).
 * Run after `npm run db:push` so comm_* tables exist:
 *   npx tsx scripts/seed-communications.ts
 */
import { storage } from "../server/storage";

const samples = [
  {
    name: "Marcus nurture — value recap",
    category: "nurture" as const,
    subject: "{{firstName}}, a quick recap that might save your next launch",
    previewText: "Three moves we see working for operator-led brands.",
    htmlContent: `
<p>Hi {{firstName}},</p>
<p>Here is a short nurture note from Ascendra — focused on clarity, conversion, and systems (not hype).</p>
<ul>
<li><strong>Offer clarity:</strong> one flagship path beats ten half-finished pages.</li>
<li><strong>Proof:</strong> lead with outcomes your buyers actually recognize.</li>
<li><strong>Follow-through:</strong> book the call while intent is warm.</li>
</ul>
<p><a href="https://ascendratechnologies.com/book-strategy-call">Book a strategy call</a> when you are ready to tighten the funnel.</p>
<p>— Ascendra</p>
`.trim(),
  },
  {
    name: "Devon validation — technical credibility",
    category: "nurture" as const,
    subject: "{{firstName}}, validation you can forward to your team",
    previewText: "Engineering-led teams: alignment note.",
    htmlContent: `
<p>Hi {{firstName}},</p>
<p>If you are validating vendors for a serious build, here is what we optimize for on day one:</p>
<ul>
<li>Architecture that your team can own</li>
<li>Instrumentation and analytics hooks (not an afterthought)</li>
<li>Launch path that does not mortgage maintainability</li>
</ul>
<p>Reply with what you are shipping next — happy to point you to the right next step.</p>
<p>— Ascendra</p>
`.trim(),
  },
  {
    name: "Newsletter — Ascendra OS digest (template)",
    category: "newsletter" as const,
    subject: "Ascendra OS digest — what we shipped this week",
    previewText: "Product, funnel, and CRM notes for the team.",
    htmlContent: `
<p>Team —</p>
<p>Quick internal digest template. Swap bullets for real links and wins.</p>
<ul>
<li><strong>Ship:</strong> …</li>
<li><strong>Learn:</strong> …</li>
<li><strong>Next:</strong> …</li>
</ul>
<p>— Ops</p>
`.trim(),
  },
  {
    name: "Proposal follow-up",
    category: "proposal_follow_up" as const,
    subject: "{{firstName}}, following up on your proposal",
    previewText: "Happy to clarify scope, timeline, or pricing.",
    htmlContent: `
<p>Hi {{firstName}},</p>
<p>Wanted to follow up on the proposal we sent to {{company}}. If anything needs tightening — scope, timeline, or success metrics — tell us what would make this an easy yes.</p>
<p><a href="https://ascendratechnologies.com/book-strategy-call">Grab time here</a> if a short working session helps.</p>
<p>— Ascendra</p>
`.trim(),
  },
  {
    name: "Lead magnet delivery",
    category: "lead_magnet_delivery" as const,
    subject: "Here is what you requested, {{firstName}}",
    previewText: "Your resource + the next best step.",
    htmlContent: `
<p>Hi {{firstName}},</p>
<p>Thanks for opting in — here is your download / access details (replace this paragraph with the real asset link).</p>
<p><a href="https://ascendratechnologies.com">Continue to the site</a></p>
<p>If you want this tailored to {{company}}, reply with your top goal for the next 90 days.</p>
<p>— Ascendra</p>
`.trim(),
  },
];

async function main() {
  const existing = await storage.listCommEmailDesigns();
  if (existing.length > 0) {
    console.log(`Skipping seed: ${existing.length} design(s) already exist.`);
    return;
  }
  for (const s of samples) {
    const row = await storage.createCommEmailDesign({
      name: s.name,
      subject: s.subject,
      previewText: s.previewText,
      htmlContent: s.htmlContent,
      plainText: s.htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      blocksJson: null,
      category: s.category,
      personaIdsJson: [],
      senderName: null,
      status: "published",
      createdBy: null,
    });
    console.log("Created design", row.id, row.name);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
