import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";
import { skillEndorsements } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get skill ID from query parameter
    const skillId = request.nextUrl.searchParams.get('skillId');
    
    if (!skillId || isNaN(parseInt(skillId))) {
      return NextResponse.json(
        { error: "Valid skillId parameter is required" },
        { status: 400 }
      );
    }
    
    // Query endorsements for the specified skill
    const endorsements = await db.query.skillEndorsements.findMany({
      where: eq(skillEndorsements.skillId, parseInt(skillId)),
      orderBy: (endorsements, { desc }) => [desc(endorsements.createdAt)]
    });
    
    return NextResponse.json(endorsements);
  } catch (error) {
    console.error("Error fetching skill endorsements:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill endorsements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.skillId || !data.name || !data.email || data.rating === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate rating range (1-5)
    if (data.rating < 1 || data.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Get client IP address (for rate limiting/spam prevention)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    
    // Create the endorsement
    const now = new Date();
    const newEndorsement = await db.insert(skillEndorsements).values({
      skillId: data.skillId,
      name: data.name,
      email: data.email,
      comment: data.comment || null,
      rating: data.rating,
      ipAddress: ipAddress || undefined,
      // Don't specify createdAt - it has a defaultNow() in the schema
    }).returning();
    
    return NextResponse.json(newEndorsement[0], { status: 201 });
  } catch (error) {
    console.error("Error creating skill endorsement:", error);
    return NextResponse.json(
      { error: "Failed to create skill endorsement" },
      { status: 500 }
    );
  }
}