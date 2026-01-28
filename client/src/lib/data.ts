export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  githubUrl?: string;
  liveUrl?: string;
  details?: string;
  demoType?: "iframe" | "video" | "github" | "custom";
  demoUrl?: string;
  demoConfig?: {
    width?: string;
    height?: string;
    allowFullscreen?: boolean;
    isResponsive?: boolean;
    showCode?: boolean;
    theme?: string;
    githubBranch?: string;
  };
  repoOwner?: string;
  repoName?: string;
  techStack?: string[];
  synopsis?: {
    tagline: string;
    description: string;
    caseStudy: {
      problem: string;
      role: string[];
      stack: string[];
      features: string[];
      status: string;
      nextSteps: string[];
    };
  };
}

export interface Skill {
  name: string;
  percentage: number;
  id?: number;
  endorsement_count?: number;
  category?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  description: string;
  education: string[];
  experience: string[];
  resumeUrl: string;
  image: string;
}

export interface ContactInfo {
  email: string;
  location: string;
  phone: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  authorId: number;
  isPublished: boolean;
}

export interface BlogComment {
  id: number;
  postId: number;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}

export const personalInfo: PersonalInfo = {
  name: "Anthony Feaster (MrGuru.dev)",
  title: "Full Stack Web Developer",
  description: "Hello! I'm Anthony Feaster, also known as MrGuru.dev, an innovative entrepreneur and tech enthusiast based in Atlanta, Georgia. With a strong background in electronic repair and automotive locksmiths, I founded SSI-M.E.T Repairs-KeyCode Help to bring advanced technology solutions to the locksmith industry. Currently, I'm expanding my skill set through Codenoobs WebDev Incubator. My passion lies in problem-solving and continuous learning. I thrive on creating solutions that improve customer experiences and streamline operations.",
  education: [
    "Codenoobs WebDev Incubator",
    "Tech Entrepreneurship Training",
    "Automotive Security Systems Specialist"
  ],
  experience: [
    "Founder, SSI-M.E.T Repairs-KeyCode Help",
    "Automotive Locksmith Specialist",
    "Electronic Repair Technician"
  ],
  resumeUrl: "/api/resume",
  image: "https://github.com/Mrguru2024.png"
};

export const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com/Mrguru2024",
    icon: "github"
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/in/anthony-mrguru-feaster/",
    icon: "linkedin"
  },
  {
    platform: "Threads",
    url: "https://www.threads.com/@therealmrguru",
    icon: "threads"
  },
  {
    platform: "MrGuru.dev",
    url: "https://mrguru.dev",
    icon: "globe"
  },
  {
    platform: "Email",
    url: "mailto:5epmgllc@gmail.com",
    icon: "mail"
  }
];

export const contactInfo: ContactInfo = {
  email: "5epmgllc@gmail.com",
  location: "Atlanta, Georgia",
  phone: "+1 (678) 506-1143"
};

export const frontendSkills: Skill[] = [
  { name: "JavaScript", percentage: 85 },
  { name: "HTML & CSS", percentage: 90 },
  { name: "React", percentage: 80 },
  { name: "Responsive Design", percentage: 85 }
];

export const backendSkills: Skill[] = [
  { name: "Node.js", percentage: 75 },
  { name: "Express", percentage: 70 },
  { name: "MongoDB", percentage: 65 },
  { name: "Java", percentage: 60 }
];

export const devopsSkills: Skill[] = [
  { name: "Git/GitHub", percentage: 85 },
  { name: "Vercel", percentage: 75 },
  { name: "Netlify", percentage: 70 },
  { name: "VS Code", percentage: 90 }
];

export const additionalSkills: string[] = [
  "Problem Solving",
  "Customer Service",
  "Automotive Security",
  "Electronic Repair",
  "Entrepreneurship",
  "Business Development",
  "Technical Documentation",
  "Team Leadership"
];

export const projects: Project[] = [
  {
    id: "keycode-help",
    title: "Keycode Help",
    description: "A SaaS business that provides VIN to KeyCode services and online resources for locksmiths.",
    image: "/keycode-logo.png",
    tags: ["SaaS", "Automotive", "Security"],
    category: "business",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://keycodehelp.com",
    details: "Keycode Help is a Software as a Service (SaaS) platform designed to support automotive professionals with key coding and programming needs. This platform provides essential VIN to KeyCode translation services specifically for locksmiths working in the automotive security industry.",
    demoType: "iframe",
    demoUrl: "https://keycodehelp.com",
    demoConfig: {
      width: "100%",
      height: "600px",
      allowFullscreen: true,
      isResponsive: true
    },
    techStack: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
    synopsis: {
      tagline: "Automotive keycodes. Verified. Secured. Delivered.",
      description: "Born out of real-world locksmith frustrations and the need for ethical, secure access to automotive key codes, Keycode Help is a professional-grade SaaS solution for automotive locksmiths, tow drivers, and security technicians. This platform bridges the gap between hard-to-access OEM keycode databases and vetted technicians, offering tools for quick lookups, guided resources, and secure usage tracking. This isn't just a tool—it's an ecosystem built to support licensed professionals with integrity, while keeping compliance and customer safety at its core.",
      caseStudy: {
        problem: "No centralized, trustworthy, and secure platform existed for independent pros to access keycodes or track VIN-to-key workflows legally and efficiently.",
        role: [
          "Founder / Full Stack Developer",
          "UI/UX Designer (Wix + Velo & migrating to Next.js)",
          "Market Researcher & Industry Liaison"
        ],
        stack: [
          "Next.js 15.3 (App Router)",
          "TypeScript, Tailwind CSS, Prisma ORM",
          "MySQL (Dev) → Firebase (Prod)",
          "Stripe (payments), Storybook (components), Sanity (CMS)"
        ],
        features: [
          "Role-based dashboards (Technician, Admin, Reseller)",
          "Pro Membership checkout system",
          "VIN-to-keycode workflow + Request history",
          "Research toolkits, API documentation access",
          "Survey incentive & onboarding systems for research"
        ],
        status: "✅ MVP Build Phase 🚀 Target Launch: Q1 2026",
        nextSteps: [
          "API integration with OEMs & NASTF approval",
          "Data licensing agreements",
          "Expanding member benefits & pro community board"
        ]
      }
    }
  },
  {
    id: "portfolio-website",
    title: "Portfolio Website",
    description: "A responsive portfolio website showcasing my skills, projects and professional information.",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["HTML", "CSS", "JavaScript", "Responsive"],
    category: "web",
    githubUrl: "https://github.com/Mrguru2024/My-Portfolio-Website",
    liveUrl: "https://mrguru2024.github.io/My-Portfolio-Website/",
    details: "A personal portfolio website built using HTML, CSS, and JavaScript to showcase my projects, skills, and professional experience. The site features responsive design, theme customization, and interactive elements.",
    demoType: "github",
    repoOwner: "Mrguru2024",
    repoName: "My-Portfolio-Website",
    demoConfig: {
      showCode: true,
      githubBranch: "main"
    },
    techStack: ["HTML", "CSS", "JavaScript", "Bootstrap"]
  },
  {
    id: "stackzen",
    title: "Stackzen",
    description: "An intelligent income and expense tracking platform with data visualization and financial insights.",
    image: "/stackzen-logo.svg",
    tags: ["React", "Vite", "Node.js", "Express", "PostgreSQL"],
    category: "web",
    githubUrl: "https://github.com/Mrguru2024/Stackzen",
    liveUrl: "https://income-intelligence-mytech7.replit.app/",
    details: "Stackzen is an advanced financial management platform designed to help users track income, expenses, and financial goals. It features interactive data visualizations, budget planning tools, and personalized insights to improve financial health.",
    demoType: "iframe",
    demoUrl: "https://income-intelligence-mytech7.replit.app/",
    demoConfig: {
      width: "100%",
      height: "650px",
      allowFullscreen: true,
      isResponsive: true
    },
    techStack: ["React", "Vite", "TailwindCSS", "Express", "PostgreSQL", "Chart.js"],
    synopsis: {
      tagline: "Financial Intelligence. Visualized. Personalized.",
      description: "Stackzen transforms how individuals and small businesses manage their finances through intuitive tracking and meaningful visualization. Born from my own need to make sense of complex financial data, this platform combines smart categorization with powerful analytics to help users take control of their financial future and make data-driven decisions with confidence.",
      caseStudy: {
        problem: "Traditional financial management tools were either too complex for everyday users or too simplistic to provide meaningful insights, creating a gap between basic expense tracking and actionable financial intelligence.",
        role: [
          "Full Stack Developer",
          "UX/UI Designer",
          "Financial Data Architect"
        ],
        stack: [
          "React + Vite (Frontend)",
          "Express + Node.js (Backend)",
          "PostgreSQL (Database)",
          "Chart.js (Visualizations)",
          "TailwindCSS (Styling)",
          "React Query (Data Fetching)"
        ],
        features: [
          "Smart transaction categorization with AI-assisted tagging",
          "Interactive dashboard with customizable data visualizations",
          "Goal tracking with progress indicators and forecasting",
          "Financial health score with personalized improvement suggestions",
          "Export capabilities for tax preparation and financial planning"
        ],
        status: "✅ Beta Release 🚀 Actively Collecting User Feedback",
        nextSteps: [
          "Implementing subscription model with tiered access",
          "Adding integration with banking APIs for real-time data",
          "Developing mobile companion app for on-the-go tracking",
          "Building investment portfolio tracking and analysis tools"
        ]
      }
    }
  },
  {
    id: "inventory-management",
    title: "Inventory Management System",
    description: "A comprehensive inventory management solution for small businesses.",
    image: "/inventory-logo.svg",
    tags: ["React", "Firebase", "Cloud Functions"],
    category: "business",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://keycodehelp.com",
    details: "A complete inventory management system designed for small businesses. Features include product tracking, barcode scanning, sales reporting, and low stock alerts.",
    demoType: "iframe",
    demoUrl: "https://keycodehelp.com",
    demoConfig: {
      width: "100%",
      height: "600px",
      allowFullscreen: true,
      isResponsive: true
    },
    techStack: ["React", "Firebase", "Cloud Functions", "Material UI"],
    synopsis: {
      tagline: "Stock. Sales. Simplified.",
      description: "This inventory management system empowers small businesses to take control of their product lifecycle from purchase to sale. After witnessing small retail shops struggle with outdated inventory methods, I built this cloud-based solution to bring enterprise-level inventory capabilities to businesses of all sizes without the enterprise price tag or complexity. The system bridges physical products with digital tracking through barcode integration and real-time analytics.",
      caseStudy: {
        problem: "Small businesses were struggling with inventory management, either using pen-and-paper methods or expensive enterprise solutions that were too complex for their needs, leading to stockouts, overstocking, and lost sales opportunities.",
        role: [
          "Full Stack Developer",
          "Database Architect",
          "User Experience Researcher",
          "Small Business Consultant"
        ],
        stack: [
          "React (Frontend Framework)",
          "Firebase (Authentication & Database)",
          "Cloud Functions (Automated Tasks)",
          "Material UI (Component Library)",
          "Firestore (NoSQL Database)",
          "Firebase Storage (Media Storage)"
        ],
        features: [
          "Barcode scanning with mobile device camera integration",
          "Purchase order management with supplier tracking",
          "Sales forecasting based on historical data",
          "Low stock alerts and automatic reorder suggestions",
          "Multi-location inventory tracking for businesses with multiple stores",
          "Batch operations for efficient inventory management"
        ],
        status: "✅ Production 🚀 Active Users: 12 small businesses",
        nextSteps: [
          "Implementing advanced analytics dashboard with ML-based insights",
          "Adding QuickBooks and other accounting software integrations",
          "Developing vendor portal for streamlined order processing",
          "Building customer-facing API for online store integrations"
        ]
      }
    }
  },
  {
    id: "gatherly",
    title: "Gatherly",
    description: "A social event planning and coordination application.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["React Native", "Firebase", "Google Maps API"],
    category: "web",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://ssi-met-repairs.com",
    details: "Gatherly is a social event planning application that helps users organize, discover, and RSVP to events. The app includes features like location mapping, real-time updates, and group messaging.",
    demoType: "iframe",
    demoUrl: "https://ssi-met-repairs.com",
    demoConfig: {
      width: "100%",
      height: "600px",
      allowFullscreen: true,
      isResponsive: true
    },
    techStack: ["React Native", "Expo", "Firebase", "Google Maps API"],
    synopsis: {
      tagline: "Events. Connected. Simplified.",
      description: "Gatherly brings people together through streamlined event planning and discovery. The mobile-first platform removes the typical friction of organizing get-togethers, making it easy to create, share, and join events with friends, family, or community members. Built with a focus on real-time collaboration and location awareness, Gatherly transforms how people coordinate activities in an increasingly busy and disconnected world.",
      caseStudy: {
        problem: "Existing event planning tools were either too complex for casual gatherings or too basic to handle coordination details, leading to fragmented communication across multiple apps and missed connections.",
        role: [
          "Mobile App Developer",
          "UX Researcher",
          "Product Designer",
          "Backend Architect"
        ],
        stack: [
          "React Native (Cross-platform mobile framework)",
          "Expo (Development toolchain)",
          "Firebase (Authentication, Database, Storage)",
          "Google Maps API (Location services)",
          "Firebase Cloud Messaging (Push notifications)",
          "Cloud Functions (Serverless backend)"
        ],
        features: [
          "Intelligent event suggestions based on user interests and location",
          "Real-time attendance tracking and updates",
          "In-app group messaging with media sharing",
          "Interactive maps with navigation to event locations",
          "Collaborative planning tools with task assignments",
          "Weather integration for outdoor event planning"
        ],
        status: "✅ Public Beta 🚀 500+ Active Users in Atlanta Area",
        nextSteps: [
          "Implementing ticket sales and payment processing",
          "Adding public event discovery with matching algorithm",
          "Building business profiles for venue partnerships",
          "Expanding to additional major metropolitan areas"
        ]
      }
    }
  },
  {
    id: "ssi-met-repairs",
    title: "M.E.T Repairs",
    description: "Business website for electronic repair and automotive locksmith services.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    tags: ["Business", "Service", "Automotive"],
    category: "business",
    liveUrl: "https://metrepairs.com",
    details: "M.E.T Repairs is a business website that offers electronic repair and automotive locksmith services. The site includes service descriptions, appointment scheduling, and customer testimonials.",
    demoType: "iframe",
    demoUrl: "https://metrepairs.com",
    demoConfig: {
      width: "100%",
      height: "600px",
      allowFullscreen: true,
      isResponsive: true
    },
    techStack: ["HTML", "CSS", "JavaScript", "Wix", "Velo"],
    synopsis: {
      tagline: "Electronics. Automotive. Fixed & Secured.",
      description: "M.E.T Repairs represents the digital transformation of my brick-and-mortar repair business, bringing specialized electronic repair and automotive locksmith services online to reach more customers. This website, developed with Wix and now being redeveloped, serves as both a digital storefront and educational resource for customers looking to understand repair options before committing. The project exemplifies how traditional service businesses can leverage technology to improve customer acquisition and service delivery.",
      caseStudy: {
        problem: "Local repair businesses often struggle with digital presence, relying on word-of-mouth or costly advertising. Customers need to understand services and pricing before visiting, but most local repair shops lack informative, accessible online platforms.",
        role: [
          "Business Owner & Service Provider",
          "Web Designer & Developer",
          "Content Creator",
          "SEO Specialist"
        ],
        stack: [
          "Wix (Platform)",
          "Velo by Wix (JavaScript Development)",
          "Wix Bookings (Appointment System)",
          "Custom CSS & JavaScript",
          "Google Business Integration",
          "Schema.org Markup (for Local SEO)"
        ],
        features: [
          "Service categorization with transparent pricing",
          "Online appointment scheduling and confirmation system",
          "Educational blog with repair guides and maintenance tips",
          "Location-based service area mapping",
          "Customer testimonials with media integration",
          "Mobile-optimized experience for on-the-go service requests"
        ],
        status: "✅ Live Business 🚀 Generating 35% of new business leads",
        nextSteps: [
          "Complete redevelopment using Next.js for improved performance",
          "Implementing live chat for immediate customer assistance",
          "Adding repair status tracking for current customers",
          "Building video repository of common repair procedures",
          "Developing customer loyalty program with digital rewards"
        ]
      }
    }
  },
  {
    id: "web-development-services",
    title: "Web Development Services",
    description: "Professional web development and design services for businesses and individuals.",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Web Development", "Design", "Business"],
    category: "service",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://forms.gle/vu11jF1nixkoRxH86",
    details: "Professional web development and design services tailored for businesses and individuals. Services include website creation, redesign, maintenance, and custom web application development to meet client needs.",
    demoType: "custom",
    techStack: ["React", "Next.js", "Tailwind CSS", "Node.js"],
    synopsis: {
      tagline: "Websites that Work. Solutions that Scale.",
      description: "My web development services transform business objectives into engaging digital experiences. I've built this service offering to bridge the gap between high-end agency work and DIY website builders, providing professional-grade web solutions at accessible prices. Each project is approached as a unique business challenge, with solutions custom-tailored to meet specific goals rather than relying on templates or one-size-fits-all approaches.",
      caseStudy: {
        problem: "Many businesses find themselves caught between expensive agency services and limited DIY website platforms, neither of which fully meets their needs for custom functionality, design control, and technical expertise at a reasonable price point.",
        role: [
          "Full Stack Developer",
          "UX/UI Designer",
          "Project Manager",
          "Digital Strategy Consultant"
        ],
        stack: [
          "React & Next.js (Frontend)",
          "Node.js & Express (Backend)",
          "Tailwind CSS (Styling)",
          "WordPress (CMS Solutions)",
          "Vercel & Netlify (Deployment)",
          "SQL & NoSQL Databases"
        ],
        features: [
          "Custom website design and development aligned with brand identity",
          "Responsive, mobile-first implementation for all device types",
          "Content management system implementation and training",
          "E-commerce integration with secure payment processing",
          "SEO optimization and performance tuning",
          "Ongoing maintenance and technical support"
        ],
        status: "✅ Active Service 🚀 12+ Completed Projects in 2024",
        nextSteps: [
          "Expanding service offerings to include SaaS product development",
          "Creating productized service packages with clear pricing tiers",
          "Building agency partnerships for larger project referrals",
          "Developing client education resources and tutorials"
        ]
      }
    }
  }
];
