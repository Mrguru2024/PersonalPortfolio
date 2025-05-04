import { Helmet } from 'react-helmet';
import type { BlogPost } from '@/lib/data';

interface BlogPostSEOProps {
  post: BlogPost;
  baseUrl?: string;
}

export function BlogPostSEO({ post, baseUrl = 'https://mrguru.dev' }: BlogPostSEOProps) {
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = post.coverImage || `${baseUrl}/images/mrguru-og-image.jpg`;
  
  // Extract plain text from HTML content for description (first 160 chars)
  const plainTextDescription = post.content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 160) + '...';
  
  // Use summary if available, otherwise use extracted plain text
  const description = post.summary || plainTextDescription;
  
  // Format publish date for schema
  const publishDate = new Date(post.publishedAt).toISOString();
  const modifiedDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishDate;
  
  // Extract keywords from tags
  const keywords = post.tags.join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{post.title} | MrGuru.dev Blog</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`${keywords}, MrGuru.dev, Anthony Feaster, blog, web development`} />
      <link rel="canonical" href={postUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={postUrl} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="article:published_time" content={publishDate} />
      <meta property="article:modified_time" content={modifiedDate} />
      {post.tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={postUrl} />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Schema.org / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': post.title,
          'description': description,
          'image': imageUrl,
          'url': postUrl,
          'datePublished': publishDate,
          'dateModified': modifiedDate,
          'keywords': keywords,
          'author': {
            '@type': 'Person',
            'name': 'Anthony Feaster',
            'url': baseUrl
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'MrGuru.dev',
            'logo': {
              '@type': 'ImageObject',
              'url': `${baseUrl}/favicon-32x32.png`,
              'width': 32,
              'height': 32
            }
          },
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': postUrl
          }
        })}
      </script>
    </Helmet>
  );
}