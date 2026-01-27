// Pricing calculation service based on real market data
// Uses industry averages and complexity factors

interface PricingFactors {
  basePrice: number;
  featureMultipliers: Record<string, number>;
  complexityMultipliers: Record<string, number>;
  platformPrices: Record<string, number>;
  designPrices: Record<string, number>;
  integrationBasePrice: number;
  timelineMultipliers: Record<string, number>;
}

// Real market data averages (2024-2025)
const PRICING_DATA: PricingFactors = {
  // Base prices by project type (in USD)
  basePrice: 5000, // Starting point for a basic website
  
  // Feature multipliers (add to base)
  featureMultipliers: {
    // Authentication
    'basic-auth': 500,
    'social-login': 1000,
    'enterprise-sso': 3000,
    'custom-auth': 2000,
    
    // E-commerce
    'payment-processing': 2000,
    'shopping-cart': 1500,
    'inventory-management': 2500,
    'order-management': 1500,
    
    // Real-time features
    'real-time-chat': 2000,
    'real-time-updates': 1500,
    'live-collaboration': 3000,
    
    // Content Management
    'basic-cms': 2000,
    'headless-cms': 3000,
    'custom-cms': 5000,
    
    // API
    'internal-api': 2000,
    'public-api': 4000,
    'api-documentation': 1500,
    
    // Advanced Features
    'search-functionality': 1500,
    'analytics-dashboard': 2000,
    'admin-panel': 2500,
    'multi-language': 2000,
    'notifications': 1000,
  },
  
  // Complexity multipliers (multiply total)
  complexityMultipliers: {
    'simple': 0.8,      // Basic brochure site
    'moderate': 1.0,    // Standard web app
    'complex': 1.5,     // Advanced features
    'enterprise': 2.5,  // Enterprise-grade
  },
  
  // Platform prices (add to base)
  platformPrices: {
    'web': 0,           // Included in base
    'ios': 8000,        // Native iOS app
    'android': 8000,    // Native Android app
    'desktop': 10000,   // Desktop application
    'api-only': -2000,  // API only (no UI)
  },
  
  // Design prices (add to base)
  designPrices: {
    'minimalist': 0,        // Simple design
    'modern': 2000,         // Modern UI/UX
    'corporate': 3000,      // Professional corporate
    'creative': 4000,       // Highly creative/custom
    'custom': 5000,         // Fully custom design
    'not-sure': 2000,       // Default modern
  },
  
  // Integration base price per integration
  integrationBasePrice: 1000,
  
  // Timeline multipliers
  timelineMultipliers: {
    'asap': 1.5,           // Rush (50% premium)
    '1-3-months': 1.2,     // Fast (20% premium)
    '3-6-months': 1.0,     // Standard
    '6-12-months': 0.9,    // Flexible (10% discount)
    'flexible': 0.9,       // Flexible (10% discount)
  },
};

// Market comparison data (industry averages)
const MARKET_COMPARISON = {
  website: { low: 2000, high: 15000, avg: 6000 },
  'web-app': { low: 10000, high: 100000, avg: 35000 },
  'mobile-app': { low: 15000, high: 150000, avg: 50000 },
  ecommerce: { low: 5000, high: 50000, avg: 20000 },
  saas: { low: 20000, high: 200000, avg: 75000 },
  api: { low: 5000, high: 50000, avg: 20000 },
  other: { low: 5000, high: 100000, avg: 30000 },
};

export class PricingService {
  calculatePricing(assessment: any): any {
    let basePrice = PRICING_DATA.basePrice;
    const features: Array<{ name: string; price: number; category: string }> = [];
    
    // Adjust base price by project type
    const projectTypeBase = MARKET_COMPARISON[assessment.projectType as keyof typeof MARKET_COMPARISON]?.avg || 10000;
    basePrice = projectTypeBase * 0.6; // Start at 60% of market average
    
    // Add platform costs
    let platformPrice = 0;
    if (assessment.platform) {
      assessment.platform.forEach((platform: string) => {
        const price = PRICING_DATA.platformPrices[platform as keyof typeof PRICING_DATA.platformPrices] || 0;
        if (price > 0) {
          platformPrice += price;
          features.push({
            name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Platform`,
            price,
            category: 'Platform'
          });
        }
      });
    }
    
    // Add authentication features
    if (assessment.userAuthentication) {
      const authType = assessment.userAuthentication;
      if (authType === 'basic') {
        features.push({ name: 'Basic Authentication', price: PRICING_DATA.featureMultipliers['basic-auth'], category: 'Security' });
      } else if (authType === 'social-login') {
        features.push({ name: 'Social Login Integration', price: PRICING_DATA.featureMultipliers['social-login'], category: 'Security' });
      } else if (authType === 'enterprise-sso') {
        features.push({ name: 'Enterprise SSO', price: PRICING_DATA.featureMultipliers['enterprise-sso'], category: 'Security' });
      } else if (authType === 'custom') {
        features.push({ name: 'Custom Authentication', price: PRICING_DATA.featureMultipliers['custom-auth'], category: 'Security' });
      }
    }
    
    // Add payment processing
    if (assessment.paymentProcessing) {
      features.push({ name: 'Payment Processing', price: PRICING_DATA.featureMultipliers['payment-processing'], category: 'E-commerce' });
    }
    
    // Add real-time features
    if (assessment.realTimeFeatures) {
      features.push({ name: 'Real-time Features', price: PRICING_DATA.featureMultipliers['real-time-updates'], category: 'Advanced' });
    }
    
    // Add CMS
    if (assessment.contentManagement) {
      const cmsType = assessment.contentManagement;
      if (cmsType === 'basic-cms') {
        features.push({ name: 'Basic CMS', price: PRICING_DATA.featureMultipliers['basic-cms'], category: 'Content' });
      } else if (cmsType === 'headless-cms') {
        features.push({ name: 'Headless CMS Integration', price: PRICING_DATA.featureMultipliers['headless-cms'], category: 'Content' });
      } else if (cmsType === 'custom-cms') {
        features.push({ name: 'Custom CMS', price: PRICING_DATA.featureMultipliers['custom-cms'], category: 'Content' });
      }
    }
    
    // Add API requirements
    if (assessment.apiRequirements) {
      if (assessment.apiRequirements === 'internal' || assessment.apiRequirements === 'both') {
        features.push({ name: 'Internal API', price: PRICING_DATA.featureMultipliers['internal-api'], category: 'API' });
      }
      if (assessment.apiRequirements === 'public' || assessment.apiRequirements === 'both') {
        features.push({ name: 'Public API', price: PRICING_DATA.featureMultipliers['public-api'], category: 'API' });
      }
    }
    
    // Add integrations
    let integrationPrice = 0;
    if (assessment.integrations && assessment.integrations.length > 0) {
      integrationPrice = assessment.integrations.length * PRICING_DATA.integrationBasePrice;
      features.push({
        name: `${assessment.integrations.length} Third-party Integration(s)`,
        price: integrationPrice,
        category: 'Integrations'
      });
    }
    
    // Add design costs
    let designPrice = 0;
    if (assessment.designStyle) {
      designPrice = PRICING_DATA.designPrices[assessment.designStyle as keyof typeof PRICING_DATA.designPrices] || 2000;
      if (designPrice > 0) {
        features.push({
          name: `${assessment.designStyle.charAt(0).toUpperCase() + assessment.designStyle.slice(1)} Design`,
          price: designPrice,
          category: 'Design'
        });
      }
    }
    
    // Calculate subtotal
    const featureTotal = features.reduce((sum, f) => sum + f.price, 0);
    let subtotal = basePrice + platformPrice + featureTotal;
    
    // Apply complexity multiplier
    let complexityMultiplier = 1.0;
    let complexityLevel = 'moderate';
    let complexityDescription = 'Standard web application';
    
    if (assessment.dataStorage) {
      if (assessment.dataStorage === 'simple') {
        complexityMultiplier = PRICING_DATA.complexityMultipliers.simple;
        complexityLevel = 'simple';
        complexityDescription = 'Simple data structure';
      } else if (assessment.dataStorage === 'moderate') {
        complexityMultiplier = PRICING_DATA.complexityMultipliers.moderate;
        complexityLevel = 'moderate';
        complexityDescription = 'Moderate complexity';
      } else if (assessment.dataStorage === 'complex') {
        complexityMultiplier = PRICING_DATA.complexityMultipliers.complex;
        complexityLevel = 'complex';
        complexityDescription = 'Complex data structure';
      } else if (assessment.dataStorage === 'enterprise') {
        complexityMultiplier = PRICING_DATA.complexityMultipliers.enterprise;
        complexityLevel = 'enterprise';
        complexityDescription = 'Enterprise-grade system';
      }
    }
    
    subtotal = subtotal * complexityMultiplier;
    
    // Apply timeline multiplier
    let timelineMultiplier = 1.0;
    let rush = false;
    let timelineDescription = 'Standard timeline';
    
    if (assessment.preferredTimeline) {
      timelineMultiplier = PRICING_DATA.timelineMultipliers[assessment.preferredTimeline as keyof typeof PRICING_DATA.timelineMultipliers] || 1.0;
      rush = assessment.preferredTimeline === 'asap' || assessment.preferredTimeline === '1-3-months';
      timelineDescription = assessment.preferredTimeline.replace(/-/g, ' ');
    }
    
    const finalPrice = subtotal * timelineMultiplier;
    
    // Calculate range (±20% for estimation)
    const estimatedRange = {
      min: Math.round(finalPrice * 0.8),
      max: Math.round(finalPrice * 1.2),
      average: Math.round(finalPrice),
    };
    
    // Market comparison
    const marketData = MARKET_COMPARISON[assessment.projectType as keyof typeof MARKET_COMPARISON] || MARKET_COMPARISON.other;
    
    return {
      basePrice: Math.round(basePrice),
      features,
      complexity: {
        level: complexityLevel,
        multiplier: complexityMultiplier,
        description: complexityDescription,
      },
      timeline: {
        rush,
        multiplier: timelineMultiplier,
        description: timelineDescription,
      },
      platform: {
        platforms: assessment.platform || [],
        price: Math.round(platformPrice),
      },
      design: {
        level: assessment.designStyle || 'modern',
        price: Math.round(designPrice),
      },
      integrations: {
        count: assessment.integrations?.length || 0,
        price: Math.round(integrationPrice),
      },
      subtotal: Math.round(subtotal),
      estimatedRange,
      marketComparison: {
        lowEnd: marketData.low,
        highEnd: marketData.high,
        average: marketData.avg,
      },
    };
  }
}

export const pricingService = new PricingService();
