import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getIpAddress } from "@/lib/auth-helpers";

// Track blog post view
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
    
    // Get or create session ID
    let sessionId = req.cookies.get("blog_session_id")?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    
    // Get client info
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    
    // Check if this session already viewed this post (to avoid duplicate views)
    const existingViews = await storage.getBlogPostViews(post.id);
    const existingView = existingViews.find(v => v.sessionId === sessionId && v.postId === post.id);
    
    let view;
    if (existingView) {
      // Update existing view
      view = await storage.updateBlogPostView(existingView.id, {
        maxScrollDepth: Math.max(existingView.maxScrollDepth || 0, body.scrollDepth || 0),
        timeSpent: (existingView.timeSpent || 0) + (body.timeSpent || 0),
        readComplete: body.readComplete || existingView.readComplete,
        scrollEvents: body.scrollEvents || existingView.scrollEvents,
      });
    } else {
      // Create new view
      view = await storage.trackBlogPostView({
        postId: post.id,
        sessionId,
        ipAddress,
        userAgent,
        referrer,
        maxScrollDepth: body.scrollDepth || 0,
        timeSpent: body.timeSpent || 0,
        readComplete: body.readComplete || false,
        scrollEvents: body.scrollEvents || [],
      });
      
      // Increment view count on blog post
      await storage.incrementBlogPostViewCount(post.id);
    }
    
    const response = NextResponse.json({ success: true, view });
    
    // Set session cookie (expires in 30 days)
    if (!req.cookies.get("blog_session_id")) {
      response.cookies.set("blog_session_id", sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    
    return response;
  } catch (error: any) {
    console.error("Error tracking blog post view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

// Get analytics for a blog post (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get the blog post
    const post = await storage.getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    
    // Get analytics
    const analytics = await storage.getBlogPostAnalytics(post.id);
    const views = await storage.getBlogPostViews(post.id);
    
    // Calculate click/interaction metrics
    let totalClicks = 0;
    let internalLinkClicks = 0;
    let externalLinkClicks = 0;
    let shareClicks = 0;
    
    views.forEach(view => {
      const clicks = view.scrollEvents?.filter((e: any) => e?.type === "click") || [];
      totalClicks += clicks.length;
      internalLinkClicks += clicks.filter((c: any) => c.clickType === "internal_link").length;
      externalLinkClicks += clicks.filter((c: any) => c.clickType === "external_link").length;
      shareClicks += clicks.filter((c: any) => c.clickType?.startsWith("share_")).length;
    });
    
    return NextResponse.json({
      ...analytics,
      totalClicks,
      internalLinkClicks,
      externalLinkClicks,
      shareClicks,
      views: views.slice(0, 100).sort((a, b) => 
        new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      ), // Limit to last 100 views, sorted by most recent
    });
  } catch (error: any) {
    console.error("Error fetching blog post analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
