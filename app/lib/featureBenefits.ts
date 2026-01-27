// Feature benefits and explanations in real-world terms
// Helps users understand what value they're losing when removing features

export interface FeatureBenefit {
  id: string;
  name: string;
  category: string;
  benefit: string;
  realWorldImpact: string;
  requiredFor?: string[]; // Project types that require this feature
  costSavings?: number; // Estimated cost savings if removed
}

export const featureBenefits: Record<string, FeatureBenefit> = {
  // Authentication Features
  'basic-auth': {
    id: 'basic-auth',
    name: 'Basic Authentication',
    category: 'Authentication',
    benefit: 'Allows users to create accounts and log in securely with email and password.',
    realWorldImpact: 'Without this, users can\'t create accounts, save preferences, or access personalized content. Your site would be public-only with no user accounts.',
    requiredFor: ['web-app', 'saas', 'ecommerce'],
    costSavings: 500,
  },
  'social-login': {
    id: 'social-login',
    name: 'Social Login',
    category: 'Authentication',
    benefit: 'Users can sign in quickly using Google, Facebook, or other social accounts instead of creating a new password.',
    realWorldImpact: 'Removing this means users must create and remember another password, which can reduce sign-ups by 20-30%. Many users prefer the convenience of social login.',
    costSavings: 1000,
  },
  'enterprise-sso': {
    id: 'enterprise-sso',
    name: 'Enterprise SSO',
    category: 'Authentication',
    benefit: 'Allows employees to use one company login to access multiple systems. Essential for B2B or enterprise clients.',
    realWorldImpact: 'Without this, enterprise clients may not be able to use your service if they require single sign-on for security compliance. This could eliminate your B2B market.',
    requiredFor: ['saas'],
    costSavings: 3000,
  },

  // E-commerce Features
  'payment-processing': {
    id: 'payment-processing',
    name: 'Payment Processing',
    category: 'E-commerce',
    benefit: 'Enables your website to accept credit cards, debit cards, and other payment methods securely.',
    realWorldImpact: 'Without this, customers cannot purchase products or services online. Your e-commerce site would be unable to process any transactions.',
    requiredFor: ['ecommerce', 'saas'],
    costSavings: 2000,
  },
  'shopping-cart': {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    category: 'E-commerce',
    benefit: 'Lets customers select multiple items, review their order, and purchase everything at once.',
    realWorldImpact: 'Without this, customers can only buy one item at a time, which is frustrating and reduces average order value. Most customers expect to add multiple items to a cart.',
    requiredFor: ['ecommerce'],
    costSavings: 1500,
  },
  'inventory-management': {
    id: 'inventory-management',
    name: 'Inventory Management',
    category: 'E-commerce',
    benefit: 'Automatically tracks product stock levels, prevents overselling, and alerts you when items run low.',
    realWorldImpact: 'Without this, you\'ll have to manually track inventory, which is error-prone. You might oversell products (angering customers) or miss sales when items are out of stock.',
    requiredFor: ['ecommerce'],
    costSavings: 2500,
  },
  'order-management': {
    id: 'order-management',
    name: 'Order Management',
    category: 'E-commerce',
    benefit: 'Helps you track, process, and fulfill customer orders efficiently with status updates and notifications.',
    realWorldImpact: 'Without this, you\'ll struggle to track which orders are pending, processing, or shipped. Customer service becomes difficult, and you may lose orders or ship incorrectly.',
    costSavings: 1500,
  },

  // Real-time Features
  'real-time-chat': {
    id: 'real-time-chat',
    name: 'Real-time Chat',
    category: 'Communication',
    benefit: 'Enables instant messaging between users or with customer support, like WhatsApp or Slack.',
    realWorldImpact: 'Without this, users must use email or phone for communication, which is slower and less convenient. Real-time chat improves customer satisfaction and response times.',
    costSavings: 2000,
  },
  'real-time-updates': {
    id: 'real-time-updates',
    name: 'Real-time Updates',
    category: 'Communication',
    benefit: 'Information updates instantly across all users without refreshing the page, like live stock prices or collaborative editing.',
    realWorldImpact: 'Without this, users must manually refresh to see updates, which feels outdated. Real-time updates make your app feel modern and responsive.',
    costSavings: 1500,
  },
  'live-collaboration': {
    id: 'live-collaboration',
    name: 'Live Collaboration',
    category: 'Communication',
    benefit: 'Multiple users can work together simultaneously, like Google Docs where multiple people edit at once.',
    realWorldImpact: 'Without this, only one person can edit at a time, which slows down teamwork. Collaboration features are essential for productivity tools.',
    costSavings: 3000,
  },

  // Content Management
  'basic-cms': {
    id: 'basic-cms',
    name: 'Basic CMS',
    category: 'Content Management',
    benefit: 'Lets you update website content (text, images, blog posts) without needing to know code.',
    realWorldImpact: 'Without this, you\'ll need a developer for every content update, which is expensive and slow. A CMS gives you independence to update your site anytime.',
    costSavings: 2000,
  },
  'headless-cms': {
    id: 'headless-cms',
    name: 'Headless CMS',
    category: 'Content Management',
    benefit: 'Flexible content management that works across websites, mobile apps, and other platforms.',
    realWorldImpact: 'Without this, you\'re limited to one platform. A headless CMS lets you reuse content across multiple channels, saving time and ensuring consistency.',
    costSavings: 3000,
  },
  'custom-cms': {
    id: 'custom-cms',
    name: 'Custom CMS',
    category: 'Content Management',
    benefit: 'A fully customized content management system built specifically for your unique needs and workflow.',
    realWorldImpact: 'Without this, you\'ll use a generic CMS that may not fit your workflow. A custom CMS is tailored to exactly how you work, improving efficiency.',
    costSavings: 5000,
  },

  // API Features
  'internal-api': {
    id: 'internal-api',
    name: 'Internal API',
    category: 'API',
    benefit: 'Allows different parts of your application to communicate and share data efficiently.',
    realWorldImpact: 'Without this, your app components can\'t share data properly, leading to duplicate code and maintenance issues. APIs make your app more organized and scalable.',
    costSavings: 2000,
  },
  'public-api': {
    id: 'public-api',
    name: 'Public API',
    category: 'API',
    benefit: 'Lets other developers integrate with your service, enabling third-party apps and expanding your reach.',
    realWorldImpact: 'Without this, you can\'t integrate with other services or allow partners to build on your platform. This limits growth opportunities and partnerships.',
    costSavings: 4000,
  },
  'api-documentation': {
    id: 'api-documentation',
    name: 'API Documentation',
    category: 'API',
    benefit: 'Clear instructions for developers on how to use your API, making integration easier.',
    realWorldImpact: 'Without this, developers struggle to integrate with your API, leading to support requests and fewer integrations. Good documentation encourages adoption.',
    costSavings: 1500,
  },

  // Advanced Features
  'search-functionality': {
    id: 'search-functionality',
    name: 'Search Functionality',
    category: 'Features',
    benefit: 'Helps users quickly find products, content, or information on your site.',
    realWorldImpact: 'Without this, users must browse through pages to find what they need, which is frustrating. Good search improves user experience and helps users find products faster.',
    costSavings: 1500,
  },
  'analytics-dashboard': {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'Features',
    benefit: 'Shows you statistics about your website: visitors, popular pages, user behavior, and business metrics.',
    realWorldImpact: 'Without this, you\'re flying blind. You won\'t know what\'s working, what users like, or how to improve. Analytics help you make data-driven decisions.',
    costSavings: 2000,
  },
  'admin-panel': {
    id: 'admin-panel',
    name: 'Admin Panel',
    category: 'Features',
    benefit: 'A private area where you can manage users, content, settings, and view reports.',
    realWorldImpact: 'Without this, you\'ll need a developer for every administrative task. An admin panel gives you control over your site\'s management and operations.',
    costSavings: 2500,
  },
  'multi-language': {
    id: 'multi-language',
    name: 'Multi-language Support',
    category: 'Features',
    benefit: 'Your website can display in multiple languages, reaching a global audience.',
    realWorldImpact: 'Without this, you\'re limited to one language, excluding potential customers who don\'t speak that language. Multi-language support can expand your market significantly.',
    costSavings: 2000,
  },
  'notifications': {
    id: 'notifications',
    name: 'Notifications',
    category: 'Features',
    benefit: 'Alerts users about important updates, messages, or events via email, SMS, or push notifications.',
    realWorldImpact: 'Without this, users may miss important information or updates. Notifications keep users engaged and informed, improving retention.',
    costSavings: 1000,
  },
};

/**
 * Get benefit information for a feature
 */
export function getFeatureBenefit(featureId: string): FeatureBenefit | undefined {
  return featureBenefits[featureId];
}

/**
 * Check if a feature is required for a project type
 */
export function isFeatureRequired(featureId: string, projectType?: string): boolean {
  const benefit = featureBenefits[featureId];
  if (!benefit || !projectType) return false;
  return benefit.requiredFor?.includes(projectType) || false;
}

/**
 * Get all features for a category
 */
export function getFeaturesByCategory(category: string): FeatureBenefit[] {
  return Object.values(featureBenefits).filter(f => f.category === category);
}
