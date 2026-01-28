import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

// Track click/interaction on blog post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    
    // Get the blog post
    const post = await storage.getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    
    // Get session ID
    const sessionId = req.cookies.get("blog_session_id")?.value;
    if (!sessionId) {
      // If no session, create one (but don't track this as a view)
      return NextResponse.json({ success: true, message: "No session" });
    }
    
    // Store click/interaction data
    // For now, we'll store this in the scrollEvents or create a separate tracking mechanism
    // This is a simple implementation - you could expand this to a separate clicks table
    const views = await storage.getBlogPostViews(post.id);
    const view = views.find(v => v.sessionId === sessionId && v.postId === post.id);
    
    if (view) {
      // Update the view with click/interaction data
      // Store clicks in scrollEvents array for tracking
      const currentEvents = (view.scrollEvents || []) as Array<{ timestamp: number; depth: number; type?: string; clickType?: string; href?: string }>;
      currentEvents.push({
        timestamp: Date.now(),
        depth: view.maxScrollDepth || 0,
        type: "click",
        clickType: body.type,
        href: body.href || null,
      });
      
      await storage.updateBlogPostView(view.id, {
        scrollEvents: currentEvents.slice(-100), // Keep last 100 events
        lastActivityAt: new Date(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking click:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
