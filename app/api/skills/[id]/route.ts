import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db";
import { skills } from "@/shared/schema";
import { eq } from "drizzle-orm";

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
        percentage: skills.percentage,
        endorsement_count: skills.endorsement_count
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