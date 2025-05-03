import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { contacts, contactFormSchema } from '@/shared/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate form data with Zod schema
    const result = contactFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid contact data', errors: result.error.format() }, 
        { status: 400 }
      );
    }
    
    const { name, email, phone, subject, message } = result.data;
    
    const db = getDb();
    const [contact] = await db.insert(contacts)
      .values({
        name,
        email,
        phone,
        subject,
        message,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        createdAt: new Date(),
      })
      .returning();
    
    // In a real application, you would send an email notification here
    // using SendGrid or another email service
    
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { message: 'An error occurred while submitting the contact form' }, 
      { status: 500 }
    );
  }
}