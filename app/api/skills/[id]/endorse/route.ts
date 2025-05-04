import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { skillEndorsements, skills } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { skillEndorsementFormSchema } from "@/shared/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert ID to number
    const skillId = parseInt(params.id);
    
    if (isNaN(skillId)) {
      return NextResponse.json(
        { error: "Invalid skill ID" },
        { status: 400 }
      );
    }
    
    // Check if skill exists
    const [existingSkill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, skillId));
    
    if (!existingSkill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate the input data
    const validationResult = skillEndorsementFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    
    // Insert endorsement
    const [endorsement] = await db
      .insert(skillEndorsements)
      .values({
        skillId,
        name: body.name,
        email: body.email,
        comment: body.comment,
        rating: body.rating,
        ipAddress: ip,
      })
      .returning();
    
    // Update endorsement count on the skill
    await db
      .update(skills)
      .set({
        endorsement_count: existingSkill.endorsement_count + 1
      })
      .where(eq(skills.id, skillId));
    
    return NextResponse.json(endorsement, { status: 201 });
  } catch (error) {
    console.error("Error submitting endorsement:", error);
    return NextResponse.json(
      { error: "Failed to submit endorsement" },
      { status: 500 }
    );
  }
}