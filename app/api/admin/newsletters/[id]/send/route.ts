import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  applyEmailMergeTags,
  mergeFieldsFromCrmContact,
  mergeFieldsFromEmailOnly,
} from "@/lib/emailMergeTags";
import { resolveRelativeUrlsForEmail } from "@/lib/resolveEmailAssetUrls";
import { appendNewsletterSiteVisitFooter, appendNewsletterSiteVisitFooterPlain } from "@shared/newsletterFooter";
import { storage } from "@server/storage";
import type { CrmContact } from "@shared/schema";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";

function emailPublicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

// Send newsletter to subscribers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const newsletterId = Number.parseInt(idParam, 10);
    const newsletter = await storage.getNewsletterById(newsletterId);

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }

    if (newsletter.status === "sent" || newsletter.status === "sending") {
      return NextResponse.json(
        {
          error: "Newsletter has already been sent or is currently being sent",
        },
        { status: 400 }
      );
    }

    // Resolve recipients: explicit list, CRM segments, or newsletter subscriber filter
    const recipientEmails = (newsletter as { recipientEmails?: string[] }).recipientEmails;
    let subscribers: { id: number; email: string }[];

    if (recipientEmails && Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      const emails = [...new Set(recipientEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
      subscribers = await Promise.all(
        emails.map((email) => storage.getOrCreateSubscriberForEmail(email, "crm"))
      ).then((list) => list.map((s) => ({ id: s.id, email: s.email })));
    } else {
      const filter = newsletter.recipientFilter || {};
      const pickedIds = Array.isArray(filter.crmContactIds)
        ? [...new Set(filter.crmContactIds.map((n) => Number(n)).filter((id) => Number.isFinite(id) && id > 0))]
        : [];
      if (pickedIds.length > 0) {
        const contacts = await storage.getCrmContactsByIds(pickedIds);
        const emails = [
          ...new Set(contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]),
        ];
        subscribers = await Promise.all(
          emails.map((email) => storage.getOrCreateSubscriberForEmail(email, "crm"))
        ).then((list) => list.map((s) => ({ id: s.id, email: s.email })));
      } else if (filter.crmAll === true) {
        const contacts = await storage.getCrmContacts();
        const emails = [
          ...new Set(contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]),
        ];
        subscribers = await Promise.all(
          emails.map((email) => storage.getOrCreateSubscriberForEmail(email, "crm"))
        ).then((list) => list.map((s) => ({ id: s.id, email: s.email })));
      } else if (filter.crmLeads === true) {
        const contacts = await storage.getCrmContacts("lead");
        const emails = [
          ...new Set(
            contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]
          ),
        ];
        subscribers = await Promise.all(
          emails.map((email) => storage.getOrCreateSubscriberForEmail(email, "crm"))
        ).then((list) => list.map((s) => ({ id: s.id, email: s.email })));
      } else if (filter.crmClients === true) {
        const contacts = await storage.getCrmContacts("client");
        const emails = [
          ...new Set(
            contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]
          ),
        ];
        subscribers = await Promise.all(
          emails.map((email) => storage.getOrCreateSubscriberForEmail(email, "crm"))
        ).then((list) => list.map((s) => ({ id: s.id, email: s.email })));
      } else {
        let list = await storage.getAllSubscribers(!filter.subscribed);
        if (filter.tags && filter.tags.length > 0) {
          list = list.filter((sub) => {
            const subTags = sub.tags || [];
            return filter.tags!.some((tag: string) => subTags.includes(tag));
          });
        }
        subscribers = list.map((s) => ({ id: s.id, email: s.email }));
      }
    }

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No recipients match the current audience. Choose subscribers, CRM leads/clients, or save a recipient list." },
        { status: 400 }
      );
    }

    const base = emailPublicBaseUrl();
    const crmMatches = await storage.getCrmContactsByNormalizedEmails(
      subscribers.map((s) => s.email.trim().toLowerCase())
    );
    const byEmail = new Map<string, CrmContact>();
    for (const c of crmMatches) {
      const k = c.email?.trim().toLowerCase();
      if (k) byEmail.set(k, c);
    }

    // Update newsletter status
    await storage.updateNewsletter(newsletterId, {
      status: "sending",
      totalRecipients: subscribers.length,
    });

    // Send emails in background (don't wait for all to complete)
    const sendPromises = subscribers.map(async (subscriber) => {
      try {
        // Create send record
        const sendRecord = await storage.createNewsletterSend({
          newsletterId,
          subscriberId: subscriber.id,
          email: subscriber.email,
          status: "pending",
        });

        // Send email via Brevo
        const brevoModule = await import("@getbrevo/brevo");
        const defaultClient = brevoModule.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = process.env.BREVO_API_KEY;
        const apiInstance = new brevoModule.TransactionalEmailsApi();

        const em = subscriber.email.trim().toLowerCase();
        const crm = byEmail.get(em);
        const fields = crm ? mergeFieldsFromCrmContact(em, crm) : mergeFieldsFromEmailOnly(em);
        const subjectPersonalized = applyEmailMergeTags(newsletter.subject, fields, { htmlEscape: false });
        const htmlPersonalized = applyEmailMergeTags(newsletter.content, fields, { htmlEscape: true });
        let htmlContent = resolveRelativeUrlsForEmail(htmlPersonalized, base);
        htmlContent = appendNewsletterSiteVisitFooter(htmlContent, base);
        const plainPersonalized = newsletter.plainText?.trim()
          ? applyEmailMergeTags(newsletter.plainText, fields, { htmlEscape: false })
          : applyEmailMergeTags(
              newsletter.content.replaceAll(/<[^>]*>/g, " "),
              fields,
              { htmlEscape: false }
            );
        const textContent = appendNewsletterSiteVisitFooterPlain(
          plainPersonalized.replace(/\s+/g, " ").trim(),
          base
        );

        const sendSmtpEmail = new brevoModule.SendSmtpEmail();
        sendSmtpEmail.subject = subjectPersonalized;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.textContent = textContent;
        sendSmtpEmail.sender = {
          name: process.env.FROM_NAME || "Ascendra Technologies",
          email: process.env.FROM_EMAIL || "noreply@mrguru.dev",
        };
        sendSmtpEmail.to = [{ email: subscriber.email }];

        // Note: Brevo API doesn't support custom headers directly on SendSmtpEmail
        // Preview text can be added to the email content or subject if needed
        // For now, we'll include it in the email content if available

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

        // Update send record
        await storage.updateNewsletterSend(sendRecord.id, {
          status: "sent",
          sentAt: new Date(),
          brevoMessageId: result.messageId?.toString(),
        });

        if (crm?.id) {
          const wfBase = await buildPayloadFromContactId(storage, crm.id).catch(() => ({
            contactId: crm.id,
            contact: crm,
          }));
          const wfPayload = {
            ...wfBase,
            journeyEvent: {
              channel: "email" as const,
              emailSource: "newsletter" as const,
              newsletterSubject: newsletter.subject,
            },
          };
          fireWorkflows(storage, "contact_email_sent", wfPayload).catch(() => {});
        }

        return { success: true, email: subscriber.email };
      } catch (error: any) {
        console.error(`Error sending to ${subscriber.email}:`, error);

        // Update send record with error
        const sendRecord = await storage.getNewsletterSends(newsletterId);
        const record = sendRecord.find((s) => s.email === subscriber.email);
        if (record) {
          await storage.updateNewsletterSend(record.id, {
            status: "failed",
            failedAt: new Date(),
            errorMessage: error.message || "Unknown error",
          });
        }

        return {
          success: false,
          email: subscriber.email,
          error: error.message,
        };
      }
    });

    // Wait for all sends to complete (or fail)
    const results = await Promise.allSettled(sendPromises);

    // Count successes and failures
    const sentCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failedCount = results.length - sentCount;

    // Update newsletter with final stats
    await storage.updateNewsletter(newsletterId, {
      status: "sent",
      sentAt: new Date(),
      sentCount,
      failedCount,
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length,
    });
  } catch (error: any) {
    console.error("Error sending newsletter:", error);

    // Update newsletter status to failed
    const { id: idParam } = await params;
    const newsletterId = Number.parseInt(idParam, 10);
    await storage.updateNewsletter(newsletterId, { status: "failed" });

    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
