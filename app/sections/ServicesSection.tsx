"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import {
  Code,
  Palette,
  Smartphone,
  ShoppingCart,
  Cloud,
  Database,
  Search,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Rocket,
  Globe,
  Users,
  TrendingUp,
  Layers,
  Monitor,
  Server,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  features: string[];
  category: "development" | "design" | "consulting" | "maintenance";
  popular?: boolean;
}

const services: Service[] = [
  // Development Services
  {
    id: "custom-web-apps",
    title: "Custom Web Applications",
    description:
      "Full-stack Next.js and React applications built to scale. From MVPs to enterprise solutions.",
    icon: <Code className="h-8 w-8" />,
    features: [
      "Next.js 16+ with App Router",
      "React 19 with TypeScript",
      "Server-side rendering (SSR)",
      "API development & integration",
      "Real-time features",
      "Authentication & authorization",
    ],
    category: "development",
    popular: true,
  },
  {
    id: "ecommerce-solutions",
    title: "E-commerce Development",
    description:
      "Complete online stores with payment processing, inventory management, and order fulfillment.",
    icon: <ShoppingCart className="h-8 w-8" />,
    features: [
      "Shopping cart & checkout",
      "Payment gateway integration",
      "Inventory management",
      "Order tracking system",
      "Customer accounts",
      "Product management CMS",
    ],
    category: "development",
    popular: true,
  },
  {
    id: "mobile-apps",
    title: "Mobile App Development",
    description:
      "Native and cross-platform mobile applications for iOS and Android.",
    icon: <Smartphone className="h-8 w-8" />,
    features: [
      "React Native development",
      "iOS & Android apps",
      "Progressive Web Apps (PWA)",
      "Push notifications",
      "Offline functionality",
      "App store deployment",
    ],
    category: "development",
  },
  {
    id: "saas-platforms",
    title: "SaaS Platform Development",
    description:
      "Scalable software-as-a-service platforms with subscription management and multi-tenancy.",
    icon: <Cloud className="h-8 w-8" />,
    features: [
      "Subscription billing",
      "Multi-tenant architecture",
      "User management & roles",
      "API development",
      "Analytics dashboard",
      "White-label options",
    ],
    category: "development",
  },
  {
    id: "api-development",
    title: "API Development & Integration",
    description:
      "RESTful and GraphQL APIs, third-party integrations, and microservices architecture.",
    icon: <Server className="h-8 w-8" />,
    features: [
      "REST & GraphQL APIs",
      "Third-party integrations",
      "Webhook development",
      "API documentation",
      "Rate limiting & security",
      "Microservices architecture",
    ],
    category: "development",
  },
  {
    id: "database-design",
    title: "Database Design & Optimization",
    description:
      "Database architecture, optimization, and migration services for scalable applications.",
    icon: <Database className="h-8 w-8" />,
    features: [
      "Database architecture",
      "Query optimization",
      "Data migration",
      "Backup & recovery",
      "Performance tuning",
      "Scalability planning",
    ],
    category: "development",
  },

  // Design Services
  {
    id: "ui-ux-design",
    title: "UI/UX Design",
    description:
      "User-centered design that combines beautiful aesthetics with intuitive functionality.",
    icon: <Palette className="h-8 w-8" />,
    features: [
      "User research & personas",
      "Wireframing & prototyping",
      "Visual design systems",
      "Interaction design",
      "Usability testing",
      "Design handoff",
    ],
    category: "design",
    popular: true,
  },
  {
    id: "responsive-design",
    title: "Responsive Web Design",
    description:
      "Mobile-first designs that work flawlessly across all devices and screen sizes.",
    icon: <Monitor className="h-8 w-8" />,
    features: [
      "Mobile-first approach",
      "Cross-device testing",
      "Touch-friendly interfaces",
      "Performance optimization",
      "Accessibility compliance",
      "Progressive enhancement",
    ],
    category: "design",
  },
  {
    id: "design-systems",
    title: "Design System Development",
    description:
      "Comprehensive design systems and component libraries for consistent brand experiences.",
    icon: <Layers className="h-8 w-8" />,
    features: [
      "Component libraries",
      "Style guides",
      "Design tokens",
      "Documentation",
      "Brand guidelines",
      "Design tool integration",
    ],
    category: "design",
  },

  // Consulting Services
  {
    id: "technical-consulting",
    title: "Technical Consulting",
    description:
      "Expert guidance on architecture, technology stack, and development strategy.",
    icon: <Users className="h-8 w-8" />,
    features: [
      "Architecture review",
      "Technology recommendations",
      "Code audits",
      "Performance analysis",
      "Scalability planning",
      "Best practices guidance",
    ],
    category: "consulting",
  },
  {
    id: "seo-optimization",
    title: "SEO & Performance Optimization",
    description:
      "Improve search rankings and site performance for better visibility and user experience.",
    icon: <Search className="h-8 w-8" />,
    features: [
      "SEO audit & strategy",
      "Technical SEO",
      "Page speed optimization",
      "Core Web Vitals",
      "Schema markup",
      "Analytics setup",
    ],
    category: "consulting",
  },
  {
    id: "security-audit",
    title: "Security Audits & Implementation",
    description:
      "Comprehensive security assessments and implementation of best practices.",
    icon: <Shield className="h-8 w-8" />,
    features: [
      "Security audits",
      "Vulnerability assessment",
      "SSL/HTTPS implementation",
      "Authentication systems",
      "Data encryption",
      "Compliance (GDPR, CCPA)",
    ],
    category: "consulting",
  },
  {
    id: "analytics-implementation",
    title: "Analytics & Tracking Setup",
    description:
      "Implement comprehensive analytics to track user behavior and business metrics.",
    icon: <BarChart3 className="h-8 w-8" />,
    features: [
      "Google Analytics 4",
      "Custom event tracking",
      "Conversion tracking",
      "Dashboard creation",
      "Data visualization",
      "Reporting automation",
    ],
    category: "consulting",
  },

  // Maintenance & Support
  {
    id: "maintenance-support",
    title: "Ongoing Maintenance & Support",
    description:
      "Keep your application running smoothly with regular updates and support.",
    icon: <Settings className="h-8 w-8" />,
    features: [
      "Bug fixes & updates",
      "Security patches",
      "Performance monitoring",
      "Backup management",
      "Feature enhancements",
      "Priority support",
    ],
    category: "maintenance",
    popular: true,
  },
  {
    id: "hosting-deployment",
    title: "Hosting & Deployment",
    description:
      "Reliable hosting solutions and CI/CD pipelines for seamless deployments.",
    icon: <Rocket className="h-8 w-8" />,
    features: [
      "Vercel/Netlify setup",
      "AWS/Cloud deployment",
      "CI/CD pipelines",
      "Domain management",
      "SSL certificates",
      "CDN configuration",
    ],
    category: "maintenance",
  },
  {
    id: "content-management",
    title: "Content Management Setup",
    description:
      "CMS implementation and training so you can manage content independently.",
    icon: <Globe className="h-8 w-8" />,
    features: [
      "CMS installation",
      "Content migration",
      "User training",
      "Workflow setup",
      "Custom fields",
      "Plugin integration",
    ],
    category: "maintenance",
  },
  {
    id: "performance-optimization",
    title: "Performance Optimization",
    description:
      "Speed up your site with advanced optimization techniques and monitoring.",
    icon: <Zap className="h-8 w-8" />,
    features: [
      "Code optimization",
      "Image optimization",
      "Caching strategies",
      "Lazy loading",
      "Bundle optimization",
      "Performance monitoring",
    ],
    category: "maintenance",
  },
];

const categories = [
  { id: "all", label: "All Services", icon: <Layers className="h-4 w-4" /> },
  {
    id: "development",
    label: "Development",
    icon: <Code className="h-4 w-4" />,
  },
  { id: "design", label: "Design", icon: <Palette className="h-4 w-4" /> },
  {
    id: "consulting",
    label: "Consulting",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: <Settings className="h-4 w-4" />,
  },
];

function ServicesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  return (
    <section
      id="services"
      className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="h-3 w-3 mr-2" />
            Revenue-Generating Services
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Full-Stack Development Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From concept to deployment, I offer comprehensive development,
            design, and consulting services that showcase my expertise as a
            Next.js React and UX/UI developer.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg border transition-all
                  ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md"
                  }
                `}
              >
                {Icon}
                <span className="font-medium">{category.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full transition-all hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-2">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/assessment?service=${service.id}`}>
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Start Your Project?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Let's discuss how I can help bring your vision to life with
                cutting-edge technology and exceptional user experience design.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  <Link href="/assessment">
                    <span className="flex items-center justify-center gap-2">
                      <span className="whitespace-nowrap">Start Project</span>
                      <span className="hidden xs:inline whitespace-nowrap">
                        Assessment
                      </span>
                      <span className="xs:hidden">Assessment</span>
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  <Link href="/#contact">
                    <span className="flex items-center justify-center gap-2">
                      <span className="whitespace-nowrap">Schedule</span>
                      <span className="hidden xs:inline whitespace-nowrap">
                        Consultation
                      </span>
                      <span className="xs:hidden">Consult</span>
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export default ServicesSection;
