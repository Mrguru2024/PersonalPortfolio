/**
 * Builds HTML for a client service agreement from structured inputs (admin-generated; not legal advice).
 */

export type LibraryClauseForAgreement = { title: string; bodyHtml: string };

export type ServiceAgreementTemplateInput = {
  providerLegalName: string;
  clientLegalName: string;
  clientContactName: string;
  clientEmail: string;
  effectiveDateIso: string;
  scopeBullets: string[];
  pricingNarrative: string;
  tierHint?: string | null;
  /** Optional extra clauses keyed by label */
  additionalNotes?: string | null;
  /** Lawyer-reviewable blocks from `legal_clause_library` (HTML trusted admin-only). */
  libraryClauses?: LibraryClauseForAgreement[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildServiceAgreementHtml(input: ServiceAgreementTemplateInput): string {
  const bullets = input.scopeBullets
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");

  const tier = input.tierHint?.trim() ? `<p><strong>Engagement tier discussed:</strong> ${escapeHtml(input.tierHint.trim())}</p>` : "";

  const extra = input.additionalNotes?.trim()
    ? `<section class="ag-block"><h2>Additional terms</h2><p>${escapeHtml(input.additionalNotes.trim()).replace(/\n/g, "<br/>")}</p></section>`
    : "";

  const libraryBlocks = input.libraryClauses?.length
    ? `<section class="ag-block"><h2>Standard legal terms (clause library)</h2>
<p class="text-xs text-muted-foreground mb-3">The following sections are composed from your admin clause library. Clauses marked as counsel-reviewed in the library carry review metadata; unmarked clauses should be reviewed by your attorney before production use.</p>
${input.libraryClauses
  .map(
    (c) =>
      `<div class="clause-lib border-l-2 border-border pl-3 mb-4"><h3 class="text-base font-semibold">${escapeHtml(c.title)}</h3><div class="clause-html text-sm">${c.bodyHtml}</div></div>`,
  )
  .join("")}
</section>`
    : "";

  return `<article class="ascendra-service-agreement prose prose-neutral dark:prose-invert max-w-none">
<style>
.ascendra-service-agreement { font-size: 15px; line-height: 1.55; }
.ascendra-service-agreement h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
.ascendra-service-agreement h2 { font-size: 1.05rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.ascendra-service-agreement .ag-block { margin-bottom: 1rem; }
.ascendra-service-agreement ul { margin: 0.5rem 0 0.75rem 1.25rem; list-style: disc; }
</style>
<h1>Service agreement summary</h1>
<p>This document summarizes the commercial relationship between <strong>${escapeHtml(input.providerLegalName)}</strong> (“Provider”) and <strong>${escapeHtml(input.clientLegalName)}</strong> (“Client”), primary contact ${escapeHtml(input.clientContactName)} &lt;${escapeHtml(input.clientEmail)}&gt;, effective ${escapeHtml(input.effectiveDateIso)}.</p>
${tier}
<section class="ag-block">
<h2>Scope of work</h2>
<ul>${bullets || "<li>(Scope to be finalized in a written statement of work.)</li>"}</ul>
</section>
<section class="ag-block">
<h2>Pricing and payment</h2>
<p>${escapeHtml(input.pricingNarrative).replace(/\n/g, "<br/>")}</p>
</section>
${input.libraryClauses?.length ? "" : `<section class="ag-block">
<h2>Disclaimers</h2>
<ul>
<li>No guaranteed results: outcomes depend on market, offer quality, execution, budget, and Client cooperation.</li>
<li>Third-party advertising spend is billed by platforms unless a separate media management agreement says otherwise.</li>
<li>Provider is not liable for outages or policy changes on third-party platforms (e.g. ad networks).</li>
<li>Non-refundable portions of fees, revision limits, and termination rights are defined in the full statement of work or order form.</li>
</ul>
</section>`}
${libraryBlocks}
${extra}
<p class="text-sm text-muted-foreground mt-6">This HTML is generated for review and signature. <strong>Binding terms:</strong> a countersigned agreement (including DocuSign completion, if used) and any referenced SOW or order form control over this summary and over public “engagement expectations” pages.</p>
</article>`;
}
