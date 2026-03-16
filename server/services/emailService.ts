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

interface DataDeletionPayload {
  email: string;
  name?: string;
  message?: string;
}

interface EmailNotification {
  type: 'contact' | 'quote' | 'resume' | 'recommendation' | 'skill-endorsement' | 'data-deletion';
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
      console.log(`📧 Email notifications: enabled (admin: ${this.adminEmail})`);
    } else {
      console.warn('⚠️  Email notifications: disabled. Form submissions (contact, resume, assessment) will not email you.');
      console.warn('   To enable: set BREVO_API_KEY and ADMIN_EMAIL in .env.local (or production env). See .env.example.');
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

  /** Re-apply API key before send (handles serverless cold start / env available later). */
  private async ensureBrevoAuth() {
    const brevoModule = await getBrevo();
    const defaultClient = brevoModule.ApiClient.instance;
    const auth = defaultClient.authentications['api-key'];
    if (auth) auth.apiKey = process.env.BREVO_API_KEY;
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

  private formatDataDeletionEmail(data: DataDeletionPayload): { subject: string; html: string; text: string } {
    const name = data.name || 'Not provided';
    return {
      subject: `🗑️ Data deletion request from ${data.email}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #fecaca; border-top: none; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #991b1b; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #fecaca; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🗑️ Data deletion request</h2>
            </div>
            <div class="content">
              <p><strong>A user has requested that their personal data be removed.</strong></p>
              <div class="field">
                <div class="label">Email (required for processing):</div>
                <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
              </div>
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              ${data.message ? `
              <div class="field">
                <div class="label">Additional message:</div>
                <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}
              <div class="footer">
                <p>Process this request in line with your Privacy Policy and data retention procedures. Reply to the user at the email above to confirm once completed.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Data deletion request

Email: ${data.email}
Name: ${name}
${data.message ? `Message:\n${data.message}\n` : ''}
---
Process this request per your Privacy Policy. Reply to the user to confirm when done.
      `.trim()
    };
  }

  async sendNotification(notification: EmailNotification): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email notification (set BREVO_API_KEY and ADMIN_EMAIL).');
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
        case 'data-deletion':
          emailContent = this.formatDataDeletionEmail(notification.data as DataDeletionPayload);
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

      await this.ensureBrevoAuth();
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Email notification sent successfully for ${notification.type} from ${notification.data.email || notification.data.name}`);
      console.log(`   Brevo message ID: ${result.messageId}`);
      return true;
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status ?? error?.response?.statusCode;
      console.error('❌ Error sending email notification:', error?.message ?? error);
      if (status === 401) {
        console.error(
          '   Brevo returned 401 Unauthorized. Fix: Use the API Key from Brevo (Settings → API Keys), not the SMTP password. ' +
          'Ensure BREVO_API_KEY in .env is correct and the key has not been revoked.'
        );
      }
      if (error?.response?.body) {
        console.error('   Brevo response:', error.response.body);
      } else if (error?.body) {
        console.error('   Brevo response:', error.body);
      }
      return false;
    }
  }

  /** Send proposal-ready email to client with view link and next steps (matches professional proposal workflow). */
  async sendProposalToClient(data: {
    to: string;
    clientName: string;
    projectName: string;
    viewUrl: string;
  }): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping proposal email to client.');
      return false;
    }
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = `Your professional proposal: ${data.projectName}`;
      const nextSteps = [
        'Review proposal',
        'Confirm Phase 1 (or project) approval',
        'Sign agreement',
        'Submit initial deposit',
        'Schedule kickoff',
      ];
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; }
            .button { display: inline-block; padding: 14px 28px; background: #6366f1; color: white !important; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600; }
            .steps { margin: 16px 0; padding-left: 20px; }
            .steps li { margin: 8px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Professional proposal ready</h2>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">${data.projectName}</p>
            </div>
            <div class="content">
              <p>Hi ${data.clientName},</p>
              <p>Your proposal for <strong>${data.projectName}</strong> is ready to review. You can view the full proposal, including phases, timeline, and investment, at the link below.</p>
              <p><a href="${data.viewUrl}" class="button">View your proposal</a></p>
              <p><strong>Next steps:</strong></p>
              <ol class="steps">
                ${nextSteps.map(s => `<li>${s}</li>`).join('')}
              </ol>
              <p>After you review, sign in to the same link (or from your client dashboard) to confirm approval. We’ll then send the agreement and coordinate deposit and kickoff.</p>
              <div class="footer">
                <p>If you have any questions, reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Hi ${data.clientName},\n\nYour proposal for ${data.projectName} is ready.\n\nView your proposal: ${data.viewUrl}\n\nNext steps:\n${nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nAfter you review, sign in to confirm approval. We'll then send the agreement and coordinate deposit and kickoff.`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Proposal email sent to client ${data.to} for ${data.projectName}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending proposal email to client:', error?.message ?? error);
      return false;
    }
  }

  /** Notify admin that client accepted the proposal. */
  async sendProposalAcceptedToAdmin(data: { clientName: string; clientEmail: string; projectName: string }): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = `Proposal accepted: ${data.projectName} – ${data.clientName}`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#10b981;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;}</style></head>
        <body>
          <div class="container">
            <div class="header"><h2 style="margin:0;">Proposal accepted</h2></div>
            <div class="content">
              <p><strong>${data.clientName}</strong> (${data.clientEmail}) has accepted the proposal for <strong>${data.projectName}</strong>.</p>
              <p><strong>Next steps:</strong> Send agreement → Collect initial deposit → Schedule kickoff.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Proposal accepted: ${data.projectName}. Client: ${data.clientName} (${data.clientEmail}). Next steps: Send agreement, collect deposit, schedule kickoff.`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: this.adminEmail }];
      sendSmtpEmail.replyTo = { email: data.clientEmail };
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Proposal-accepted notification sent to admin for ${data.projectName}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending proposal-accepted email to admin:', error?.message ?? error);
      return false;
    }
  }

  /** Send confirmation to client after they accept (next steps: sign agreement, deposit, kickoff). */
  async sendProposalAcceptedToClient(data: { to: string; clientName: string; projectName: string }): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = `Thank you – proposal accepted for ${data.projectName}`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#10b981;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;}.steps{margin:16px 0;padding-left:20px;}.steps li{margin:8px 0;}</style></head>
        <body>
          <div class="container">
            <div class="header"><h2 style="margin:0;">Thank you for accepting</h2></div>
            <div class="content">
              <p>Hi ${data.clientName},</p>
              <p>We’ve received your approval for <strong>${data.projectName}</strong>. Next steps:</p>
              <ol class="steps">
                <li>We’ll send the agreement for your signature.</li>
                <li>Submit initial deposit to begin.</li>
                <li>Schedule kickoff to discuss project details.</li>
              </ol>
              <p>We’ll be in touch shortly to complete these steps.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Hi ${data.clientName}, we've received your approval for ${data.projectName}. Next steps: We'll send the agreement, you submit the initial deposit, and we'll schedule the kickoff. We'll be in touch shortly.`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Proposal-accepted confirmation sent to client ${data.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending proposal-accepted confirmation to client:', error?.message ?? error);
      return false;
    }
  }

  /** Send deposit invoice to client after proposal acceptance (pay link + portal link). */
  async sendDepositInvoiceToClient(data: {
    to: string;
    clientName: string;
    projectName: string;
    amountFormatted: string;
    payUrl: string;
    invoiceNumber: string;
  }): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = `Deposit invoice for ${data.projectName} – ${data.invoiceNumber}`;
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; }
            .amount { font-size: 1.5rem; font-weight: bold; color: #059669; }
            .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Deposit invoice</h2>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">${data.projectName}</p>
            </div>
            <div class="content">
              <p>Hi ${data.clientName},</p>
              <p>Thank you for accepting the proposal for <strong>${data.projectName}</strong>. Your deposit invoice is ready.</p>
              <p class="amount">${data.amountFormatted}</p>
              <p>Invoice number: <strong>${data.invoiceNumber}</strong></p>
              <p><a href="${data.payUrl}" class="button">Pay deposit</a></p>
              <p>You can also view and pay this invoice from your client dashboard.</p>
              <div class="footer">
                <p>If you have any questions, reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Hi ${data.clientName}, your deposit invoice for ${data.projectName} is ready. Amount: ${data.amountFormatted}. Invoice: ${data.invoiceNumber}. Pay at: ${data.payUrl}`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Deposit invoice email sent to ${data.to} for ${data.projectName}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending deposit invoice email:', error?.message ?? error);
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
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Invoice reminder sent to ${data.to} for ${data.invoiceNumber}`);
      return true;
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      console.error('❌ Error sending invoice reminder:', error?.message ?? error);
      if (status === 401) {
        console.error('   Brevo 401: Use API Key from Brevo Settings → API Keys (not SMTP password). Check BREVO_API_KEY.');
      }
      return false;
    }
  }

  /** Notify a user that their admin access has been approved and they can log in. */
  async sendAdminApprovalNotification(data: { to: string; username: string }): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping admin approval notification.');
      return false;
    }
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const loginUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = 'Your admin access has been approved – Ascendra Technologies';
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Admin access approved</h2>
            </div>
            <div class="content">
              <p>Hi ${data.username},</p>
              <p>Your request for founder admin access has been approved. You can now sign in to the admin dashboard.</p>
              <p><a href="${loginUrl}/auth" class="button">Sign in</a></p>
              <p>Or open this link in your browser: <span style="word-break: break-all; color: #667eea;">${loginUrl}/auth</span></p>
              <p>Use the same username and password you used when you registered.</p>
              <div class="footer">
                <p>This is an automated message. If you did not request admin access, please contact support.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Hi ${data.username},\n\nYour request for founder admin access has been approved. You can now sign in to the admin dashboard.\n\nSign in: ${loginUrl}/auth\n\nUse the same username and password you used when you registered.\n\nThis is an automated message. If you did not request admin access, please contact support.`;
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Admin approval notification sent to ${data.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending admin approval email:', error?.message ?? error);
      return false;
    }
  }

  /** Send a direct message (admin → recipient). Used for admin chat + email/SMS/push delivery. */
  async sendDirectMessageEmail(data: { to: string; subject: string; body: string; senderName?: string }): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      if (!this.apiInstance) {
        await this.initializeBrevo();
        if (!this.apiInstance) return false;
      }
      const brevoModule = await getBrevo();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = data.subject;
      const safeBody = (data.body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}</style></head>
        <body>
          <p>${safeBody}</p>
          <p style="margin-top:24px;font-size:12px;color:#666;">Direct message from ${data.senderName || this.fromName}</p>
        </body>
        </html>`;
      sendSmtpEmail.textContent = data.body || '';
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: data.to }];
      await this.ensureBrevoAuth();
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Direct message email sent to ${data.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending direct message email:', error?.message ?? error);
      return false;
    }
  }
}

export const emailService = new EmailService();
