import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db";
import { skills } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";

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
    
    // Query the skill by ID
    const [skill] = await db
      .select({
        id: skills.id,
        name: skills.name,
        category: skills.category,
        // Map proficiency to percentage for API compatibility
        percentage: skills.proficiency,
        // In Next.js app we don't have endorsement_count in the schema yet
        // Use a literal 0 as fallback
        endorsement_count: sql`COALESCE(0, 0)`.as('endorsement_count')
      })
      .from(skills)
      .where(eq(skills.id, skillId));
    
    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error fetching skill:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill" },
      { status: 500 }
    );
  }
}