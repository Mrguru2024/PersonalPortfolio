import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

// Define the validation schema
const skillEndorsementSchema = z.object({
  skillId: z.number().positive("Skill ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body using Zod schema
    const validationResult = skillEndorsementSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const endorsementData = validationResult.data;
    const clientIp = request.headers.get('x-forwarded-for') || '0.0.0.0';
    
    // Check if the skill exists
    const [skillExists] = await db
      .select()
      .from(db.schema.skills)
      .where(eq(db.schema.skills.id, endorsementData.skillId));
      
    if (!skillExists) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    
    // Check if user has already endorsed this skill
    const [existingEndorsement] = await db
      .select()
      .from(db.schema.skillEndorsements)
      .where(
        and(
          eq(db.schema.skillEndorsements.skillId, endorsementData.skillId),
          eq(db.schema.skillEndorsements.email, endorsementData.email)
        )
      );
    
    if (existingEndorsement) {
      return NextResponse.json(
        { error: "You have already endorsed this skill" },
        { status: 409 }
      );
    }
    
    // Insert new endorsement
    const [endorsement] = await db
      .insert(db.schema.skillEndorsements)
      .values({
        skillId: endorsementData.skillId,
        name: endorsementData.name,
        email: endorsementData.email,
        comment: endorsementData.comment || null,
        rating: endorsementData.rating,
        ipAddress: clientIp,
      })
      .returning();
    
    // Update endorsement count in the skills table
    await db
      .update(db.schema.skills)
      .set({ 
        endorsementCount: skillExists.endorsementCount + 1 
      })
      .where(eq(db.schema.skills.id, endorsementData.skillId));
    
    return NextResponse.json(
      { message: "Skill endorsed successfully", endorsement },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating skill endorsement:", error);
    return NextResponse.json(
      { error: "Failed to process endorsement" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const skillId = url.searchParams.get("skillId");
    
    if (!skillId || isNaN(parseInt(skillId))) {
      return NextResponse.json(
        { error: "Valid skill ID is required" },
        { status: 400 }
      );
    }
    
    // Get endorsements for the specified skill
    const endorsements = await db
      .select()
      .from(db.schema.skillEndorsements)
      .where(eq(db.schema.skillEndorsements.skillId, parseInt(skillId)))
      .orderBy(db.schema.skillEndorsements.createdAt);
    
    return NextResponse.json(endorsements);
    
  } catch (error) {
    console.error("Error fetching skill endorsements:", error);
    return NextResponse.json(
      { error: "Failed to fetch endorsements" },
      { status: 500 }
    );
  }
}