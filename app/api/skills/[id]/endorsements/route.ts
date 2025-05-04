import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { skillEndorsements } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
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
    
    // Query the endorsements for this skill
    const endorsements = await db
      .select({
        id: skillEndorsements.id,
        skillId: skillEndorsements.skillId,
        name: skillEndorsements.name,
        comment: skillEndorsements.comment,
        rating: skillEndorsements.rating,
        createdAt: skillEndorsements.createdAt
      })
      .from(skillEndorsements)
      .where(eq(skillEndorsements.skillId, skillId))
      .orderBy(desc(skillEndorsements.createdAt));
    
    return NextResponse.json(endorsements);
  } catch (error) {
    console.error("Error fetching skill endorsements:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill endorsements" },
      { status: 500 }
    );
  }
}