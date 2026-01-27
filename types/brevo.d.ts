declare module '@getbrevo/brevo' {
  export const ApiClient: any;
  export class TransactionalEmailsApi {
    sendTransacEmail(email: any): Promise<any>;
  }
  export class SendSmtpEmail {
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    sender?: { name: string; email: string };
    to?: Array<{ email: string }>;
    replyTo?: { email: string };
  }
}
