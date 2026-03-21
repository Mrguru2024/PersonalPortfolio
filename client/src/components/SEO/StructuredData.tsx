import React, { useEffect } from "react";
import { removeJsonLdScript, updateJsonLdScript } from "@shared/seo-head";

interface PersonSchema {
  name: string;
  jobTitle: string;
  image: string;
  url: string;
  sameAs?: string[];
  description?: string;
}

interface WebsiteSchema {
  url: string;
  name: string;
  description: string;
  author: {
    name: string;
    url: string;
  };
}

interface ProjectSchema {
  name: string;
  description: string;
  url: string;
  image: string;
  author: {
    name: string;
    url: string;
  };
  datePublished: string;
  technologies?: string[];
}

interface BlogPostSchema {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    url: string;
  };
  publisher: {
    name: string;
    url: string;
    logo?: {
      url: string;
      width?: number;
      height?: number;
    };
  };
  url: string;
  mainEntityOfPage: string;
  keywords?: string[];
}

interface FAQSchema {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

type SchemaType =
  | { type: "Person"; data: PersonSchema }
  | { type: "WebSite"; data: WebsiteSchema }
  | { type: "Project"; data: ProjectSchema }
  | { type: "BlogPosting"; data: BlogPostSchema }
  | { type: "FAQPage"; data: FAQSchema };

interface StructuredDataProps {
  schema: SchemaType;
  /** Unique slot when multiple JSON-LD blocks mount on one page (e.g. Home). */
  jsonLdId?: string;
}

function buildJsonLd(schema: SchemaType): object {
  switch (schema.type) {
    case "Person":
      return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: schema.data.name,
        jobTitle: schema.data.jobTitle,
        image: schema.data.image,
        url: schema.data.url,
        sameAs: schema.data.sameAs || [],
        description: schema.data.description || "",
      };

    case "WebSite":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        url: schema.data.url,
        name: schema.data.name,
        description: schema.data.description,
        author: {
          "@type": "Person",
          name: schema.data.author.name,
          url: schema.data.author.url,
        },
      };

    case "Project":
      return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: schema.data.name,
        description: schema.data.description,
        url: schema.data.url,
        image: schema.data.image,
        author: {
          "@type": "Person",
          name: schema.data.author.name,
          url: schema.data.author.url,
        },
        datePublished: schema.data.datePublished,
        applicationCategory: "WebApplication",
        ...(schema.data.technologies && {
          softwareRequirements: schema.data.technologies.join(", "),
        }),
      };

    case "BlogPosting":
      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: schema.data.headline,
        description: schema.data.description,
        image: schema.data.image,
        datePublished: schema.data.datePublished,
        dateModified: schema.data.dateModified,
        author: {
          "@type": "Person",
          name: schema.data.author.name,
          url: schema.data.author.url,
        },
        publisher: {
          "@type": "Organization",
          name: schema.data.publisher.name,
          url: schema.data.publisher.url,
          ...(schema.data.publisher.logo && {
            logo: {
              "@type": "ImageObject",
              url: schema.data.publisher.logo.url,
              width: schema.data.publisher.logo.width || 60,
              height: schema.data.publisher.logo.height || 60,
            },
          }),
        },
        url: schema.data.url,
        mainEntityOfPage: schema.data.mainEntityOfPage,
        keywords: schema.data.keywords?.join(", "),
      };

    case "FAQPage":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: schema.data.questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };

    default:
      return {};
  }
}

/**
 * JSON-LD for the legacy Vite client (injects into document.head).
 */
export const StructuredData: React.FC<StructuredDataProps> = ({
  schema,
  jsonLdId = "structured-data",
}) => {
  useEffect(() => {
    const data = buildJsonLd(schema);
    if (data && Object.keys(data).length > 0) {
      updateJsonLdScript(data, jsonLdId);
    }
    return () => {
      removeJsonLdScript(jsonLdId);
    };
  }, [schema, jsonLdId]);

  return null;
};

export default StructuredData;
