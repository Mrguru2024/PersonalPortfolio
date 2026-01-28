import { ProjectAssessment } from "@shared/assessmentSchema";
import { pricingService } from "./pricingService";
import { aiAssistanceService } from "./aiAssistanceService";

export interface ProposalDocument {
  title: string;
  clientName: string;
  clientEmail: string;
  date: string;
  projectOverview: {
    projectName: string;
    projectType: string;
    description: string;
    targetAudience: string;
    mainGoals: string[];
  };
  scopeOfWork: {
    features: string[];
    platforms: string[];
    integrations: string[];
    technicalRequirements: string[];
  };
  timeline: {
    phases: Array<{
      phase: string;
      duration: string;
      deliverables: string[];
    }>;
    totalDuration: string;
    startDate: string;
  };
  pricing: {
    basePrice: number;
    features: Array<{
      name: string;
      price: number;
      category: string;
    }>;
    complexity: {
      level: string;
      multiplier: number;
      description: string;
    };
    timeline: {
      rush: boolean;
      multiplier: number;
      description: string;
    };
    platform: {
      platforms: string[];
      price: number;
    };
    design: {
      level: string;
      price: number;
    };
    integrations: {
      count: number;
      price: number;
    };
    subtotal: number;
    finalTotal: number;
    paymentSchedule: Array<{
      milestone: string;
      amount: number;
      dueDate: string;
    }>;
  };
  deliverables: string[];
  expectations: {
    clientResponsibilities: string[];
    ourCommitments: string[];
    communication: string;
  };
  nextSteps: string[];
  domainServices?: {
    included: boolean;
    message: string;
    pricing: string;
  };
  specialNotes?: string;
}

export class ProposalService {
  /**
   * Generate a comprehensive professional proposal document
   */
  async generateProposal(assessment: ProjectAssessment, assessmentId: number): Promise<ProposalDocument> {
    const pricingBreakdown = pricingService.calculatePricing(assessment);
    const budgetRange = this.getBudgetRange(assessment.budgetRange);
    // Check if budget is under $5000
    const isLowBudget = budgetRange.max < 5000 || 
                        assessment.budgetRange === "under-5k";
    
    // Calculate precise total based on pricing breakdown
    const finalTotal = this.calculatePreciseTotal(pricingBreakdown, assessment);
    
    // Generate timeline based on project complexity and timeline preference
    const timeline = this.generateTimeline(assessment, pricingBreakdown);
    
    // Generate scope of work
    const scopeOfWork = this.generateScopeOfWork(assessment);
    
    // Generate deliverables
    const deliverables = this.generateDeliverables(assessment, pricingBreakdown);
    
    // Generate expectations
    const expectations = this.generateExpectations(assessment);
    
    // Generate payment schedule
    const paymentSchedule = this.generatePaymentSchedule(finalTotal, timeline.totalDuration);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(assessment, isLowBudget);
    
    // Domain services promotion
    const domainServices = this.generateDomainServices(assessment);
    
    // Special notes for low budget projects
    const specialNotes = isLowBudget 
      ? this.generateLowBudgetProposal(assessment, finalTotal)
      : undefined;

    return {
      title: `Professional Proposal: ${assessment.projectName}`,
      clientName: assessment.name,
      clientEmail: assessment.email,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      projectOverview: {
        projectName: assessment.projectName,
        projectType: assessment.projectType,
        description: assessment.projectDescription,
        targetAudience: assessment.targetAudience,
        mainGoals: assessment.mainGoals || [],
      },
      scopeOfWork,
      timeline,
      pricing: {
        basePrice: pricingBreakdown.basePrice,
        features: pricingBreakdown.features,
        complexity: pricingBreakdown.complexity,
        timeline: pricingBreakdown.timeline,
        platform: pricingBreakdown.platform,
        design: pricingBreakdown.design,
        integrations: pricingBreakdown.integrations,
        subtotal: pricingBreakdown.subtotal,
        finalTotal,
        paymentSchedule,
      },
      deliverables,
      expectations,
      nextSteps,
      domainServices,
      specialNotes,
    };
  }

  /**
   * Generate project suggestions document with domain promotion
   */
  async generateProjectSuggestions(assessment: ProjectAssessment): Promise<string> {
    const suggestions = await aiAssistanceService.generateProjectSuggestions(assessment);
    
    const domainPromotion = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    DOMAIN OWNERSHIP OPPORTUNITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Need a Domain for Your Project?

We offer domain registration and ownership services to ensure you have complete 
control over your online presence. When you purchase a domain through us, you get:

✓ Full ownership and control of your domain
✓ Professional domain management
✓ Easy transfer options
✓ Competitive pricing
✓ Expert guidance on domain selection

Contact us to discuss domain options for "${assessment.projectName}" and secure 
your brand's online identity today!

Email: 5epmgllc@gmail.com
Phone: 678-216-5112

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return `${suggestions}\n\n${domainPromotion}`;
  }

  private getBudgetRange(budgetRange?: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      'under-5k': { min: 0, max: 5000 },
      '1-2k': { min: 1000, max: 2000 },
      '2-5k': { min: 2000, max: 5000 },
      '5k-10k': { min: 5000, max: 10000 },
      '10k-25k': { min: 10000, max: 25000 },
      '25k-50k': { min: 25000, max: 50000 },
      '50k-100k': { min: 50000, max: 100000 },
      '100k+': { min: 100000, max: 500000 },
      'discuss': { min: 0, max: Infinity },
    };
    
    return ranges[budgetRange || 'discuss'] || ranges['discuss'];
  }

  private calculatePreciseTotal(pricingBreakdown: any, assessment: ProjectAssessment): number {
    // Start with base price
    let total = pricingBreakdown.basePrice;
    
    // Add feature costs
    if (pricingBreakdown.features) {
      total += pricingBreakdown.features.reduce((sum: number, f: any) => sum + f.price, 0);
    }
    
    // Add platform costs
    if (pricingBreakdown.platform) {
      total += pricingBreakdown.platform.price || 0;
    }
    
    // Add design costs
    if (pricingBreakdown.design) {
      total += pricingBreakdown.design.price || 0;
    }
    
    // Add integration costs
    if (pricingBreakdown.integrations) {
      total += pricingBreakdown.integrations.price || 0;
    }
    
    // Apply complexity multiplier
    if (pricingBreakdown.complexity) {
      total *= pricingBreakdown.complexity.multiplier;
    }
    
    // Apply timeline multiplier
    if (pricingBreakdown.timeline && pricingBreakdown.timeline.rush) {
      total *= pricingBreakdown.timeline.multiplier;
    }
    
    // Round to nearest 100 for professional pricing
    return Math.round(total / 100) * 100;
  }

  private generateTimeline(assessment: ProjectAssessment, pricingBreakdown: any): ProposalDocument['timeline'] {
    const baseDuration = this.getBaseDuration(assessment.projectType);
    const complexityMultiplier = pricingBreakdown.complexity?.multiplier || 1;
    const isRush = assessment.preferredTimeline === 'asap' || assessment.preferredTimeline === '1-3-months';
    
    const totalWeeks = Math.ceil(baseDuration * complexityMultiplier * (isRush ? 0.8 : 1));
    
    const phases = [
      {
        phase: 'Discovery & Planning',
        duration: `${Math.ceil(totalWeeks * 0.15)} weeks`,
        deliverables: [
          'Project requirements document',
          'Technical architecture plan',
          'Design mockups and wireframes',
          'Project timeline and milestones',
        ],
      },
      {
        phase: 'Design & Development',
        duration: `${Math.ceil(totalWeeks * 0.6)} weeks`,
        deliverables: [
          'UI/UX design implementation',
          'Core functionality development',
          'Integration setup',
          'Testing and quality assurance',
        ],
      },
      {
        phase: 'Testing & Refinement',
        duration: `${Math.ceil(totalWeeks * 0.15)} weeks`,
        deliverables: [
          'Comprehensive testing',
          'Bug fixes and refinements',
          'Performance optimization',
          'Client review and feedback implementation',
        ],
      },
      {
        phase: 'Launch & Handoff',
        duration: `${Math.ceil(totalWeeks * 0.1)} weeks`,
        deliverables: [
          'Production deployment',
          'Documentation delivery',
          'Training and knowledge transfer',
          'Post-launch support setup',
        ],
      },
    ];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start 1 week from now
    
    return {
      phases,
      totalDuration: `${totalWeeks} weeks (approximately ${Math.ceil(totalWeeks / 4)} months)`,
      startDate: startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    };
  }

  private getBaseDuration(projectType: string): number {
    const durations: Record<string, number> = {
      'website': 4,
      'web-app': 12,
      'mobile-app': 16,
      'ecommerce': 10,
      'saas': 20,
      'api': 8,
      'other': 10,
    };
    
    return durations[projectType] || 10;
  }

  private generateScopeOfWork(assessment: ProjectAssessment): ProposalDocument['scopeOfWork'] {
    return {
      features: assessment.mustHaveFeatures || [],
      platforms: assessment.platform || [],
      integrations: assessment.integrations || [],
      technicalRequirements: [
        ...(assessment.dataStorage ? [`Data Storage: ${assessment.dataStorage}`] : []),
        ...(assessment.userAuthentication ? [`Authentication: ${assessment.userAuthentication}`] : []),
        ...(assessment.paymentProcessing ? ['Payment Processing Integration'] : []),
        ...(assessment.realTimeFeatures ? ['Real-time Features'] : []),
        ...(assessment.apiRequirements && assessment.apiRequirements !== 'none' 
          ? [`API Requirements: ${assessment.apiRequirements}`] 
          : []),
        ...(assessment.contentManagement ? [`Content Management: ${assessment.contentManagement}`] : []),
        ...(assessment.responsiveDesign ? ['Responsive Design (Mobile, Tablet, Desktop)'] : []),
        ...(assessment.accessibilityRequirements 
          ? [`Accessibility: ${assessment.accessibilityRequirements}`] 
          : []),
      ],
    };
  }

  private generateDeliverables(assessment: ProjectAssessment, pricingBreakdown: any): string[] {
    const deliverables = [
      'Fully functional application/website',
      'Source code and documentation',
      'Deployment to production environment',
      'User documentation and guides',
      'Admin panel (if applicable)',
    ];
    
    if (assessment.hasBrandGuidelines) {
      deliverables.push('Brand guideline implementation');
    }
    
    if (pricingBreakdown.design?.price) {
      deliverables.push('Custom design system');
      deliverables.push('Design assets and style guide');
    }
    
    if (assessment.contentManagement && assessment.contentManagement !== 'static') {
      deliverables.push('Content management system setup');
    }
    
    deliverables.push('Post-launch support (30 days)');
    
    return deliverables;
  }

  private generateExpectations(assessment: ProjectAssessment): ProposalDocument['expectations'] {
    return {
      clientResponsibilities: [
        'Provide timely feedback on designs and development milestones',
        'Supply all necessary content, images, and brand assets',
        'Respond to questions and requests within 2 business days',
        'Participate in scheduled review meetings',
        'Approve milestones before proceeding to next phase',
        'Provide access to necessary third-party services and accounts',
      ],
      ourCommitments: [
        'Deliver high-quality code following industry best practices',
        'Meet agreed-upon milestones and deadlines',
        'Provide regular progress updates and communication',
        'Ensure responsive design across all devices',
        'Implement security best practices',
        'Provide comprehensive documentation',
        'Offer 30 days of post-launch support',
      ],
      communication: 'We will communicate primarily via email with scheduled video calls for major milestones. Response time: within 24 hours on business days.',
    };
  }

  private generatePaymentSchedule(total: number, duration: string): Array<{ milestone: string; amount: number; dueDate: string }> {
    const schedule = [
      {
        milestone: 'Project Kickoff',
        amount: Math.round(total * 0.3),
        dueDate: 'Upon contract signing',
      },
      {
        milestone: 'Design Approval',
        amount: Math.round(total * 0.3),
        dueDate: 'Upon design phase completion',
      },
      {
        milestone: 'Development Milestone',
        amount: Math.round(total * 0.3),
        dueDate: 'Upon development phase completion',
      },
      {
        milestone: 'Final Delivery',
        amount: Math.round(total * 0.1),
        dueDate: 'Upon project completion and launch',
      },
    ];
    
    // Adjust last payment to account for rounding
    const paid = schedule.slice(0, -1).reduce((sum, item) => sum + item.amount, 0);
    schedule[schedule.length - 1].amount = total - paid;
    
    return schedule;
  }

  private generateNextSteps(assessment: ProjectAssessment, isLowBudget: boolean): string[] {
    const steps = [
      'Review this proposal and discuss any questions or concerns',
      'Confirm project scope and timeline',
      'Sign the project agreement',
      'Provide initial payment to begin project kickoff',
      'Schedule kickoff meeting to discuss project details',
    ];
    
    if (isLowBudget) {
      steps.unshift('Consider the realistic scope options provided for your budget');
      steps.push('Discuss phased approach if needed to fit budget constraints');
    }
    
    return steps;
  }

  private generateDomainServices(assessment: ProjectAssessment): ProposalDocument['domainServices'] {
    return {
      included: false,
      message: 'We offer domain registration and ownership services. Secure your brand\'s online identity with a professional domain name.',
      pricing: 'Domain pricing varies by extension (.com, .net, .org, etc.). Contact us for a quote on your preferred domain name.',
    };
  }

  private generateLowBudgetProposal(assessment: ProjectAssessment, total: number): string {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    REALISTIC PROPOSAL FOR YOUR BUDGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We understand that your budget is under $5,000. To provide you with the best 
value and realistic expectations, we recommend the following approach:

OPTION 1: Phased Development Approach
──────────────────────────────────────
Break your project into smaller, manageable phases that fit your budget:

Phase 1: MVP (Minimum Viable Product) - $${Math.round(total * 0.6).toLocaleString()}
  • Core functionality only
  • Essential features
  • Basic design
  • Launch-ready foundation

Phase 2: Enhancements - $${Math.round(total * 0.4).toLocaleString()}
  • Additional features
  • Design refinements
  • Performance optimization
  • Advanced integrations

OPTION 2: Simplified Scope
───────────────────────────
Focus on essential features that deliver maximum value:

✓ Core functionality
✓ Responsive design
✓ Basic integrations
✓ Essential features only
✓ Standard design (no custom design system)

OPTION 3: Template-Based Solution
──────────────────────────────────
Use a professional template as a foundation to reduce costs:

✓ Customized professional template
✓ Your branding and content
✓ Essential customizations
✓ Faster delivery
✓ Lower cost

RECOMMENDED TOTAL: $${total.toLocaleString()}

This proposal reflects a realistic scope that fits your budget while delivering 
a professional, functional solution. We can discuss which approach works best 
for your needs and timeline.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
}

export const proposalService = new ProposalService();
