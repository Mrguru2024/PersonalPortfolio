import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { contacts, contactFormSchema } from '../../../shared/schema';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Validate the form data
    const result = contactFormSchema.safeParse(formData);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid form data', errors: result.error.errors },
        { status: 400 }
      );
    }
    
    const { db } = getDb();
    
    // Create contact submission
    const [contact] = await db.insert(contacts)
      .values({
        ...result.data,
        createdAt: new Date().toISOString(),
      })
      .returning();
    
    // TODO: Send email notification if needed
    
    return NextResponse.json(
      { message: 'Contact form submitted successfully', id: contact.id },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { message: 'An error occurred while submitting the form' },
      { status: 500 }
    );
  }
}