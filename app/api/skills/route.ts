import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";
import { skills, skillEndorsements } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get optional category query parameter
    const category = request.nextUrl.searchParams.get('category');
    
    let skillsData;
    
    if (category) {
      // Query skills filtered by category
      skillsData = await db.query.skills.findMany({
        where: eq(skills.category, category),
        with: {
          endorsements: true
        },
        orderBy: (skills, { desc }) => [desc(skills.percentage)]
      });
    } else {
      // Query all skills with their endorsements
      skillsData = await db.query.skills.findMany({
        with: {
          endorsements: true
        },
        orderBy: (skills, { desc }) => [desc(skills.percentage)]
      });
    }
    
    return NextResponse.json(skillsData);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request body
    if (!data.name || !data.category || data.proficiency === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Add new skill (requires authentication/authorization in production)
    const newSkill = await db.insert(skills).values({
      name: data.name,
      category: data.category,
      percentage: data.proficiency, // Match the schema's field name
      endorsementCount: 0,
    }).returning();
    
    return NextResponse.json(newSkill[0], { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}