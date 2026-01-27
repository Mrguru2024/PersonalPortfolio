// AI Assistance Service for Project Assessment
// Helps clients generate ideas, clarify requirements, and improve descriptions

import { ProjectAssessment } from "@shared/assessmentSchema";

interface AIRequest {
  type: 'generate-ideas' | 'suggest-features' | 'clarify-requirements' | 'improve-description';
  context: string;
  currentAnswers?: Record<string, any>;
}

export class AIAssistanceService {
  private openaiApiKey: string | null;
  private isConfigured: boolean;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    this.isConfigured = !!this.openaiApiKey;

    if (!this.isConfigured) {
      console.warn('⚠️  OpenAI API key not found. AI assistance will use fallback responses.');
      console.warn('   Set OPENAI_API_KEY in your .env.local file to enable AI features.');
    }
  }

  async generateIdeas(context: string, projectType?: string): Promise<string[]> {
    if (!this.isConfigured) {
      // Fallback suggestions based on project type
      return this.getFallbackIdeas(projectType);
    }

    try {
      // In a real implementation, you would call OpenAI API here
      // For now, we'll use intelligent fallbacks
      return this.getIntelligentSuggestions(context, projectType);
    } catch (error) {
      console.error('Error generating AI ideas:', error);
      return this.getFallbackIdeas(projectType);
    }
  }

  async suggestFeatures(projectType: string, currentFeatures: string[] = []): Promise<string[]> {
    const featureSuggestions: Record<string, string[]> = {
      website: [
        'Contact form',
        'Blog/News section',
        'Image gallery',
        'SEO optimization',
        'Analytics integration',
        'Social media integration',
        'Newsletter signup',
        'Testimonials section',
      ],
      'web-app': [
        'User dashboard',
        'Data visualization',
        'File upload/download',
        'Search functionality',
        'Notifications',
        'Export/Import data',
        'Admin panel',
        'User roles & permissions',
      ],
      'mobile-app': [
        'Push notifications',
        'Offline mode',
        'Biometric authentication',
        'Location services',
        'Camera integration',
        'Social sharing',
        'In-app purchases',
        'Analytics tracking',
      ],
      ecommerce: [
        'Product catalog',
        'Shopping cart',
        'Payment gateway',
        'Order management',
        'Inventory tracking',
        'Customer reviews',
        'Wishlist',
        'Shipping calculator',
      ],
      saas: [
        'Subscription management',
        'Billing system',
        'User onboarding',
        'Usage analytics',
        'API access',
        'Team collaboration',
        'Data export',
        'Custom branding',
      ],
    };

    const suggestions = featureSuggestions[projectType as keyof typeof featureSuggestions] || [];
    
    // Filter out already selected features
    return suggestions.filter(f => !currentFeatures.includes(f));
  }

  async improveDescription(description: string, projectType?: string): Promise<string> {
    // Simple improvement logic - in production, use AI
    let improved = description.trim();
    
    // Ensure it starts with a capital letter
    if (improved.length > 0) {
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    }
    
    // Add period if missing
    if (improved.length > 0 && !improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
      improved += '.';
    }
    
    // If description is too short, suggest expansion
    if (improved.length < 50) {
      improved += ' Consider adding more details about your target users, key features, and business goals.';
    }
    
    return improved;
  }

  async clarifyRequirements(question: string, context: Record<string, any>): Promise<string[]> {
    // Generate clarifying questions based on context
    const questions: string[] = [];
    
    if (!context.projectType) {
      questions.push('What type of project are you building? (website, web app, mobile app, etc.)');
    }
    
    if (!context.targetAudience) {
      questions.push('Who is your target audience? (age, demographics, technical level)');
    }
    
    if (!context.mainGoals || context.mainGoals.length === 0) {
      questions.push('What are your main business goals for this project?');
    }
    
    if (context.projectType === 'web-app' && !context.mustHaveFeatures) {
      questions.push('What are the must-have features for your web application?');
    }
    
    if (!context.budgetRange) {
      questions.push('What is your budget range for this project?');
    }
    
    return questions.slice(0, 3); // Return top 3 questions
  }

  private getFallbackIdeas(projectType?: string): string[] {
    const ideas: Record<string, string[]> = {
      website: [
        'Create a modern, responsive design that works on all devices',
        'Include a blog section to share updates and improve SEO',
        'Add a contact form with automated email notifications',
        'Integrate social media links and sharing buttons',
      ],
      'web-app': [
        'Build a user-friendly dashboard for data visualization',
        'Implement secure user authentication and authorization',
        'Add real-time updates for collaborative features',
        'Create an admin panel for content management',
      ],
      'mobile-app': [
        'Design an intuitive mobile-first user interface',
        'Implement push notifications for user engagement',
        'Add offline functionality for better user experience',
        'Integrate with device features like camera and GPS',
      ],
      ecommerce: [
        'Create a seamless shopping experience with easy checkout',
        'Implement product search and filtering capabilities',
        'Add customer reviews and ratings for social proof',
        'Include inventory management and order tracking',
      ],
    };

    return ideas[projectType as keyof typeof ideas] || [
      'Focus on user experience and intuitive navigation',
      'Ensure the design is responsive and accessible',
      'Plan for scalability and future growth',
      'Consider integration with existing business tools',
    ];
  }

  private getIntelligentSuggestions(context: string, projectType?: string): string[] {
    // Enhanced suggestions based on context analysis
    const suggestions = this.getFallbackIdeas(projectType);
    
    // Add context-specific suggestions
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('ecommerce') || contextLower.includes('shop') || contextLower.includes('store')) {
      suggestions.push('Consider implementing a wishlist feature for better user engagement');
      suggestions.push('Add product recommendations based on user behavior');
    }
    
    if (contextLower.includes('saas') || contextLower.includes('subscription')) {
      suggestions.push('Implement a free trial period to attract users');
      suggestions.push('Create tiered pricing plans for different user needs');
    }
    
    if (contextLower.includes('mobile') || contextLower.includes('app')) {
      suggestions.push('Design for both iOS and Android platforms');
      suggestions.push('Consider progressive web app (PWA) capabilities');
    }
    
    return suggestions.slice(0, 4); // Return top 4 suggestions
  }

  async generateProjectSuggestions(assessment: ProjectAssessment): Promise<string> {
    const projectType = assessment.projectType;
    const projectName = assessment.projectName;
    const description = assessment.projectDescription;
    
    let suggestions = `PROJECT SUGGESTIONS FOR: ${projectName}\n`;
    suggestions += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    suggestions += `PROJECT TYPE: ${projectType.toUpperCase()}\n\n`;
    suggestions += `DESCRIPTION:\n${description}\n\n`;
    
    suggestions += `RECOMMENDED FEATURES:\n`;
    const features = await this.suggestFeatures(projectType, assessment.mustHaveFeatures || []);
    features.forEach((feature, idx) => {
      suggestions += `${idx + 1}. ${feature}\n`;
    });
    
    suggestions += `\nTECHNICAL RECOMMENDATIONS:\n`;
    if (assessment.platform && assessment.platform.length > 0) {
      suggestions += `• Platforms: ${assessment.platform.join(', ')}\n`;
    }
    if (assessment.dataStorage) {
      suggestions += `• Data Storage: ${assessment.dataStorage}\n`;
    }
    if (assessment.userAuthentication) {
      suggestions += `• Authentication: ${assessment.userAuthentication}\n`;
    }
    
    suggestions += `\nBUSINESS RECOMMENDATIONS:\n`;
    if (assessment.primaryBusinessGoal) {
      suggestions += `• Primary Goal: ${assessment.primaryBusinessGoal}\n`;
    }
    if (assessment.revenueModel) {
      suggestions += `• Revenue Model: ${assessment.revenueModel}\n`;
    }
    if (assessment.expectedUsers) {
      suggestions += `• Expected Users: ${assessment.expectedUsers}\n`;
    }
    
    return suggestions;
  }
}

export const aiAssistanceService = new AIAssistanceService();
