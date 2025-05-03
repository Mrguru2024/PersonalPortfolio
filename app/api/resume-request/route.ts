import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { resumeRequests } from '../../../shared/schema';
import { resumeRequestFormSchema } from '../../../shared/schema';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against the Zod schema
    const result = resumeRequestFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { name, email, reason } = result.data;
    const { db } = getDb();
    
    // Generate a unique download token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Store resume request in database
    const [resumeRequest] = await db.insert(resumeRequests).values({
      name,
      email,
      reason,
      token,
      isDownloaded: false,
      createdAt: new Date(),
      downloadedAt: null
    }).returning();
    
    // Generate the resume download URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/resume/download?token=${token}`;
    
    // Send email with resume download link if Resend API key is available
    if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
      
      // Send email to the user with download link
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Your Resume Download Link - MrGuru.dev',
        text: `
          Hi ${name},
          
          Thank you for your interest in my resume! You can download it using the link below:
          
          ${downloadUrl}
          
          This link will expire in 24 hours.
          
          Best regards,
          Anthony "MrGuru" Feaster
          MrGuru.dev
        `,
        html: `
          <h2>Your Resume Download Link</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your interest in my resume! You can download it using the button below:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${downloadUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Download Resume
            </a>
          </p>
          <p><strong>Note:</strong> This link will expire in 24 hours.</p>
          <p>Best regards,<br>
          Anthony "MrGuru" Feaster<br>
          <a href="https://mrguru.dev">MrGuru.dev</a></p>
        `
      });
      
      // Also notify site owner about the resume request
      if (process.env.CONTACT_EMAIL) {
        await resend.emails.send({
          from: fromEmail,
          to: process.env.CONTACT_EMAIL,
          subject: 'New Resume Download Request',
          text: `
            Name: ${name}
            Email: ${email}
            Reason: ${reason}
            
            A download link has been sent to the user.
          `,
          html: `
            <h2>New Resume Download Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>A download link has been sent to the user.</p>
          `
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Resume request submitted successfully. Check your email for the download link.', 
      downloadUrl: downloadUrl
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing resume request:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: 'There was an error processing your request'
    }, { status: 500 });
  }
}