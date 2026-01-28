"use client";

import { useEffect, useRef } from "react";

interface AutoLinkerProps {
  content: string;
  internalLinks: Array<{ text: string; url: string; postId?: number }>;
  externalLinks: Array<{ text: string; url: string; nofollow?: boolean }>;
  onContentUpdate?: (updatedContent: string) => void;
}

/**
 * AutoLinker - Automatically inserts internal and external links into blog post content
 * This enhances SEO by creating contextual links throughout the content
 */
export function AutoLinker({
  content,
  internalLinks,
  externalLinks,
  onContentUpdate,
}: AutoLinkerProps) {
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current || !onContentUpdate) return;
    processedRef.current = true;

    let updatedContent = content;

    // Process internal links
    internalLinks.forEach((link) => {
      if (!link.text || !link.url) return;

      // Create regex to find the link text in content (case-insensitive, whole word)
      const regex = new RegExp(`\\b${link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      // Check if link already exists
      const linkExists = updatedContent.includes(`href="${link.url}"`) || 
                        updatedContent.includes(`href='${link.url}'`);
      
      if (!linkExists) {
        // Replace first occurrence with a link
        updatedContent = updatedContent.replace(
          regex,
          (match, offset) => {
            // Check if we're already inside an anchor tag
            const beforeMatch = updatedContent.substring(Math.max(0, offset - 50), offset);
            const afterMatch = updatedContent.substring(offset, offset + match.length + 50);
            
            if (beforeMatch.includes('<a ') && afterMatch.includes('</a>')) {
              return match; // Already a link, don't replace
            }
            
            return `<a href="${link.url}" class="internal-link" data-post-id="${link.postId || ''}">${match}</a>`;
          }
        );
      }
    });

    // Process external links (be more careful - only link if text matches exactly)
    externalLinks.forEach((link) => {
      if (!link.text || !link.url) return;

      // Only link if the text appears as plain text (not already linked)
      const regex = new RegExp(`(^|[^>])${link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^<]|$)`, 'gi');
      
      const linkExists = updatedContent.includes(`href="${link.url}"`) || 
                        updatedContent.includes(`href='${link.url}'`);
      
      if (!linkExists) {
        updatedContent = updatedContent.replace(
          regex,
          (match, before, after) => {
            // Check if already inside a tag
            if (match.includes('<') || match.includes('>')) {
              return match;
            }
            
            const relAttr = link.nofollow ? 'rel="nofollow noopener noreferrer"' : 'rel="noopener noreferrer"';
            return `${before}<a href="${link.url}" ${relAttr} target="_blank" class="external-link">${link.text}</a>${after}`;
          }
        );
      }
    });

    if (updatedContent !== content) {
      onContentUpdate(updatedContent);
    }
  }, [content, internalLinks, externalLinks, onContentUpdate]);

  return null; // This component doesn't render anything
}
