// Dynamic import to avoid Turbopack bundling issues (Brevo uses AMD modules)
// This ensures the package is only loaded at runtime, not during build
let brevo: any = null;

// Lazy load Brevo only when needed
async function getBrevo() {
  if (!brevo) {
    brevo = await import('@getbrevo/brevo');
  }
  return brevo;
}

interface EmailNotification {
  type: 'contact' | 'quote' | 'resume' | 'recommendation' | 'skill-endorsement';
  data: Record<string, any>;
}

export class EmailService {
  private adminEmail: string;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean;
  private apiInstance: any = null; // Type will be set after dynamic import

  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL || '5epmgllc@gmail.com';
    this.fromEmail = process.env.FROM_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@mrguru.dev';
    this.fromName = process.env.FROM_NAME || 'MrGuru.dev Portfolio';
    this.isConfigured = !!process.env.BREVO_API_KEY;

    // Initialize Brevo asynchronously to avoid bundling issues
    if (this.isConfigured) {
      this.initializeBrevo().catch((error) => {
        console.error('Failed to initialize Brevo:', error);
      });
    } else {
      console.warn('⚠️  Brevo API key not found. Email notifications will be disabled.');
      console.warn('   Set BREVO_API_KEY in your .env.local file to enable email notifications.');
    }
  }

  private async initializeBrevo() {
    try {
      const brevoModule = await getBrevo();
      const defaultClient = brevoModule.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY;
      this.apiInstance = new brevoModule.TransactionalEmailsApi();
    } catch (error) {
      console.error('Error initializing Brevo:', error);
      this.isConfigured = false;
    }
  }

  private formatContactEmail(data: any): { subject: string; html: string; text: string } {
    return {
      subject: `📧 New Contact Form Submission from ${data.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📧 New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${data.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
              </div>
              ${data.subject ? `
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${data.subject}</div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${data.message?.replace(/\n/g, '<br>') || 'N/A'}</div>
              </div>
              <div class="footer">
                <p>This message was sent from your portfolio website contact form.</p>
                <p>Reply directly to this email to respond to ${data.name}.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
${data.subject ? `Subject: ${data.subject}\n` : ''}
Message:
${data.message || 'N/A'}

---
This message was sent from your portfolio website contact form.
Reply directly to this email to respond to ${data.name}.
      `.trim()
    };
  }

  private formatQuoteRequestEmail(data: any): { subject: string; html: string; text: string } {
    return {
      subject: `💰 New Quote Request from ${data.name} - ${data.projectType || 'Project'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #059669; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .highlight { background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>💰 New Quote Request</h2>
            </div>
            <div class="content">
              <div class="highlight">
                <strong>🎯 This is a potential business opportunity!</strong>
              </div>
              
              <div class="field">
                <div class="label">Contact Information:</div>
                <div class="value">
                  <strong>${data.name}</strong><br>
                  Email: <a href="mailto:${data.email}">${data.email}</a><br>
                  ${data.phone ? `Phone: <a href="tel:${data.phone}">${data.phone}</a><br>` : ''}
                  ${data.company ? `Company: ${data.company}` : ''}
                </div>
              </div>

              <div class="field">
                <div class="label">Project Details:</div>
                <div class="value">
                  <strong>Type:</strong> ${data.projectType || 'Not specified'}<br>
                  <strong>Budget:</strong> ${data.budget || 'Not specified'}<br>
                  <strong>Timeframe:</strong> ${data.timeframe || 'Not specified'}
                </div>
              </div>

              ${data.pricingEstimate ? `
              <div class="highlight">
                <div class="label">💰 AI-Generated Pricing Estimate:</div>
                <div class="value">
                  <strong>Estimated Range:</strong> $${data.pricingEstimate.estimatedRange?.min?.toLocaleString() || 'N/A'} - $${data.pricingEstimate.estimatedRange?.max?.toLocaleString() || 'N/A'}<br>
                  <strong>Average:</strong> $${data.pricingEstimate.estimatedRange?.average?.toLocaleString() || 'N/A'}<br>
                  ${data.pricingEstimate.marketComparison ? `
                  <strong>Market Comparison:</strong> $${data.pricingEstimate.marketComparison.lowEnd?.toLocaleString() || 'N/A'} - $${data.pricingEstimate.marketComparison.highEnd?.toLocaleString() || 'N/A'} (Avg: $${data.pricingEstimate.marketComparison.average?.toLocaleString() || 'N/A'})
                  ` : ''}
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">* This is an AI-generated estimate based on project details. Final pricing will be customized to project requirements and budget.</p>
              </div>
              ` : ''}

              ${data.message ? `
              <div class="field">
                <div class="label">Project Description:</div>
                <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}

              ${data.newsletter ? `
              <div class="field">
                <div class="label">📧 Newsletter Subscription:</div>
                <div class="value">User opted in to receive newsletter updates</div>
              </div>
              ` : ''}

              <div class="footer">
                <p><strong>⏰ Action Required:</strong> Respond to this inquiry within 24 hours for best results.</p>
                <p>Reply directly to this email to respond to ${data.name}.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
NEW QUOTE REQUEST - ACTION REQUIRED

Contact Information:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}
${data.company ? `Company: ${data.company}\n` : ''}

Project Details:
Type: ${data.projectType || 'Not specified'}
Budget: ${data.budget || 'Not specified'}
Timeframe: ${data.timeframe || 'Not specified'}

${data.pricingEstimate ? `
💰 AI-Generated Pricing Estimate:
Estimated Range: $${data.pricingEstimate.estimatedRange?.min?.toLocaleString() || 'N/A'} - $${data.pricingEstimate.estimatedRange?.max?.toLocaleString() || 'N/A'}
Average: $${data.pricingEstimate.estimatedRange?.average?.toLocaleString() || 'N/A'}
${data.pricingEstimate.marketComparison ? `Market Comparison: $${data.pricingEstimate.marketComparison.lowEnd?.toLocaleString() || 'N/A'} - $${data.pricingEstimate.marketComparison.highEnd?.toLocaleString() || 'N/A'} (Avg: $${data.pricingEstimate.marketComparison.average?.toLocaleString() || 'N/A'})\n` : ''}
* This is an AI-generated estimate. Final pricing will be customized to project requirements and budget.

` : ''}

${data.message ? `Project Description:\n${data.message}\n` : ''}

${data.newsletter ? '📧 User opted in to receive newsletter updates\n' : ''}

---
⏰ ACTION REQUIRED: Respond to this inquiry within 24 hours for best results.
Reply directly to this email to respond to ${data.name}.
      `.trim()
    };
  }

  private formatResumeRequestEmail(data: any): { subject: string; html: string; text: string } {
    return {
      subject: `📄 Resume Request from ${data.name}${data.company ? ` at ${data.company}` : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #2563eb; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📄 Resume Request</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Requestor Information:</div>
                <div class="value">
                  <strong>${data.name}</strong><br>
                  Email: <a href="mailto:${data.email}">${data.email}</a><br>
                  ${data.company ? `Company: ${data.company}` : ''}
                </div>
              </div>

              <div class="field">
                <div class="label">Purpose:</div>
                <div class="value">${data.purpose || 'Not specified'}</div>
              </div>

              ${data.message ? `
              <div class="field">
                <div class="label">Additional Message:</div>
                <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Access Token:</div>
                <div class="value"><code>${data.accessToken}</code></div>
              </div>

              <div class="footer">
                <p>This resume request was generated from your portfolio website.</p>
                <p>Access token: ${data.accessToken}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Resume Request

Requestor Information:
Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}\n` : ''}

Purpose: ${data.purpose || 'Not specified'}

${data.message ? `Additional Message:\n${data.message}\n` : ''}

Access Token: ${data.accessToken}

---
This resume request was generated from your portfolio website.
      `.trim()
    };
  }

  private formatSkillEndorsementEmail(data: any): { subject: string; html: string; text: string } {
    return {
      subject: `⭐ New Skill Endorsement from ${data.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #d97706; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .rating { font-size: 24px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⭐ New Skill Endorsement</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Endorser Information:</div>
                <div class="value">
                  <strong>${data.name}</strong><br>
                  Email: <a href="mailto:${data.email}">${data.email}</a>
                </div>
              </div>

              <div class="field">
                <div class="label">Skill ID:</div>
                <div class="value">${data.skillId}</div>
              </div>

              <div class="field">
                <div class="label">Rating:</div>
                <div class="value rating">${'⭐'.repeat(data.rating || 5)}</div>
              </div>

              ${data.comment ? `
              <div class="field">
                <div class="label">Comment:</div>
                <div class="value">${data.comment.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}

              <div class="footer">
                <p>This endorsement was submitted from your portfolio website.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Skill Endorsement

Endorser Information:
Name: ${data.name}
Email: ${data.email}

Skill ID: ${data.skillId}
Rating: ${'⭐'.repeat(data.rating || 5)}

${data.comment ? `Comment:\n${data.comment}\n` : ''}

---
This endorsement was submitted from your portfolio website.
      `.trim()
    };
  }

  async sendNotification(notification: EmailNotification): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email notification.');
      return false;
    }

    try {
      // Ensure Brevo is loaded
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) {
          console.error('Brevo API instance not initialized');
          return false;
        }
      }

      let emailContent: { subject: string; html: string; text: string };

      switch (notification.type) {
        case 'contact':
          emailContent = this.formatContactEmail(notification.data);
          break;
        case 'quote':
          emailContent = this.formatQuoteRequestEmail(notification.data);
          break;
        case 'resume':
          emailContent = this.formatResumeRequestEmail(notification.data);
          break;
        case 'skill-endorsement':
          emailContent = this.formatSkillEndorsementEmail(notification.data);
          break;
        default:
          console.warn(`Unknown notification type: ${notification.type}`);
          return false;
      }

      // Get Brevo module dynamically
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = emailContent.subject;
      sendSmtpEmail.htmlContent = emailContent.html;
      sendSmtpEmail.textContent = emailContent.text;
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail
      };
      sendSmtpEmail.to = [{
        email: this.adminEmail
      }];
      sendSmtpEmail.replyTo = {
        email: notification.data.email || this.adminEmail
      };

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Email notification sent successfully for ${notification.type} from ${notification.data.email || notification.data.name}`);
      console.log(`   Brevo message ID: ${result.messageId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending email notification:', error);
      if (error.response) {
        console.error('Brevo error details:', error.response.body);
      } else if (error.body) {
        console.error('Brevo error details:', error.body);
      }
      return false;
    }
  }

  /** Send invoice reminder to the recipient (customer) */
  async sendInvoiceReminder(data: {
    to: string;
    invoiceNumber: string;
    title: string;
    amountFormatted: string;
    dueDate?: string;
    payUrl: string;
  }): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping invoice reminder.');
      return false;
    }
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = `Reminder: Invoice ${data.invoiceNumber} – ${data.title}`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; }
            .amount { font-size: 1.5rem; font-weight: bold; color: #4f46e5; }
            .button { display: inline-block; padding: 14px 28px; background: #6366f1; color: white !important; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Invoice reminder</h2>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">${data.invoiceNumber}</p>
            </div>
            <div class="content">
              <p>This is a friendly reminder that the following invoice is pending payment:</p>
              <p><strong>${data.title}</strong></p>
              <p class="amount">${data.amountFormatted}</p>
              ${data.dueDate ? `<p>Due date: <strong>${data.dueDate}</strong></p>` : ''}
              <p><a href="${data.payUrl}" class="button">Pay invoice</a></p>
              <div class="footer">
                <p>If you have already paid, please disregard this message.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Invoice reminder: ${data.invoiceNumber} - ${data.title}. Amount: ${data.amountFormatted}. Pay at: ${data.payUrl}`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Invoice reminder sent to ${data.to} for ${data.invoiceNumber}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending invoice reminder:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
