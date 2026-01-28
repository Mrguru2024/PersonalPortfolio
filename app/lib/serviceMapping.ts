// Service to Assessment Mapping
// Maps service IDs to pre-populated assessment fields and educational content

import type { ProjectAssessment } from "@shared/assessmentSchema";

export interface ServiceMapping {
  serviceId: string;
  title: string;
  description: string;
  prePopulatedFields: Partial<ProjectAssessment>;
  educationalContent: {
    step2?: string; // Project Vision
    step3?: string; // Technical Needs
    step4?: string; // Design & UX
    step5?: string; // Business Goals
    benefits: string[]; // Key benefits to highlight
  };
  suggestedFeatures: string[];
  suggestedPlatforms: Array<"web" | "ios" | "android" | "desktop" | "api-only">;
}

export const serviceMappings: Record<string, ServiceMapping> = {
  'custom-web-apps': {
    serviceId: 'custom-web-apps',
    title: 'Custom Web Applications',
    description: 'Full-stack Next.js and React applications built to scale.',
    prePopulatedFields: {
      projectType: 'web-app',
      platform: ['web'],
      preferredTechStack: ['Next.js', 'React', 'TypeScript'],
      dataStorage: 'moderate',
      userAuthentication: 'basic',
      designStyle: 'modern',
      responsiveDesign: true,
      contentManagement: 'headless-cms',
    },
    educationalContent: {
      step2: 'Custom web applications are powerful, scalable solutions that can handle complex business logic and grow with your needs. They provide better performance, security, and user experience compared to traditional websites.',
      step3: 'Next.js and React provide server-side rendering for fast load times, excellent SEO, and a modern development experience. TypeScript ensures code quality and reduces bugs.',
      step4: 'Modern web apps prioritize responsive design and accessibility, ensuring your application works beautifully on all devices and is usable by everyone.',
      step5: 'Web applications can significantly improve business efficiency, automate processes, and provide real-time data insights to drive decision-making.',
      benefits: [
        'Scalable architecture that grows with your business',
        'Fast performance with server-side rendering',
        'Better SEO and discoverability',
        'Real-time features and updates',
        'Secure authentication and data protection',
      ],
    },
    suggestedFeatures: [
      'User Authentication',
      'Dashboard/Analytics',
      'API Integration',
      'Real-time Updates',
      'Admin Panel',
    ],
    suggestedPlatforms: ['web'],
  },
  'ecommerce-solutions': {
    serviceId: 'ecommerce-solutions',
    title: 'E-commerce Development',
    description: 'Complete online stores with payment processing and inventory management.',
    prePopulatedFields: {
      projectType: 'ecommerce',
      platform: ['web'],
      paymentProcessing: true,
      dataStorage: 'complex',
      userAuthentication: 'social-login',
      designStyle: 'modern',
      responsiveDesign: true,
      contentManagement: 'custom-cms',
    },
    educationalContent: {
      step2: 'E-commerce platforms need to balance user experience with security and performance. A well-built store can significantly increase sales and customer satisfaction.',
      step3: 'Payment processing integration is critical for e-commerce. We use secure, PCI-compliant payment gateways to protect customer data and ensure smooth transactions.',
      step4: 'E-commerce design focuses on conversion optimization - clear product displays, easy navigation, and a streamlined checkout process.',
      step5: 'E-commerce success is measured by conversion rates, average order value, and customer lifetime value. The right features can dramatically improve these metrics.',
      benefits: [
        'Secure payment processing with PCI compliance',
        'Inventory management and order tracking',
        'Customer accounts and order history',
        'Mobile-optimized shopping experience',
        'SEO-friendly product pages',
      ],
    },
    suggestedFeatures: [
      'Shopping Cart',
      'Payment Processing',
      'Inventory Management',
      'Order Management',
      'Customer Accounts',
      'Product Search',
    ],
    suggestedPlatforms: ['web'],
  },
  'mobile-apps': {
    serviceId: 'mobile-apps',
    title: 'Mobile App Development',
    description: 'Native and cross-platform mobile applications for iOS and Android.',
    prePopulatedFields: {
      projectType: 'mobile-app',
      platform: ['ios', 'android'],
      preferredTechStack: ['React Native'],
      dataStorage: 'moderate',
      userAuthentication: 'social-login',
      designStyle: 'modern',
      responsiveDesign: true,
    },
    educationalContent: {
      step2: 'Mobile apps provide a native experience that users prefer. They can access device features like push notifications, camera, and location services.',
      step3: 'React Native allows us to build for both iOS and Android from a single codebase, reducing development time and cost while maintaining native performance.',
      step4: 'Mobile design follows platform-specific guidelines (iOS Human Interface Guidelines, Material Design) to ensure intuitive user experiences.',
      step5: 'Mobile apps can significantly increase user engagement and retention through push notifications and offline functionality.',
      benefits: [
        'Native performance and user experience',
        'Access to device features (camera, GPS, notifications)',
        'Offline functionality',
        'App store presence and discoverability',
        'Push notifications for engagement',
      ],
    },
    suggestedFeatures: [
      'Push Notifications',
      'Offline Mode',
      'User Authentication',
      'In-App Purchases',
      'Location Services',
    ],
    suggestedPlatforms: ['ios', 'android'],
  },
  'saas-platforms': {
    serviceId: 'saas-platforms',
    title: 'SaaS Platform Development',
    description: 'Scalable software-as-a-service platforms with subscription management.',
    prePopulatedFields: {
      projectType: 'saas',
      platform: ['web'],
      preferredTechStack: ['Next.js', 'React', 'TypeScript'],
      dataStorage: 'enterprise',
      userAuthentication: 'enterprise-sso',
      paymentProcessing: true,
      designStyle: 'modern',
      responsiveDesign: true,
      contentManagement: 'headless-cms',
      apiRequirements: 'both',
    },
    educationalContent: {
      step2: 'SaaS platforms require careful architecture to handle multi-tenancy, scalability, and subscription management. They can generate recurring revenue and scale globally.',
      step3: 'Multi-tenant architecture allows multiple customers to use the same application securely. Subscription billing systems handle recurring payments automatically.',
      step4: 'SaaS design focuses on user onboarding, feature discovery, and clear value communication to reduce churn and increase adoption.',
      step5: 'SaaS success metrics include MRR (Monthly Recurring Revenue), churn rate, and customer lifetime value. The right features can improve all of these.',
      benefits: [
        'Recurring revenue model',
        'Scalable multi-tenant architecture',
        'Automatic subscription billing',
        'White-label options for resellers',
        'Analytics and usage tracking',
      ],
    },
    suggestedFeatures: [
      'Subscription Billing',
      'User Management & Roles',
      'Multi-tenant Architecture',
      'API Access',
      'Analytics Dashboard',
      'Admin Panel',
    ],
    suggestedPlatforms: ['web'],
  },
  'api-development': {
    serviceId: 'api-development',
    title: 'API Development & Integration',
    description: 'RESTful and GraphQL APIs, third-party integrations, and microservices.',
    prePopulatedFields: {
      projectType: 'api',
      platform: ['api-only'],
      preferredTechStack: ['Node.js', 'TypeScript'],
      dataStorage: 'moderate',
      apiRequirements: 'public',
      userAuthentication: 'basic',
    },
    educationalContent: {
      step2: 'APIs enable different systems to communicate and share data. Well-designed APIs are the foundation of modern applications and integrations.',
      step3: 'REST and GraphQL APIs provide different approaches to data access. REST is simpler and widely supported, while GraphQL offers more flexibility.',
      step4: 'API design focuses on consistency, documentation, and developer experience to make integration easy for your partners and customers.',
      step5: 'APIs can become a product themselves, generating revenue through usage-based pricing or enabling partnerships and integrations.',
      benefits: [
        'Enable third-party integrations',
        'Microservices architecture',
        'Comprehensive API documentation',
        'Rate limiting and security',
        'Versioning and backward compatibility',
      ],
    },
    suggestedFeatures: [
      'API Documentation',
      'Rate Limiting',
      'Webhook Support',
      'Authentication',
      'Versioning',
    ],
    suggestedPlatforms: ['api-only'],
  },
  'ui-ux-design': {
    serviceId: 'ui-ux-design',
    title: 'UI/UX Design',
    description: 'User-centered design that combines beautiful aesthetics with intuitive functionality.',
    prePopulatedFields: {
      projectType: 'website',
      platform: ['web'],
      designStyle: 'modern',
      responsiveDesign: true,
      accessibilityRequirements: 'wcag-aa',
      userExperiencePriority: 'balanced',
      hasBrandGuidelines: false,
    },
    educationalContent: {
      step2: 'Great design is not just about looks - it\'s about solving user problems and creating intuitive experiences that drive conversions and engagement.',
      step3: 'User research and testing ensure your design meets real user needs. Wireframing and prototyping help validate ideas before development.',
      step4: 'Accessible design ensures your product is usable by everyone, including people with disabilities. This also improves SEO and legal compliance.',
      step5: 'Well-designed interfaces can increase conversion rates by 200-300% and significantly improve user satisfaction and retention.',
      benefits: [
        'Increased conversion rates',
        'Better user engagement and retention',
        'Accessibility compliance (WCAG)',
        'Brand consistency',
        'Reduced development costs through clear design',
      ],
    },
    suggestedFeatures: [
      'Responsive Design',
      'Accessibility Features',
      'User Testing',
      'Design System',
    ],
    suggestedPlatforms: ['web'],
  },
  'maintenance-support': {
    serviceId: 'maintenance-support',
    title: 'Ongoing Maintenance & Support',
    description: 'Keep your application running smoothly with regular updates and support.',
    prePopulatedFields: {
      ongoingMaintenance: true,
      hostingPreferences: 'cloud',
    },
    educationalContent: {
      step2: 'Regular maintenance prevents security vulnerabilities, improves performance, and ensures your application stays current with technology updates.',
      step3: 'Proactive monitoring and updates reduce downtime and prevent issues before they affect users.',
      step4: 'Maintenance includes security patches, performance optimization, and feature enhancements based on user feedback.',
      step5: 'Ongoing support reduces long-term costs by preventing major issues and keeping your application competitive.',
      benefits: [
        'Security updates and patches',
        'Performance monitoring and optimization',
        'Bug fixes and feature enhancements',
        'Priority support',
        'Reduced long-term costs',
      ],
    },
    suggestedFeatures: [
      'Security Updates',
      'Performance Monitoring',
      'Backup Management',
      'Feature Enhancements',
    ],
    suggestedPlatforms: [],
  },
};

export function getServiceMapping(serviceId: string): ServiceMapping | null {
  return serviceMappings[serviceId] || null;
}

export function getServiceBenefits(serviceId: string): string[] {
  const mapping = getServiceMapping(serviceId);
  return mapping?.educationalContent.benefits || [];
}

export function getServiceEducationalContent(serviceId: string, step: number): string | null {
  const mapping = getServiceMapping(serviceId);
  if (!mapping) return null;
  
  const stepKey = `step${step}` as keyof typeof mapping.educationalContent;
  const content = mapping.educationalContent[stepKey];
  // Ensure we only return string values, not arrays (like benefits)
  return typeof content === 'string' ? content : null;
}
