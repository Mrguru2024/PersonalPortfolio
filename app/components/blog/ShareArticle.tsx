"use client";

import { useState, useEffect } from "react";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  Link2, 
  Copy,
  Check,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareArticleProps {
  readonly title: string;
  readonly url: string;
  readonly summary?: string;
  readonly className?: string;
}

/**
 * ShareArticle - Social sharing buttons for blog posts
 * Provides easy sharing to popular platforms and copy link functionality
 */
export function ShareArticle({ title, url, summary, className }: ShareArticleProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Get the current URL if not provided
    if (typeof globalThis !== "undefined" && globalThis.window) {
      setCurrentUrl(url || globalThis.window.location.href);
    }
  }, [url]);

  const shareUrl = currentUrl || url;
  const shareTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(summary || title);
  const shareUrlEncoded = encodeURIComponent(shareUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error: unknown) {
      console.error("Failed to copy link:", error);
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrlEncoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`,
    reddit: `https://reddit.com/submit?url=${shareUrlEncoded}&title=${shareTitle}`,
    email: `mailto:?subject=${shareTitle}&body=${shareText}%20${shareUrlEncoded}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrlEncoded}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const shareLink = shareLinks[platform];
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400,noopener,noreferrer");
    }
  };

  // Native Web Share API (if available)
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: summary || title,
          url: shareUrl,
        });
      } catch (error: unknown) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const shareButtons = [
    {
      name: "Twitter",
      icon: Twitter as React.ComponentType<{ className?: string }>,
      color: "hover:bg-blue-500 hover:text-white",
      onClick: () => handleShare("twitter"),
    },
    {
      name: "Facebook",
      icon: Facebook as React.ComponentType<{ className?: string }>,
      color: "hover:bg-blue-600 hover:text-white",
      onClick: () => handleShare("facebook"),
    },
    {
      name: "LinkedIn",
      icon: Linkedin as React.ComponentType<{ className?: string }>,
      color: "hover:bg-blue-700 hover:text-white",
      onClick: () => handleShare("linkedin"),
    },
    {
      name: "Reddit",
      icon: Share2 as React.ComponentType<{ className?: string }>,
      color: "hover:bg-orange-500 hover:text-white",
      onClick: () => handleShare("reddit"),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-green-500 hover:text-white",
      onClick: () => handleShare("whatsapp"),
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-gray-600 hover:text-white",
      onClick: () => handleShare("email"),
    },
  ];

  return (
    <Card className={cn("mt-8", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5" />
          Share this article
        </CardTitle>
        <CardDescription>
          Help others discover this content by sharing it on your favorite platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Social Share Buttons */}
          <div className="flex flex-wrap gap-2">
            {shareButtons.map((button) => {
              const Icon = button.icon;
              return (
                <Button
                  key={button.name}
                  variant="outline"
                  size="sm"
                  onClick={button.onClick}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    button.color
                  )}
                  aria-label={`Share on ${button.name}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{button.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Copy Link Section */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-md border">
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {shareUrl}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
              data-action="copy-link"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Native Share Button (Mobile) */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
