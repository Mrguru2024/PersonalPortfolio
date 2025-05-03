import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { contacts } from '../../../shared/schema';
import { z } from 'zod';
import { contactFormSchema } from '../../../shared/schema';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against the Zod schema
    const result = contactFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { name, email, subject, message, phone, company } = result.data;
    const { db } = getDb();
    
    // Store contact form submission in database
    const [contact] = await db.insert(contacts).values({
      name,
      email,
      subject,
      message,
      phone: phone || null,
      company: company || null,
      createdAt: new Date(),
      isRead: false
    }).returning();
    
    // Send email notification if Resend API key is available
    if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
      
      // Send email to site owner
      await resend.emails.send({
        from: fromEmail,
        to: process.env.CONTACT_EMAIL,
        subject: `New contact form submission: ${subject}`,
        text: `
          Name: ${name}
          Email: ${email}
          ${phone ? `Phone: ${phone}` : ''}
          ${company ? `Company: ${company}` : ''}
          Subject: ${subject}
          
          Message:
          ${message}
        `,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
      
      // Send confirmation email to submitter
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'We received your message - MrGuru.dev',
        text: `
          Hi ${name},
          
          Thank you for reaching out! This is a confirmation that we've received your message:
          
          Subject: ${subject}
          
          I'll review your message and get back to you as soon as possible.
          
          Best regards,
          Anthony "MrGuru" Feaster
          MrGuru.dev
        `,
        html: `
          <h2>Thank you for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>This is a confirmation that we've received your message with the subject: <strong>${subject}</strong></p>
          <p>I'll review your message and get back to you as soon as possible.</p>
          <p>Best regards,<br>
          Anthony "MrGuru" Feaster<br>
          <a href="https://mrguru.dev">MrGuru.dev</a></p>
        `
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contact form submitted successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: 'There was an error processing your request'
    }, { status: 500 });
  }
}