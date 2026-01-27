// Maps display feature names to feature IDs for the benefit system
// This allows us to match user-selected features with our benefit definitions

export const featureNameToId: Record<string, string> = {
  // Authentication
  'Basic Authentication': 'basic-auth',
  'Email/Password Login': 'basic-auth',
  'Social Login': 'social-login',
  'Google/Facebook Login': 'social-login',
  'Enterprise SSO': 'enterprise-sso',
  'Single Sign-On': 'enterprise-sso',
  'Custom Authentication': 'custom-auth',

  // E-commerce
  'Payment Processing': 'payment-processing',
  'Accept Payments': 'payment-processing',
  'Credit Card Processing': 'payment-processing',
  'Shopping Cart': 'shopping-cart',
  'Cart': 'shopping-cart',
  'Inventory Management': 'inventory-management',
  'Stock Management': 'inventory-management',
  'Order Management': 'order-management',
  'Order Tracking': 'order-management',

  // Real-time
  'Real-time Chat': 'real-time-chat',
  'Live Chat': 'real-time-chat',
  'Chat': 'real-time-chat',
  'Real-time Updates': 'real-time-updates',
  'Live Updates': 'real-time-updates',
  'Live Collaboration': 'live-collaboration',
  'Collaborative Editing': 'live-collaboration',

  // CMS
  'Basic CMS': 'basic-cms',
  'Content Management': 'basic-cms',
  'Headless CMS': 'headless-cms',
  'Custom CMS': 'custom-cms',

  // API
  'Internal API': 'internal-api',
  'Public API': 'public-api',
  'API Documentation': 'api-documentation',
  'API Docs': 'api-documentation',

  // Features
  'Search Functionality': 'search-functionality',
  'Search': 'search-functionality',
  'Analytics Dashboard': 'analytics-dashboard',
  'Analytics': 'analytics-dashboard',
  'Admin Panel': 'admin-panel',
  'Admin Dashboard': 'admin-panel',
  'Multi-language Support': 'multi-language',
  'Multi-language': 'multi-language',
  'Notifications': 'notifications',
  'Email Notifications': 'notifications',
  'Push Notifications': 'notifications',
  'User Dashboard': 'admin-panel', // User dashboard is similar to admin panel
};

/**
 * Convert a feature display name to a feature ID
 */
export function getFeatureId(featureName: string): string | null {
  // Try exact match first
  if (featureNameToId[featureName]) {
    return featureNameToId[featureName];
  }

  // Try case-insensitive match
  const lowerName = featureName.toLowerCase();
  for (const [key, value] of Object.entries(featureNameToId)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(featureNameToId)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }

  return null;
}

/**
 * Convert feature IDs back to display names
 */
export function getFeatureDisplayName(featureId: string): string {
  const reverseMap: Record<string, string> = {
    'basic-auth': 'Basic Authentication',
    'social-login': 'Social Login',
    'enterprise-sso': 'Enterprise SSO',
    'custom-auth': 'Custom Authentication',
    'payment-processing': 'Payment Processing',
    'shopping-cart': 'Shopping Cart',
    'inventory-management': 'Inventory Management',
    'order-management': 'Order Management',
    'real-time-chat': 'Real-time Chat',
    'real-time-updates': 'Real-time Updates',
    'live-collaboration': 'Live Collaboration',
    'basic-cms': 'Basic CMS',
    'headless-cms': 'Headless CMS',
    'custom-cms': 'Custom CMS',
    'internal-api': 'Internal API',
    'public-api': 'Public API',
    'api-documentation': 'API Documentation',
    'search-functionality': 'Search Functionality',
    'analytics-dashboard': 'Analytics Dashboard',
    'admin-panel': 'Admin Panel',
    'multi-language': 'Multi-language Support',
    'notifications': 'Notifications',
  };

  return reverseMap[featureId] || featureId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
