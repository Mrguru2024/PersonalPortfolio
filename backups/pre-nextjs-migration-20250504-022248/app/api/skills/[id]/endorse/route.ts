import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { skillEndorsements, skills } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";
import { skillEndorsementFormSchema } from "@/shared/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillId = parseInt(params.id);
    
    if (isNaN(skillId)) {
      return NextResponse.json(
        { error: "Invalid skill ID" },
        { status: 400 }
      );
    }

    // Get skill to make sure it exists
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, skillId));
      
    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    
    // Get and validate request body
    const body = await request.json();
    
    // Validate using Zod schema
    const result = skillEndorsementFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid endorsement data", issues: result.error.format() },
        { status: 400 }
      );
    }
    
    // Create the endorsement
    const now = new Date();
    const [endorsement] = await db
      .insert(skillEndorsements)
      .values({
        skillId,
        name: body.name,
        email: body.email,
        comment: body.comment || null,
        rating: body.rating,
        createdAt: now,
        ipAddress: request.headers.get("x-forwarded-for") || request.ip || null
      })
      .returning();
      
    // Update the endorsement count on the skill
    await db
      .update(skills)
      .set({
        endorsement_count: sql`${skills.endorsement_count} + 1`
      })
      .where(eq(skills.id, skillId));
    
    return NextResponse.json(endorsement, { status: 201 });
  } catch (error) {
    console.error("Error creating endorsement:", error);
    return NextResponse.json(
      { error: "Failed to create endorsement" },
      { status: 500 }
    );
  }
}