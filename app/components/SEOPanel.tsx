"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Link2, 
  ExternalLink, 
  TrendingUp, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  X,
  Eye,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SEOPanelProps {
  title: string;
  summary: string;
  content: string;
  slug: string;
  coverImage: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  internalLinks: Array<{ text: string; url: string; postId?: number }>;
  externalLinks: Array<{ text: string; url: string; nofollow?: boolean }>;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  relatedPosts: number[];
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onCanonicalUrlChange: (value: string) => void;
  onInternalLinksChange: (links: Array<{ text: string; url: string; postId?: number }>) => void;
  onExternalLinksChange: (links: Array<{ text: string; url: string; nofollow?: boolean }>) => void;
  onOgTitleChange: (value: string) => void;
  onOgDescriptionChange: (value: string) => void;
  onOgImageChange: (value: string) => void;
  onTwitterCardChange: (value: string) => void;
  onRelatedPostsChange: (posts: number[]) => void;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
}

export function SEOPanel({
  title,
  summary,
  content,
  slug,
  coverImage,
  tags,
  metaTitle,
  metaDescription,
  keywords,
  canonicalUrl,
  internalLinks,
  externalLinks,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard,
  relatedPosts,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onKeywordsChange,
  onCanonicalUrlChange,
  onInternalLinksChange,
  onExternalLinksChange,
  onOgTitleChange,
  onOgDescriptionChange,
  onOgImageChange,
  onTwitterCardChange,
  onRelatedPostsChange,
}: SEOPanelProps) {
  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState<string[]>([]);
  const [internalLinkText, setInternalLinkText] = useState("");
  const [internalLinkUrl, setInternalLinkUrl] = useState("");
  const [externalLinkText, setExternalLinkText] = useState("");
  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [showInternalLinkForm, setShowInternalLinkForm] = useState(false);
  const [showExternalLinkForm, setShowExternalLinkForm] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  // Fetch all blog posts for internal linking
  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const response = await apiRequest<BlogPost[]>("GET", "/api/blog");
      return await response.json();
    },
  });

  // Calculate SEO score
  useEffect(() => {
    let score = 0;
    const issues: string[] = [];

    // Title optimization (0-20 points)
    if (metaTitle || title) {
      const titleText = metaTitle || title;
      if (titleText.length >= 30 && titleText.length <= 60) {
        score += 20;
      } else if (titleText.length > 0) {
        score += 10;
        issues.push(titleText.length < 30 ? "Title is too short (aim for 30-60 characters)" : "Title is too long (aim for 30-60 characters)");
      }
    } else {
      issues.push("Missing meta title");
    }

    // Meta description (0-20 points)
    if (metaDescription || summary) {
      const descText = metaDescription || summary;
      if (descText.length >= 120 && descText.length <= 160) {
        score += 20;
      } else if (descText.length > 0) {
        score += 10;
        issues.push(descText.length < 120 ? "Meta description is too short (aim for 120-160 characters)" : "Meta description is too long (aim for 120-160 characters)");
      }
    } else {
      issues.push("Missing meta description");
    }

    // Keywords (0-10 points)
    if (keywords && keywords.length > 0) {
      score += Math.min(10, keywords.length * 2);
    } else if (tags && tags.length > 0) {
      score += Math.min(10, tags.length * 2);
    } else {
      issues.push("Add keywords or tags");
    }

    // Content length (0-15 points)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length >= 300) {
      score += 15;
    } else if (textContent.length >= 200) {
      score += 10;
      issues.push("Content could be longer (aim for 300+ words)");
    } else {
      issues.push("Content is too short (aim for 300+ words)");
    }

    // Internal links (0-10 points)
    if (internalLinks && internalLinks.length >= 2) {
      score += 10;
    } else if (internalLinks && internalLinks.length === 1) {
      score += 5;
      issues.push("Add more internal links (aim for 2+)");
    } else {
      issues.push("Add internal links to improve SEO");
    }

    // External links (0-10 points)
    if (externalLinks && externalLinks.length >= 1) {
      score += 10;
    } else {
      issues.push("Add external links for authority");
    }

    // Images (0-5 points)
    if (coverImage) {
      score += 5;
    } else {
      issues.push("Add a cover image");
    }

    // OG tags (0-10 points)
    if (ogTitle && ogDescription && ogImage) {
      score += 10;
    } else if (ogTitle || ogDescription || ogImage) {
      score += 5;
      issues.push("Complete Open Graph tags for better social sharing");
    } else {
      issues.push("Add Open Graph tags for social sharing");
    }

    setSeoScore(Math.min(100, score));
    setSeoIssues(issues);
  }, [title, metaTitle, summary, metaDescription, keywords, tags, content, internalLinks, externalLinks, coverImage, ogTitle, ogDescription, ogImage]);

  // Calculate reading time
  const calculateReadingTime = (text: string): number => {
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / 200); // Average reading speed: 200 words per minute
  };

  const readingTime = calculateReadingTime(content);

  const addInternalLink = () => {
    if (internalLinkText && internalLinkUrl) {
      onInternalLinksChange([...internalLinks, { text: internalLinkText, url: internalLinkUrl }]);
      setInternalLinkText("");
      setInternalLinkUrl("");
      setShowInternalLinkForm(false);
    }
  };

  const removeInternalLink = (index: number) => {
    onInternalLinksChange(internalLinks.filter((_, i) => i !== index));
  };

  const addExternalLink = () => {
    if (externalLinkText && externalLinkUrl) {
      onExternalLinksChange([...externalLinks, { text: externalLinkText, url: externalLinkUrl, nofollow: false }]);
      setExternalLinkText("");
      setExternalLinkUrl("");
      setShowExternalLinkForm(false);
    }
  };

  const removeExternalLink = (index: number) => {
    onExternalLinksChange(externalLinks.filter((_, i) => i !== index));
  };

  const toggleNofollow = (index: number) => {
    const updated = [...externalLinks];
    updated[index].nofollow = !updated[index].nofollow;
    onExternalLinksChange(updated);
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !keywords.includes(keyword)) {
      onKeywordsChange([...keywords, keyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    onKeywordsChange(keywords.filter(k => k !== keyword));
  };

  // Auto-fill from title/summary if empty
  useEffect(() => {
    if (!metaTitle && title) {
      onMetaTitleChange(title.length <= 60 ? title : title.substring(0, 57) + "...");
    }
  }, [title, metaTitle, onMetaTitleChange]);

  useEffect(() => {
    if (!metaDescription && summary) {
      onMetaDescriptionChange(summary.length <= 160 ? summary : summary.substring(0, 157) + "...");
    }
  }, [summary, metaDescription, onMetaDescriptionChange]);

  useEffect(() => {
    if (!ogTitle && metaTitle) {
      onOgTitleChange(metaTitle);
    }
  }, [metaTitle, ogTitle, onOgTitleChange]);

  useEffect(() => {
    if (!ogDescription && metaDescription) {
      onOgDescriptionChange(metaDescription);
    }
  }, [metaDescription, ogDescription, onOgDescriptionChange]);

  useEffect(() => {
    if (!ogImage && coverImage) {
      onOgImageChange(coverImage);
    }
  }, [coverImage, ogImage, onOgImageChange]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* SEO Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                SEO Score
              </CardTitle>
              <CardDescription>Overall SEO optimization score</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Your SEO score is calculated based on best practices: meta tags, content length, internal/external links, images, and social sharing tags. Aim for 80+ for optimal search engine visibility.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-right">
              <div className={cn(
                "text-3xl font-bold",
                seoScore >= 80 ? "text-green-600" : seoScore >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {seoScore}/100
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                seoScore >= 80 ? "bg-green-600" : seoScore >= 60 ? "bg-yellow-600" : "bg-red-600"
              )}
              style={{ width: `${seoScore}%` }}
            />
          </div>
          {seoIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Issues to fix:</p>
              <ul className="space-y-1">
                {seoIssues.slice(0, 5).map((issue, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Meta Tags
              </CardTitle>
              <CardDescription>Optimize your meta tags for search engines</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!title.trim()) {
                  return;
                }
                setIsGeneratingSEO(true);
                try {
                  const response = await apiRequest("POST", "/api/admin/blog/ai/generate-seo", {
                    title,
                    content: content.substring(0, 2000),
                  });
                  const data = await response.json();
                  if (data.metaTitle) onMetaTitleChange(data.metaTitle);
                  if (data.metaDescription) onMetaDescriptionChange(data.metaDescription);
                  if (data.keywords && data.keywords.length > 0) onKeywordsChange(data.keywords);
                  if (data.ogTitle) onOgTitleChange(data.ogTitle);
                  if (data.ogDescription) onOgDescriptionChange(data.ogDescription);
                } catch (error: any) {
                  console.error("Error generating SEO meta:", error);
                } finally {
                  setIsGeneratingSEO(false);
                }
              }}
              disabled={isGeneratingSEO || !title.trim()}
            >
              {isGeneratingSEO ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="meta-title">Meta Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The title that appears in search engine results. Keep it between 30-60 characters for optimal display. Include your main keyword near the beginning.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              placeholder="SEO optimized title (30-60 characters)"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metaTitle.length}/60 characters {metaTitle.length >= 30 && metaTitle.length <= 60 && <CheckCircle2 className="inline h-3 w-3 text-green-600" />}
            </p>
          </div>

          <div>
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder="Compelling description for search results (120-160 characters)"
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metaDescription.length}/160 characters {metaDescription.length >= 120 && metaDescription.length <= 160 && <CheckCircle2 className="inline h-3 w-3 text-green-600" />}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Keywords</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Add relevant keywords that describe your content. These help search engines understand your post&apos;s topic. Use 5-10 relevant keywords. Focus on terms your target audience would search for.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {keywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {tags.map((tag) => (
                !keywords.includes(tag) && (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addKeyword(tag)}
                  >
                    + {tag}
                  </Button>
                )
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="canonical-url">Canonical URL</Label>
            <Input
              id="canonical-url"
              value={canonicalUrl}
              onChange={(e) => onCanonicalUrlChange(e.target.value)}
              placeholder="https://yoursite.com/blog/post-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use default: /blog/{slug}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Internal Linking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Internal Links
              </CardTitle>
              <CardDescription>Link to other posts on your site to improve SEO and user engagement</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Internal links help search engines understand your site structure and keep readers engaged. Aim for 2-5 internal links per post. Link to related, high-quality content.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {internalLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{link.text}</p>
                <p className="text-xs text-muted-foreground">{link.url}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInternalLink(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {showInternalLinkForm ? (
            <div className="space-y-2 p-4 border rounded">
              <Input
                placeholder="Link text (anchor text)"
                value={internalLinkText}
                onChange={(e) => setInternalLinkText(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="/blog/post-slug or full URL"
                  value={internalLinkUrl}
                  onChange={(e) => setInternalLinkUrl(e.target.value)}
                />
                <Button type="button" onClick={addInternalLink}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowInternalLinkForm(false)}>Cancel</Button>
              </div>
              {allPosts && allPosts.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted-foreground">Quick select:</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Click on a post title to quickly add it as an internal link. This helps with SEO by creating a network of related content.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {allPosts
                      .filter((p) => p.slug !== slug) // Exclude current post
                      .slice(0, 5)
                      .map((post) => (
                        <Button
                          key={post.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInternalLinkUrl(`/blog/${post.slug}`);
                            setInternalLinkText(post.title);
                          }}
                        >
                          {post.title.substring(0, 30)}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInternalLinkForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Internal Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* External Links / Backlinks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                External Links & Backlinks
              </CardTitle>
              <CardDescription>Add external links to authoritative sources. Use nofollow for paid/sponsored links.</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>External links to authoritative sources build trust with search engines. Use &quot;nofollow&quot; for paid links, sponsored content, or untrusted sources. Regular links pass SEO value to the linked site.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {externalLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{link.text}</p>
                  {link.nofollow && (
                    <Badge variant="outline" className="text-xs">nofollow</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{link.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.nofollow}
                          onCheckedChange={() => toggleNofollow(index)}
                        />
                        <Label className="text-xs">Nofollow</Label>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Nofollow tells search engines not to pass SEO value to the linked site. Use for paid links, sponsored content, or untrusted sources. Regular links pass &quot;link juice&quot; which helps the linked site&apos;s SEO.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExternalLink(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {showExternalLinkForm ? (
            <div className="space-y-2 p-4 border rounded">
              <Input
                placeholder="Link text (anchor text)"
                value={externalLinkText}
                onChange={(e) => setExternalLinkText(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={externalLinkUrl}
                  onChange={(e) => setExternalLinkUrl(e.target.value)}
                />
                <Button type="button" onClick={addExternalLink}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowExternalLinkForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExternalLinkForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add External Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Sharing (Open Graph)
              </CardTitle>
              <CardDescription>Optimize how your post appears when shared on social media</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Open Graph tags control how your post appears when shared on Facebook, LinkedIn, Twitter, etc. Use a 1200x630px image for best results. These tags don&apos;t directly affect SEO but improve click-through rates.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="og-title">OG Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The title that appears when your post is shared on social media. If left empty, the meta title will be used.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="og-title"
              value={ogTitle}
              onChange={(e) => onOgTitleChange(e.target.value)}
              placeholder="Title for social media shares"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="og-description">OG Description</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The description that appears when your post is shared. Write something compelling to encourage clicks. If left empty, the meta description will be used.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="og-description"
              value={ogDescription}
              onChange={(e) => onOgDescriptionChange(e.target.value)}
              placeholder="Description for social media shares"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="og-image">OG Image URL</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The image that appears when your post is shared. Use 1200x630px for best results. If left empty, the cover image will be used.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="og-image"
              value={ogImage}
              onChange={(e) => onOgImageChange(e.target.value)}
              placeholder="Image URL for social media (1200x630px recommended)"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="twitter-card">Twitter Card Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Choose how your post appears on Twitter. &quot;Summary Large Image&quot; shows a large preview image (1200x630px recommended). &quot;Summary&quot; shows a smaller card without a large image.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <select
              id="twitter-card"
              value={twitterCard}
              onChange={(e) => onTwitterCardChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Select Twitter card type"
            >
              <option value="summary_large_image">Summary Large Image</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 border rounded bg-gray-50 dark:bg-gray-900">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="border rounded overflow-hidden bg-white dark:bg-gray-800">
              {ogImage && (
                <img src={ogImage} alt="OG Preview" className="w-full h-48 object-cover" />
              )}
              <div className="p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">yoursite.com</p>
                <p className="font-semibold text-sm mb-1">{ogTitle || title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{ogDescription || summary}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Reading Time</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated reading time: {readingTime} {readingTime === 1 ? 'minute' : 'minutes'}
            </p>
          </div>

          <div>
            <Label>Word Count</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {content.replace(/<[^>]*>/g, '').split(/\s+/).length} words
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
