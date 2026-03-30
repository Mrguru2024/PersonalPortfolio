import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  ClientServiceAgreement,
  ClientServiceAgreementMilestone,
  LegalClauseLibraryRow,
} from "@shared/schema";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export async function buildServiceAgreementPdfBuffer(opts: {
  agreement: ClientServiceAgreement;
  milestones: ClientServiceAgreementMilestone[];
  libraryClauses: LegalClauseLibraryRow[];
}): Promise<Uint8Array> {
  const { agreement, milestones, libraryClauses } = opts;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fs = 10;
  const fsH = 12;
  const margin = 50;
  const maxW = 92;
  let page = pdf.addPage([612, 792]);
  let y = 760;

  const addPageIfNeeded = (linesNeeded: number) => {
    if (y - linesNeeded * (fs + 2) < margin) {
      page = pdf.addPage([612, 792]);
      y = 760;
    }
  };

  const drawPara = (text: string, header = false) => {
    const f = header ? bold : font;
    const size = header ? fsH : fs;
    for (const line of wrapLine(text, maxW)) {
      addPageIfNeeded(1);
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size + 4;
    }
    y -= 6;
  };

  drawPara("SERVICE AGREEMENT SUMMARY", true);
  drawPara(
    `${agreement.companyLegalName || agreement.clientName} — ${agreement.clientEmail}. Status: ${agreement.status}.`,
  );

  const bullets = agreement.scopeBulletsJson ?? [];
  drawPara("Scope of work", true);
  for (const b of bullets) {
    drawPara(`• ${b}`);
  }

  drawPara("Pricing and payment", true);
  drawPara(stripHtml(agreement.pricingNarrative || ""));

  if (libraryClauses.length) {
    drawPara("Standard terms (clause library)", true);
    for (const c of libraryClauses) {
      drawPara(c.title, true);
      drawPara(stripHtml(c.bodyHtml));
      const reviewed = c.lawyerReviewedAt
        ? c.lawyerReviewedAt instanceof Date
          ? c.lawyerReviewedAt
          : new Date(String(c.lawyerReviewedAt))
        : null;
      if (reviewed && !Number.isNaN(reviewed.getTime())) {
        drawPara(
          `Counsel review recorded: ${reviewed.toISOString().slice(0, 10)}${c.lawyerReviewerName ? ` — ${c.lawyerReviewerName}` : ""}${c.lawyerFirmName ? ` (${c.lawyerFirmName})` : ""}.`,
        );
      } else {
        drawPara("Note: clause not marked as lawyer-reviewed in the library — have counsel review before reliance.");
      }
    }
  }

  if (milestones.length) {
    drawPara("Milestones", true);
    for (const m of milestones) {
      drawPara(`• ${m.label}: $${(m.amountCents / 100).toFixed(2)} — ${m.status}`);
    }
  }

  drawPara(
    "This PDF is generated for record-keeping. If DocuSign was used, the executed DocuSign PDF is the authoritative executed copy unless your order form says otherwise.",
  );

  return pdf.save();
}
