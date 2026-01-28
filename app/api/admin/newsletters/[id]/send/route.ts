import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

// Send newsletter to subscribers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const { id: idParam } = await params;
    const newsletterId = Number.parseInt(idParam, 10);
    const newsletter = await storage.getNewsletterById(newsletterId);
    
    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    
    if (newsletter.status === "sent" || newsletter.status === "sending") {
      return NextResponse.json(
        { error: "Newsletter has already been sent or is currently being sent" },
        { status: 400 }
      );
    }
    
    // Get subscribers based on filter
    const filter = newsletter.recipientFilter || {};
    let subscribers = await storage.getAllSubscribers(!filter.subscribed);
    
    // Apply tag filter if specified
    if (filter.tags && filter.tags.length > 0) {
      subscribers = subscribers.filter(sub => {
        const subTags = sub.tags || [];
        return filter.tags!.some(tag => subTags.includes(tag));
      });
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
        const brevoModule = await import('@getbrevo/brevo');
        const defaultClient = brevoModule.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;
        const apiInstance = new brevoModule.TransactionalEmailsApi();
        
        const sendSmtpEmail = new brevoModule.SendSmtpEmail();
        sendSmtpEmail.subject = newsletter.subject;
        sendSmtpEmail.htmlContent = newsletter.content;
        sendSmtpEmail.textContent = newsletter.plainText || newsletter.content.replaceAll(/<[^>]*>/g, '');
        sendSmtpEmail.sender = {
          name: process.env.FROM_NAME || 'MrGuru.dev Portfolio',
          email: process.env.FROM_EMAIL || 'noreply@mrguru.dev',
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
        
        return { success: true, email: subscriber.email };
      } catch (error: any) {
        console.error(`Error sending to ${subscriber.email}:`, error);
        
        // Update send record with error
        const sendRecord = await storage.getNewsletterSends(newsletterId);
        const record = sendRecord.find(s => s.email === subscriber.email);
        if (record) {
          await storage.updateNewsletterSend(record.id, {
            status: "failed",
            failedAt: new Date(),
            errorMessage: error.message || "Unknown error",
          });
        }
        
        return { success: false, email: subscriber.email, error: error.message };
      }
    });
    
    // Wait for all sends to complete (or fail)
    const results = await Promise.allSettled(sendPromises);
    
    // Count successes and failures
    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
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
    
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
