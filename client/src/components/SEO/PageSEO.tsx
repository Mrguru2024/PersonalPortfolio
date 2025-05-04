import { Helmet } from 'react-helmet';

interface PageSEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  keywords?: string[];
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  baseUrl?: string;
  noIndex?: boolean;
  schemaType?: 'WebPage' | 'AboutPage' | 'ProfilePage' | 'ContactPage' | 'CollectionPage';
}

export function PageSEO({
  title,
  description,
  canonicalPath = '',
  keywords = [],
  ogType = 'website',
  ogImage = '/images/mrguru-og-image.jpg',
  ogImageAlt = 'Anthony Feaster - Full Stack Developer',
  baseUrl = 'https://mrguru.dev',
  noIndex = false,
  schemaType = 'WebPage'
}: PageSEOProps) {
  const fullTitle = title.includes('MrGuru.dev') ? title : `${title} | MrGuru.dev`;
  const url = `${baseUrl}${canonicalPath}`;
  const keywordsString = [...keywords, 'MrGuru', 'Anthony Feaster', 'web developer', 'portfolio'].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:image:alt" content={ogImageAlt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      {/* Schema.org / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': schemaType,
          'name': fullTitle,
          'description': description,
          'url': url,
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
          }
        })}
      </script>
    </Helmet>
  );
}