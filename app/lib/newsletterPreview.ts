import {
  applyEmailMergeTags,
  mergeFieldsFromCrmContact,
  mergeFieldsFromEmailOnly,
} from "@/lib/emailMergeTags";
import { resolveRelativeUrlsForEmail } from "@/lib/resolveEmailAssetUrls";
import { appendNewsletterSiteVisitFooter } from "@shared/newsletterFooter";

export type NewsletterPreviewSampleMode = "typical_subscriber" | "crm_contact";

export function buildNewsletterPreviewForDialog(opts: {
  subject: string;
  previewText: string;
  bodyHtml: string;
  baseUrl: string;
  /** Shown in footer link; matches send behavior when possible. */
  siteLinkLabel?: string;
  sample: NewsletterPreviewSampleMode;
}): { subject: string; previewText: string; bodyHtml: string } {
  const email = opts.sample === "crm_contact" ? "jamie.lee@example.com" : "alex.smith@example.com";
  const fields =
    opts.sample === "crm_contact"
      ? mergeFieldsFromCrmContact(email, {
          firstName: "Jamie",
          name: "Jamie Lee",
          company: "Example Co",
        })
      : mergeFieldsFromEmailOnly(email);

  const subjectP = applyEmailMergeTags(opts.subject || "", fields, { htmlEscape: false });
  const preP = applyEmailMergeTags(opts.previewText || "", fields, { htmlEscape: false });
  const mergedBody = resolveRelativeUrlsForEmail(
    applyEmailMergeTags(opts.bodyHtml || "<p></p>", fields, { htmlEscape: true }),
    opts.baseUrl.replace(/\/$/, ""),
  );
  const label = opts.siteLinkLabel?.trim() || "Visit our website";
  const bodyWithFooter = appendNewsletterSiteVisitFooter(mergedBody, opts.baseUrl.replace(/\/$/, ""), label);
  return { subject: subjectP, previewText: preP, bodyHtml: bodyWithFooter };
}
