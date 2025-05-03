import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db";
import { skills } from "@/shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const sort = url.searchParams.get("sort") || "desc";
    const limit = url.searchParams.get("limit");
    
    let query = db.select().from(skills);
    
    // Filter by category if specified
    if (category) {
      query = query.where(eq(skills.category, category));
    }
    
    // Apply sorting
    if (sort === "asc") {
      query = query.orderBy(asc(skills.percentage));
    } else {
      query = query.orderBy(desc(skills.percentage));
    }
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const result = await query;
    
    // Group skills by category
    const grouped = result.reduce((acc: any, skill: any) => {
      const category = skill.category.toLowerCase();
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});
    
    // Return grouped format if requested
    if (url.searchParams.get("grouped") === "true") {
      return NextResponse.json(grouped);
    }
    
    return NextResponse.json(result);
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
    // Check if user is admin (you would implement proper auth checking)
    
    const body = await request.json();
    
    // Validate skill data
    if (!body.name || !body.percentage || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create new skill
    const [skill] = await db.insert(skills).values({
      name: body.name,
      percentage: body.percentage,
      category: body.category,
      endorsementCount: 0
    }).returning();
    
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}