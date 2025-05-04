import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../app/db";
import { skills } from "@/shared/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Fetch all skills from the database
    const allSkills = await db.select().from(skills).orderBy(asc(skills.id));
    
    return NextResponse.json(allSkills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}