"use client";

import Link from "next/link";
import { ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LinkDisplayProps {
  internalLinks?: Array<{ text: string; url: string; postId?: number }>;
  externalLinks?: Array<{ text: string; url: string; nofollow?: boolean }>;
}

/**
 * LinkDisplay - Displays internal and external links in a structured way
 * Helps with SEO by making links visible and accessible
 */
export function LinkDisplay({ internalLinks = [], externalLinks = [] }: LinkDisplayProps) {
  if (internalLinks.length === 0 && externalLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 space-y-6">
      <Separator />
      
      {(internalLinks.length > 0 || externalLinks.length > 0) && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Related Links
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Internal Links */}
            {internalLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Internal Links</CardTitle>
                  <CardDescription>Related posts on this site</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {internalLinks.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.url}
                          className="flex items-center gap-2 text-primary hover:underline transition-colors"
                        >
                          <Link2 className="h-4 w-4" />
                          <span>{link.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* External Links */}
            {externalLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">External Resources</CardTitle>
                  <CardDescription>Additional reading and references</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {externalLinks.map((link, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <a
                          href={link.url}
                          target="_blank"
                          rel={link.nofollow ? "nofollow noopener noreferrer" : "noopener noreferrer"}
                          className="flex items-center gap-2 text-primary hover:underline transition-colors flex-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{link.text}</span>
                        </a>
                        {link.nofollow && (
                          <Badge variant="outline" className="text-xs ml-2">
                            nofollow
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
