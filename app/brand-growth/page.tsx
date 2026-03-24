"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSEO } from "@/components/SEO";
import {
  ArrowRight,
  Palette,
  Layout,
  Megaphone,
  CheckCircle2,
  Target,
  FileText,
} from "lucide-react";
import {
  BRAND_GROWTH_PATH,
  STRATEGY_CALL_PATH,
  LAUNCH_YOUR_BRAND_PATH,
  REBRAND_YOUR_BUSINESS_PATH,
  MARKETING_ASSETS_PATH,
  ECOSYSTEM_CTA_HUB,
  ECOSYSTEM_CTA_STRATEGY_CALL,
} from "@/lib/funnelCtas";
import { personalInfo } from "@/lib/data";
import { PersonaServiceHeroAccent } from "@/components/persona-journey/PersonaServiceHeroAccent";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";

const MACON_LOGO_BADGE = "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png";
const STYLE_STUDIO_LOGO = "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png";
const STYLE_STUDIO_LOGO_WHITE = "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png";
const ASCENDRA_LOGO = "/ascendra-logo.svg";

const PILLARS = [
  {
    title: "Macon Designs",
    subtitle: "Brand identity systems",
    description:
      "Strategic visual identity, logo systems, and brand guidelines that build trust and recognition.",
    icon: Palette,
    href: "/partners/macon-designs",
    logo: MACON_LOGO_BADGE,
  },
  {
    title: "Style Studio Branding",
    subtitle: "Marketing & promotional design",
    description:
      "Ad creatives, packaging, social graphics, and production-ready marketing assets that convert.",
    icon: Megaphone,
    href: "/partners/style-studio-branding",
    logo: STYLE_STUDIO_LOGO,
    logoDark: STYLE_STUDIO_LOGO_WHITE,
  },
  {
    title: "Ascendra Technologies",
    subtitle: "Web development & automation",
    description:
      "Websites, landing pages, automation, and AI solutions that turn traffic into leads and customers.",
    icon: Layout,
    href: "/partners/ascendra-technologies",
    logo: ASCENDRA_LOGO,
  },
];

const PROCESS_STEPS = [
  { title: "Brand Strategy", desc: "Clarify positioning, audience, and messaging so every asset supports growth." },
  { title: "Visual Identity", desc: "Design a cohesive look and feel that builds credibility and stands out." },
  { title: "Website Development", desc: "Build a fast, conversion-focused site that turns visitors into leads." },
  { title: "Marketing Asset Creation", desc: "Produce ads, social content, and promotional materials that perform." },
];

const PATHS = [
  { label: "Launch a New Brand", href: LAUNCH_YOUR_BRAND_PATH, description: "New business or product launch" },
  { label: "Rebrand My Business", href: REBRAND_YOUR_BUSINESS_PATH, description: "Refresh identity and website" },
  { label: "Improve My Marketing", href: MARKETING_ASSETS_PATH, description: "Stronger ads and visuals" },
];

const TEAM_ABOUT = [
  {
    name: personalInfo.name,
    role: "Ascendra Technologies",
    description: personalInfo.description,
    education: personalInfo.education,
    experience: personalInfo.experience,
    image: personalInfo.image,
    imageAlt: personalInfo.name,
    useLogo: false,
    href: "/resume",
    buttonLabel: "Download Resume",
    buttonIcon: FileText,
    secondaryHref: "/partners/ascendra-technologies",
    secondaryLabel: "Visit Ascendra Technologies",
  },
  {
    name: "Denishia",
    role: "Macon Designs®",
    description:
      "Denishia leads Macon Designs with a BA in Visual Communications and 10+ years focused on brand identity. She helps growth-ready businesses build identity systems that look professional and convert—brand strategy, visual identity, and design systems that integrate with the broader Brand Growth team (Ascendra for web, Style Studio for marketing assets).",
    education: ["BA Visual Communications", "Brand strategy & visual identity"],
    experience: [
      "10+ years brand identity & visual systems",
      "Logo systems, color, typography, and guidelines",
      "Strategic design that supports positioning",
    ],
    image: MACON_LOGO_BADGE,
    imageAlt: "Macon Designs — Brand identity & visual systems",
    useLogo: true,
    href: "/partners/macon-designs",
    buttonLabel: "Visit Macon Designs",
    buttonIcon: ArrowRight,
    secondaryHref: STRATEGY_CALL_PATH,
    secondaryLabel: "Book a strategy call",
  },
  {
    name: "Kristopher Williams",
    role: "Style Studio Branding",
    description:
      "Kristopher leads Style Studio Branding with 12+ years in production design—print, packaging, digital, and multi-format marketing assets. Experience across brands such as Payscape, DiversiTech, JustChair, and Osaic. Production-ready work that converts, aligned with Macon Designs (brand identity) and Ascendra (web) when you need the full ecosystem.",
    education: ["Production design & multi-format marketing", "Print, packaging, and digital assets"],
    experience: [
      "12+ years production design",
      "Brands: Payscape, DiversiTech, JustChair, Osaic",
      "Ad creatives, packaging, social graphics",
    ],
    image: STYLE_STUDIO_LOGO,
    imageAlt: "Style Studio Branding — Marketing & production design",
    imageDark: STYLE_STUDIO_LOGO_WHITE,
    useLogo: true,
    href: "/partners/style-studio-branding",
    buttonLabel: "Visit Style Studio Branding",
    buttonIcon: ArrowRight,
    secondaryHref: STRATEGY_CALL_PATH,
    secondaryLabel: "Book a strategy call",
  },
];

export default function BrandGrowthPage() {
  return (
    <>
      <PageSEO
        title="Build a Brand That Converts | Brand Growth System"
        description="Brand strategy, websites, and marketing visuals—built together by one coordinated team. Launch, rebrand, or scale with Macon Designs, Style Studio Branding, and Ascendra Technologies."
        keywords={[
          "brand strategy",
          "brand identity",
          "website development",
          "marketing design",
          "rebrand",
          "brand growth",
          "conversion",
        ]}
        canonicalPath={BRAND_GROWTH_PATH}
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        {/* 1. Hero */}
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          <div className="absolute inset-0">
            <Image src="/stock images/Growth_9.jpeg" alt="" fill className="object-cover" sizes="100vw" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background dark:via-background/70 dark:to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_0%,hsl(var(--background)/0.4)_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_0%,hsl(var(--background)/0.6)_100%)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge className="mb-4 sm:mb-6 max-w-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-normal text-center break-words">
                One coordinated team · Brand · Web · Marketing
              </Badge>
            </motion.div>
            <PersonaServiceHeroAccent />
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight"
            >
              Build a Brand That{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Actually Converts
              </span>{" "}
              Customers
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              Brand strategy, websites, and marketing visuals—built together by one coordinated team.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto gap-2 min-h-[48px] sm:min-h-[52px] text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all"
              >
                <Link href="#paths">
                  {ECOSYSTEM_CTA_HUB}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[44px] opacity-90 hover:opacity-100 text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Link href={STRATEGY_CALL_PATH}>{ECOSYSTEM_CTA_STRATEGY_CALL}</Link>
              </Button>
              <Link href="#solution" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors mt-2 sm:mt-0">
                See how it works →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 2. Problem */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Why So Many Businesses Struggle to Grow
            </h2>
            <Card className="border-destructive/20 bg-card/80 dark:bg-card/60 shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                  {[
                    "Their branding was DIY—and it shows. Customers don’t trust amateur visuals.",
                    "Their website doesn’t convert. Traffic comes in but leads don’t.",
                    "Their marketing visuals are inconsistent. Every channel looks different.",
                    "Customers lose trust when the brand feels scattered and unprofessional.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 min-w-0">
                      <span className="text-destructive mt-0.5 font-bold shrink-0">×</span>
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border text-center">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    It’s not a marketing trick problem.
                  </p>
                  <p className="mt-1 text-primary font-semibold text-base sm:text-lg">
                    It’s a brand and system problem.
                  </p>
                  <Button asChild size="sm" className="mt-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href="#solution">See the solution →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Solution — 3 pillars */}
        <section id="solution" className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-4 sm:mb-6">
              The 3-Part Brand Growth System
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-8 sm:mb-12 break-words">
              One coordinated creative technology studio—brand strategy, visual identity, websites, and marketing assets—so your business looks and performs like it deserves.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {PILLARS.map(({ title, subtitle, description, icon: Icon, href, logo, logoDark }, i) => (
                <Card
                  key={i}
                  className="border-border bg-card h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden min-w-0"
                >
                  <CardHeader className="pb-2 sm:pb-3 min-w-0">
                    {logo ? (
                      <div className="relative w-full max-w-[120px] h-14 sm:max-w-[140px] sm:h-16 mb-2 shrink-0">
                        <Image
                          src={logo}
                          alt={title}
                          fill
                          className={`object-contain object-left ${logoDark ? "dark:hidden" : ""}`}
                          sizes="140px"
                        />
                        {logoDark && (
                          <Image
                            src={logoDark}
                            alt={title}
                            fill
                            className="object-contain object-left hidden dark:block"
                            sizes="140px"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-2 shrink-0 ring-1 ring-primary/10">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    )}
                    <CardTitle className="text-base sm:text-lg break-words">{title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">{subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col min-w-0">
                    <p className="text-muted-foreground text-sm sm:text-base flex-1 break-words min-w-0">{description}</p>
                    <Link
                      href={href}
                      className="mt-4 text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      Meet the team <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Meet the team — About Anthony, Denishia (Macon), Kristopher (Style Studio) */}
        <section id="meet-the-team" className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-4 sm:mb-6">
              Meet the team
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-10 sm:mb-12 break-words">
              One coordinated team—brand, web, and marketing. Here’s who leads each pillar: technical (Ascendra), brand identity (Macon Designs), and marketing assets (Style Studio).
            </p>
            <div className="space-y-12 sm:space-y-16 min-w-0">
              {TEAM_ABOUT.map((member) => {
                const Icon = member.buttonIcon;
                return (
                  <div
                    key={member.name + member.role}
                    className="flex flex-col gap-6 sm:gap-8 min-w-0"
                  >
                    <div className="flex flex-row gap-4 sm:gap-5 items-center min-w-0">
                      <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0 rounded-xl overflow-hidden shadow-md bg-elevated">
                        {member.useLogo ? (
                          <>
                            <Image
                              src={member.image}
                              alt={member.imageAlt}
                              fill
                              className={`object-contain p-2 ${"imageDark" in member && member.imageDark ? "dark:hidden" : ""}`}
                              sizes="208px"
                            />
                            {"imageDark" in member && member.imageDark && (
                              <Image
                                src={member.imageDark}
                                alt={member.imageAlt}
                                fill
                                className="object-contain p-2 hidden dark:block"
                                sizes="208px"
                              />
                            )}
                          </>
                        ) : (
                          <Image
                            src={member.image}
                            alt={member.imageAlt}
                            fill
                            className="object-cover"
                            sizes="208px"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">{member.name}</h3>
                        <p className="text-sm font-medium text-primary mt-0.5">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base break-words">{member.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Education & focus</h4>
                        <ul className="text-muted-foreground text-sm space-y-1">
                          {member.education.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Experience</h4>
                        <ul className="text-muted-foreground text-sm space-y-1">
                          {member.experience.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0">
                        <Link href={member.href}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {member.buttonLabel}
                        </Link>
                      </Button>
                      {member.secondaryHref && (
                        <Button asChild variant="outline" size="lg" className="gap-2">
                          <Link href={member.secondaryHref}>{member.secondaryLabel}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Process */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 md:mb-12">
              How We Work Together
            </h2>
            <ol className="space-y-6 sm:space-y-8 min-w-0">
              {PROCESS_STEPS.map(({ title, desc }, i) => (
                <li key={i} className="flex gap-3 sm:gap-4 min-w-0">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg break-words">{title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1 break-words">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Path selector */}
        <section id="paths" className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-4 sm:mb-6">
              Where Are You in Your Brand Journey?
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-8 sm:mb-10">
              Choose the path that fits your business stage or need.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-6 min-w-0 w-full">
              {PATHS.map(({ label, href, description }, i) => (
                <Button
                  key={i}
                  asChild
                  variant="outline"
                  className="h-auto min-w-0 w-full max-w-full flex flex-col items-stretch text-left py-5 px-4 sm:py-6 sm:px-5 border-2 hover:border-primary hover:bg-primary/5 hover:text-foreground overflow-hidden"
                >
                  <Link href={href} className="min-w-0 w-full max-w-full flex flex-col items-stretch text-left gap-3 overflow-hidden">
                    <span className="block font-semibold text-base break-words min-w-0 w-full text-foreground leading-tight overflow-hidden" style={{ wordBreak: "break-word" }}>{label}</span>
                    <span className="block text-muted-foreground text-sm font-normal break-words min-w-0 w-full overflow-hidden">{description}</span>
                    <span className="mt-auto pt-2 flex justify-end shrink-0">
                      <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Why one coordinated team */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Why One Coordinated Team Beats Three Separate Vendors
            </h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                  {[
                    "One strategy—brand, web, and marketing aligned from the start.",
                    "No handoff chaos. No mismatched styles or last-minute surprises.",
                    "Consistent quality across every touchpoint, delivered by people who work together.",
                    "You get a growth system, not a disconnected logo, site, and ads.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 min-w-0">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7. Client transformation */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-background">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              What Changes When Your Brand Is Aligned
            </h2>
            <Card className="border-primary/10 bg-card/95 dark:bg-card/90 shadow-sm overflow-hidden min-w-0 backdrop-blur-sm">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Stronger visual presence that builds trust from the first click",
                    "Professional credibility so you compete with established players",
                    "Better conversion—visitors become leads and customers",
                    "Consistent assets across website, ads, and social so the brand feels real",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm sm:text-base min-w-0">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="text-foreground font-medium break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 max-w-4xl pb-10 sm:pb-14">
          <LeadMagnetRelatedWorkSection leadMagnetKey="brand-growth" />
        </div>

        {/* 8. Consultation CTA */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Target className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 break-words">
              Ready to build a brand that matches your vision?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto break-words">
              Book a strategy call. We’ll listen to your goals, clarify the right path, and outline next steps—no pressure, no obligation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Button
                asChild
                size="lg"
                className="gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[52px] bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold"
              >
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_STRATEGY_CALL}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-primary-foreground/80">Strategy call · No obligation · Clear next steps</p>
          </div>
        </section>
      </div>
    </>
  );
}
