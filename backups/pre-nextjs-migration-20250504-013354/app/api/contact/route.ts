import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { contacts, contactFormSchema } from '../../../shared/schema';
import { MailService } from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const { db } = getDb();
    const contactData = {
      ...result.data,
      createdAt: new Date(),
      status: 'pending',
    };

    // Save to database
    const [contact] = await db.insert(contacts).values(contactData).returning();

    // Send email notification if SendGrid API key is available
    if (process.env.SENDGRID_API_KEY) {
      const mailService = new MailService();
      mailService.setApiKey(process.env.SENDGRID_API_KEY);

      try {
        await mailService.send({
          to: process.env.ADMIN_EMAIL || 'admin@example.com',
          from: process.env.FROM_EMAIL || 'noreply@mrguru.dev',
          subject: `New Contact Form Submission from ${contactData.name}`,
          text: `
Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}
Message: ${contactData.message}
          `,
          html: `
<h1>New Contact Form Submission</h1>
<p><strong>Name:</strong> ${contactData.name}</p>
<p><strong>Email:</strong> ${contactData.email}</p>
<p><strong>Subject:</strong> ${contactData.subject}</p>
<p><strong>Message:</strong> ${contactData.message}</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Continue execution - we've already saved to the database
      }
    }

    return NextResponse.json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}