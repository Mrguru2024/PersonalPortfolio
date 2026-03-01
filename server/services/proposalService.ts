import { ProjectAssessment } from "@shared/assessmentSchema";
import { pricingService } from "./pricingService";
import { aiAssistanceService } from "./aiAssistanceService";

/** Single development phase in the professional proposal template (e.g. Phase 1 — Launch Foundation). */
export interface ProposalDevelopmentPhase {
  phaseName: string;
  purpose: string;
  included: string[];
  benefits: string[];
  investment: number | string; // number in dollars or range string e.g. "$3,200 – $4,500"
}

export interface ProposalDocument {
  title: string;
  clientName: string;
  clientEmail: string;
  date: string;
  /** Company name shown as "Prepared by" (e.g. Ascendra Technologies). Set via PROPOSAL_COMPANY_NAME. */
  preparedBy: string;
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
  /** Human-readable payment structure (e.g. "40% deposit to begin, 30% at midpoint, 30% prior to launch"). */
  paymentStructureText: string;
  /** Post-launch support description (e.g. "30 days of post-launch support is included after each phase launch."). */
  postLaunchSupportText: string;
  /** Collaboration & adjustments note. */
  collaborationNote: string;
  /** Optional phased development breakdown for doc-style proposals. */
  developmentPhases?: ProposalDevelopmentPhase[];
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

    const nextStepsStandard = this.getStandardNextSteps();
    const paymentStructureText = '40% deposit to begin, 30% at midpoint, 30% prior to launch. Future phases will follow a similar structure.';
    const postLaunchSupportText = '30 days of post-launch support is included after each phase launch.';
    const collaborationNote = 'Throughout development, we will work collaboratively to ensure the platform aligns with your vision. Adjustments within the agreed scope of each phase will be incorporated during development. Major feature additions outside of the confirmed phase scope can be scheduled for a future phase to maintain timeline clarity.';
    const preparedBy = process.env.PROPOSAL_COMPANY_NAME || 'Ascendra Technologies';

    return {
      title: `Professional Proposal: ${assessment.projectName}`,
      clientName: assessment.name,
      clientEmail: assessment.email,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      preparedBy,
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
      nextSteps: nextStepsStandard,
      paymentStructureText,
      postLaunchSupportText,
      collaborationNote,
      developmentPhases: this.buildDevelopmentPhasesFromTimeline(timeline, finalTotal),
      domainServices,
      specialNotes,
    };
  }

  /** Next steps matching the professional proposal workflow (review → confirm → sign → deposit → kickoff). */
  private getStandardNextSteps(): string[] {
    return [
      'Review proposal',
      'Confirm Phase 1 (or project) approval',
      'Sign agreement',
      'Submit initial deposit',
      'Schedule kickoff',
    ];
  }

  /** Build doc-style development phases from timeline + total for client-facing display. */
  private buildDevelopmentPhasesFromTimeline(timeline: ProposalDocument['timeline'], finalTotal: number): ProposalDevelopmentPhase[] {
    const phases = timeline.phases.map((p, i) => {
      const pct = i === 0 ? 0.25 : i === 1 ? 0.45 : i === 2 ? 0.2 : 0.1;
      const amount = Math.round(finalTotal * pct);
      return {
        phaseName: p.phase,
        purpose: i === 0 ? 'Establish foundation and scope.' : i === 1 ? 'Core build and integration.' : i === 2 ? 'Quality assurance and refinement.' : 'Launch and handoff.',
        included: p.deliverables,
        benefits: [
          'Clear milestones',
          'Aligned deliverables',
          'Predictable timeline',
        ],
        investment: amount,
      };
    });
    return phases;
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

  /** Payment structure: 40% deposit, 30% at midpoint, 30% prior to launch (matches professional proposal template). */
  private generatePaymentSchedule(total: number, _duration: string): Array<{ milestone: string; amount: number; dueDate: string }> {
    const schedule = [
      { milestone: 'Deposit to begin', amount: Math.round(total * 0.4), dueDate: 'Upon contract signing' },
      { milestone: 'Midpoint', amount: Math.round(total * 0.3), dueDate: 'At project midpoint' },
      { milestone: 'Prior to launch', amount: Math.round(total * 0.3), dueDate: 'Prior to launch' },
    ];
    const paid = schedule.slice(0, -1).reduce((sum, item) => sum + item.amount, 0);
    schedule[schedule.length - 1].amount = total - paid;
    return schedule;
  }

  private generateNextSteps(_assessment: ProjectAssessment, _isLowBudget: boolean): string[] {
    return this.getStandardNextSteps();
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
