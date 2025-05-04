import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";
import { skills } from "@/shared/schema";
import { eq, asc, sql } from "drizzle-orm";

// Import from lib/data for additional skills - these aren't stored in the database
import { additionalSkills } from "../../../app/lib/data";

export async function GET(request: NextRequest) {
  try {
    // Fetch all skills from the database
    const rawSkills = await db.select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      // Map proficiency to percentage for API compatibility
      percentage: skills.proficiency,
      // In Next.js app we don't have endorsement_count in the schema yet
      // Use a literal 0 as fallback
      endorsement_count: sql`COALESCE(0, 0)`.as('endorsement_count')
    }).from(skills).orderBy(asc(skills.id));
    
    // Group skills by category
    const frontend = rawSkills.filter(skill => skill.category === 'frontend');
    const backend = rawSkills.filter(skill => skill.category === 'backend');
    const devops = rawSkills.filter(skill => skill.category === 'devops');
    
    // Format response to match the Express API
    const response = {
      frontend,
      backend,
      devops,
      additional: additionalSkills
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}