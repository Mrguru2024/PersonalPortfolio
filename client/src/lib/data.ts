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
}

export interface Skill {
  name: string;
  percentage: number;
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

export const personalInfo: PersonalInfo = {
  name: "John Doe",
  title: "Full-Stack Developer",
  description: "I'm a passionate full-stack developer specializing in creating elegant solutions to complex problems.",
  education: [
    "B.S. Computer Science, University",
    "Web Development Certification",
    "UX Design Specialization"
  ],
  experience: [
    "Senior Developer at TechCorp",
    "Full-Stack Developer at StartupX",
    "Freelance Web Developer"
  ],
  resumeUrl: "/api/resume",
  image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
};

export const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com",
    icon: "github"
  },
  {
    platform: "LinkedIn",
    url: "https://linkedin.com",
    icon: "linkedin"
  },
  {
    platform: "Twitter",
    url: "https://twitter.com",
    icon: "twitter"
  },
  {
    platform: "Email",
    url: "mailto:contact@example.com",
    icon: "mail"
  }
];

export const contactInfo: ContactInfo = {
  email: "developer@example.com",
  location: "San Francisco, CA",
  phone: "+1 (555) 123-4567"
};

export const frontendSkills: Skill[] = [
  { name: "React", percentage: 90 },
  { name: "JavaScript", percentage: 95 },
  { name: "CSS/SASS", percentage: 85 },
  { name: "TypeScript", percentage: 80 }
];

export const backendSkills: Skill[] = [
  { name: "Node.js", percentage: 85 },
  { name: "Express", percentage: 90 },
  { name: "MongoDB", percentage: 80 },
  { name: "GraphQL", percentage: 75 }
];

export const devopsSkills: Skill[] = [
  { name: "Git/GitHub", percentage: 95 },
  { name: "Docker", percentage: 70 },
  { name: "AWS", percentage: 65 },
  { name: "CI/CD", percentage: 75 }
];

export const additionalSkills: string[] = [
  "Responsive Design",
  "UI/UX Design",
  "SEO Optimization",
  "Progressive Web Apps",
  "Agile Methodology",
  "Test-Driven Development",
  "REST API Design",
  "Performance Optimization"
];

export const projects: Project[] = [
  {
    id: "ecommerce-dashboard",
    title: "E-commerce Dashboard",
    description: "A comprehensive dashboard for online store management with real-time analytics.",
    image: "https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["React", "Node.js", "GraphQL"],
    category: "web",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    details: "This e-commerce dashboard provides comprehensive management tools for online stores. Built with React, Node.js and GraphQL, it includes real-time analytics, inventory management, and order processing."
  },
  {
    id: "fitness-tracker",
    title: "Fitness Tracker App",
    description: "Mobile application for tracking workouts, nutrition, and personal fitness goals.",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["React Native", "Firebase", "Redux"],
    category: "mobile",
    githubUrl: "https://github.com",
    details: "A comprehensive fitness tracking application built with React Native and Firebase. It allows users to track workouts, nutrition, and set personal fitness goals with an intuitive interface."
  },
  {
    id: "design-system",
    title: "Portfolio Design System",
    description: "A comprehensive design system for personal and professional portfolios.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Figma", "CSS", "Storybook"],
    category: "design",
    liveUrl: "https://example.com",
    details: "A comprehensive design system created for portfolios. Includes reusable components, style guidelines, and documentation built with Figma and implemented with modern CSS practices."
  },
  {
    id: "weather-app",
    title: "Weather Forecast App",
    description: "Real-time weather forecasting application with interactive maps and alerts.",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Vue.js", "Mapbox", "Weather API"],
    category: "web",
    githubUrl: "https://github.com",
    details: "A real-time weather forecasting application with interactive maps and alerts. Built with Vue.js and integrated with the Mapbox API for map visualization and Weather API for data."
  },
  {
    id: "project-management",
    title: "Project Management Tool",
    description: "Collaborative project management platform with task tracking and team communication.",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Next.js", "MongoDB", "Socket.io"],
    category: "web",
    githubUrl: "https://github.com",
    details: "A collaborative project management platform that enables teams to track tasks, communicate efficiently, and monitor project progress. Built with Next.js, MongoDB, and Socket.io for real-time updates."
  },
  {
    id: "finance-tracker",
    title: "Finance Tracker",
    description: "Personal finance management app with budgeting features and expense tracking.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Flutter", "Firebase", "Chart.js"],
    category: "mobile",
    githubUrl: "https://github.com",
    details: "A personal finance management application that helps users track expenses, set budgets, and visualize spending patterns. Built with Flutter and Firebase for a seamless cross-platform experience."
  }
];
