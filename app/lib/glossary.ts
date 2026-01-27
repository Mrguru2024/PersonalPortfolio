// Glossary of technical terms explained in simple, non-technical language

export interface TermDefinition {
  term: string;
  definition: string;
  category: 'general' | 'web' | 'mobile' | 'ecommerce' | 'technical' | 'design' | 'pricing';
}

export const glossary: Record<string, TermDefinition> = {
  // General Terms
  'website': {
    term: 'Website',
    definition: 'A collection of web pages that people can visit on the internet. Think of it like a digital brochure or storefront for your business.',
    category: 'general',
  },
  'web-app': {
    term: 'Web Application',
    definition: 'A website that works like a computer program. Users can interact with it, enter information, and it can do things like store data, process orders, or manage accounts. Examples include Gmail, Facebook, or online banking.',
    category: 'general',
  },
  'mobile-app': {
    term: 'Mobile App',
    definition: 'An application designed specifically for smartphones and tablets. It can be downloaded from app stores (like the Apple App Store or Google Play) and works on your phone.',
    category: 'mobile',
  },
  'ecommerce': {
    term: 'E-commerce',
    definition: 'A website where you can buy and sell products online. It includes features like shopping carts, payment processing, and order management - basically an online store.',
    category: 'ecommerce',
  },
  'saas': {
    term: 'SaaS (Software as a Service)',
    definition: 'Software that you use through the internet instead of installing it on your computer. You usually pay a monthly or yearly fee to use it. Examples include Netflix, Dropbox, or Salesforce.',
    category: 'general',
  },

  // Technical Terms
  'api': {
    term: 'API',
    definition: 'A way for different software programs to talk to each other and share information. Think of it like a waiter in a restaurant - it takes your order (request) and brings back what you asked for (data).',
    category: 'technical',
  },
  'cms': {
    term: 'CMS (Content Management System)',
    definition: 'A tool that lets you update your website content (like text, images, or blog posts) without needing to know how to code. It\'s like having an easy-to-use editor for your website.',
    category: 'technical',
  },
  'headless-cms': {
    term: 'Headless CMS',
    definition: 'A content management system that stores your content separately from how it\'s displayed. This gives you more flexibility to show your content on websites, mobile apps, or other platforms.',
    category: 'technical',
  },
  'responsive-design': {
    term: 'Responsive Design',
    definition: 'A website that automatically adjusts to look good on any device - whether it\'s a phone, tablet, or computer. The layout changes so everything is easy to read and use, no matter what screen size you have.',
    category: 'design',
  },
  'seo': {
    term: 'SEO (Search Engine Optimization)',
    definition: 'Making your website easier for search engines (like Google) to find and show to people when they search. It helps more people discover your website naturally.',
    category: 'web',
  },
  'authentication': {
    term: 'Authentication',
    definition: 'The process of verifying who you are when you log into a website or app. Usually done with a username and password, or by signing in with Google or Facebook.',
    category: 'technical',
  },
  'sso': {
    term: 'SSO (Single Sign-On)',
    definition: 'A way to log into multiple websites or apps using just one username and password. Instead of remembering many different passwords, you use one account (like your Google account) to access everything.',
    category: 'technical',
  },
  'pwa': {
    term: 'PWA (Progressive Web App)',
    definition: 'A website that works like a mobile app. You can add it to your phone\'s home screen, it works offline, and feels like a native app, but it\'s actually a website.',
    category: 'mobile',
  },
  'hosting': {
    term: 'Hosting',
    definition: 'The service that stores your website files and makes them accessible on the internet. Think of it like renting space on a computer that\'s always connected to the internet so people can visit your site.',
    category: 'technical',
  },
  'domain': {
    term: 'Domain',
    definition: 'Your website\'s address on the internet (like www.yourbusiness.com). It\'s what people type in their browser to find your website.',
    category: 'general',
  },
  'ssl': {
    term: 'SSL Certificate',
    definition: 'A security feature that encrypts information sent between your website and visitors. It shows a padlock icon in the browser and makes your site secure for things like online payments.',
    category: 'technical',
  },

  // Features
  'payment-processing': {
    term: 'Payment Processing',
    definition: 'The ability to accept credit cards, debit cards, or other payment methods on your website. It securely handles transactions so customers can buy products or services from you online.',
    category: 'ecommerce',
  },
  'shopping-cart': {
    term: 'Shopping Cart',
    definition: 'A feature that lets customers select multiple items they want to buy, review them, and then purchase everything at once - just like a physical shopping cart in a store.',
    category: 'ecommerce',
  },
  'inventory-management': {
    term: 'Inventory Management',
    definition: 'A system that tracks how many products you have in stock. It automatically updates when items are sold and can alert you when you\'re running low on products.',
    category: 'ecommerce',
  },
  'real-time-chat': {
    term: 'Real-time Chat',
    definition: 'A messaging feature where people can send and receive messages instantly, like texting or using WhatsApp. Messages appear immediately without refreshing the page.',
    category: 'web',
  },
  'analytics': {
    term: 'Analytics',
    definition: 'Tools that show you statistics about your website, like how many people visit it, which pages they view, how long they stay, and where they come from. It helps you understand your audience.',
    category: 'web',
  },
  'admin-panel': {
    term: 'Admin Panel',
    definition: 'A private area of your website where you can manage everything - add content, view orders, manage users, change settings, and see reports. Only you (and people you allow) can access it.',
    category: 'technical',
  },
  'user-dashboard': {
    term: 'User Dashboard',
    definition: 'A personalized page for each user where they can see their account information, orders, saved items, settings, and other relevant information - like a control center for their account.',
    category: 'web',
  },
  'multi-language': {
    term: 'Multi-language Support',
    definition: 'The ability for your website to display content in different languages. Visitors can choose their preferred language, and the entire site will switch to that language.',
    category: 'web',
  },
  'push-notifications': {
    term: 'Push Notifications',
    definition: 'Messages that pop up on a user\'s device (phone, tablet, or computer) even when they\'re not using your website or app. Like text message alerts, but from your website.',
    category: 'mobile',
  },
  'offline-mode': {
    term: 'Offline Mode',
    definition: 'The ability for your website or app to work even when there\'s no internet connection. Users can still access certain features and data, which syncs when they reconnect.',
    category: 'mobile',
  },

  // Design Terms
  'ui-ux': {
    term: 'UI/UX Design',
    definition: 'UI (User Interface) is how your website looks - colors, buttons, layout. UX (User Experience) is how easy and enjoyable it is to use. Good UI/UX makes your site both beautiful and user-friendly.',
    category: 'design',
  },
  'wireframe': {
    term: 'Wireframe',
    definition: 'A simple, black-and-white sketch of your website that shows where everything will go - like a blueprint for a house. It shows the layout before adding colors and design details.',
    category: 'design',
  },
  'mockup': {
    term: 'Mockup',
    definition: 'A detailed visual representation of how your website will look, including colors, fonts, images, and layout. It\'s like a preview or prototype before the actual website is built.',
    category: 'design',
  },
  'brand-guidelines': {
    term: 'Brand Guidelines',
    definition: 'A set of rules that define your brand\'s visual identity - your logo, colors, fonts, and style. It ensures your website matches your brand and looks consistent across all materials.',
    category: 'design',
  },

  // Pricing Terms
  'mvp': {
    term: 'MVP (Minimum Viable Product)',
    definition: 'The simplest version of your product that has just the essential features needed to launch. It lets you get started quickly and add more features later based on user feedback.',
    category: 'pricing',
  },
  'phased-development': {
    term: 'Phased Development',
    definition: 'Breaking your project into smaller stages or phases. You build and launch the most important features first, then add more features in later phases. This spreads out costs and gets you started faster.',
    category: 'pricing',
  },
  'maintenance': {
    term: 'Maintenance',
    definition: 'Ongoing support to keep your website running smoothly - fixing bugs, updating software, adding small features, and making sure everything stays secure and up-to-date.',
    category: 'pricing',
  },
  'support': {
    term: 'Support',
    definition: 'Help and assistance after your website is launched. This can include answering questions, fixing issues, training you on how to use your site, and making small updates.',
    category: 'pricing',
  },
};

/**
 * Get a term definition from the glossary
 */
export function getTermDefinition(term: string): TermDefinition | undefined {
  const normalizedTerm = term.toLowerCase().replace(/\s+/g, '-');
  return glossary[normalizedTerm] || glossary[term.toLowerCase()];
}

/**
 * Get all terms in a specific category
 */
export function getTermsByCategory(category: TermDefinition['category']): TermDefinition[] {
  return Object.values(glossary).filter(term => term.category === category);
}

/**
 * Search for terms matching a query
 */
export function searchTerms(query: string): TermDefinition[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(glossary).filter(
    term =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery)
  );
}
