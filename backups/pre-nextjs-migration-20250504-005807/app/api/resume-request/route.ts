import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { resumeRequests, resumeRequestFormSchema } from '../../../shared/schema';
import { randomBytes } from 'crypto';
import { MailService } from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resumeRequestFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const { db } = getDb();
    
    // Generate a unique token for this request
    const token = randomBytes(32).toString('hex');
    
    const requestData = {
      ...result.data,
      token,
      accessed: false,
      createdAt: new Date(),
      accessedAt: null,
    };

    // Save to database
    const [resumeRequest] = await db.insert(resumeRequests).values(requestData).returning();

    // Create the download URL
    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/api/resume/download?token=${token}`;

    // Send email with the download link if SendGrid API key is available
    if (process.env.SENDGRID_API_KEY) {
      const mailService = new MailService();
      mailService.setApiKey(process.env.SENDGRID_API_KEY);

      try {
        await mailService.send({
          to: requestData.email,
          from: process.env.FROM_EMAIL || 'noreply@mrguru.dev',
          subject: 'Your Resume Download Link',
          text: `
Hello ${requestData.name},

Thank you for your interest in my resume! You can download it using the link below:

${downloadUrl}

This link will expire in 7 days.

Best regards,
Anthony "MrGuru" Feaster
          `,
          html: `
<h1>Your Resume Download Link</h1>
<p>Hello ${requestData.name},</p>
<p>Thank you for your interest in my resume! You can download it using the link below:</p>
<p><a href="${downloadUrl}" target="_blank">Download Resume</a></p>
<p>This link will expire in 7 days.</p>
<p>Best regards,<br>Anthony "MrGuru" Feaster</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending resume download email:', emailError);
        // Continue execution - we've already saved to the database
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resume request submitted successfully', 
      downloadUrl, 
    });
  } catch (error) {
    console.error('Error processing resume request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}