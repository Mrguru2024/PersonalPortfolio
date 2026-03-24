"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { ArrowRight, Layout, Zap, Cpu } from "lucide-react";
import { BRAND_GROWTH_PATH, STRATEGY_CALL_PATH, ECOSYSTEM_CTA_STRATEGY_CALL } from "@/lib/funnelCtas";
import { projects } from "@/lib/data";
import { EcosystemProjectsSection } from "@/components/ecosystem/EcosystemProjectsSection";

const ASCENDRA_LOGO = "/ascendra-logo.svg";

const FOCUS_AREAS = [
  { icon: Layout, title: "Websites & development", desc: "Conversion-focused websites, landing pages, and web applications that turn traffic into leads." },
  { icon: Zap, title: "Automation & systems", desc: "Workflows and integrations that save time and keep leads moving through your pipeline." },
  { icon: Cpu, title: "AI & digital infrastructure", desc: "AI solutions and technical systems that support business growth and scalability." },
];

export default function AscendraTechnologiesPartnerPage() {
  return (
    <>
      <PageSEO
        title="Ascendra Technologies | Web Development & Automation"
        description="Anthony Feaster leads Ascendra Technologies—development, websites, automation, and AI solutions. The technical pillar of the Brand Growth ecosystem."
        keywords={["Ascendra Technologies", "web development", "automation", "AI solutions", "Anthony Feaster"]}
        canonicalPath="/partners/ascendra-technologies"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-brand="ascendra">
        {/* Hero — brand accent: technical/systems */}
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 overflow-hidden border-t-4 border-primary bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto h-16 sm:h-20 mb-6 sm:mb-8"
            >
              <Image
                src={ASCENDRA_LOGO}
                alt="Ascendra Technologies — Web development & automation"
                fill
                className="object-contain object-center drop-shadow-sm"
                sizes="(max-width: 640px) 280px, 320px"
                priority
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-10 break-words min-w-0"
            >
              <strong className="text-foreground">Anthony Feaster</strong> leads Ascendra Technologies with a focus on making technology serve growth: clear, conversion-focused websites and systems that turn traffic into leads and keep operations running smoothly. The technical pillar of the Brand Growth ecosystem—websites, automation, and AI—working alongside Macon Designs (brand identity) and Style Studio Branding (marketing assets) when you need a full coordinated system.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_STRATEGY_CALL}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-[44px]">
                <Link href={BRAND_GROWTH_PATH}>Brand Growth hub</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Focus areas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {FOCUS_AREAS.map(({ icon: Icon, title, desc }, i) => (
                <Card key={i} className="border-border bg-card shadow-sm hover:border-primary/20 transition-all overflow-hidden min-w-0">
                  <CardHeader className="min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base sm:text-lg break-words">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 min-w-0">
                    <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12">
              More than a pretty website
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0 max-w-3xl mx-auto">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">
                  We build sites and systems that are designed to convert and scale. That means clear structure, fast performance, and optional automation (forms, CRM, workflows) so your website works for your business—not just looks good.
                </p>
              </CardContent>
            </Card>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12">
              System-oriented approach
            </h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden min-w-0 max-w-3xl mx-auto">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">
                  Technology works best when it’s part of a coherent system: your brand (Macon), your site and automation (Ascendra), and your marketing assets (Style Studio). We align with the ecosystem so you get one strategy, one team, and no handoff chaos.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="projects" className="scroll-mt-20 w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 bg-background">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-6xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Our work — from the ecosystem
            </h2>
            <EcosystemProjectsSection ascendraProjects={projects.slice(0, 6)} />
            <div className="text-center mt-10">
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <Link href="/partners/ascendra-technologies#projects">View our work</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-6 sm:mb-8">
              Skills & technologies
            </h2>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {Array.from(
                new Set(projects.flatMap((p) => p.techStack || []).filter(Boolean))
              )
                .slice(0, 24)
                .map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {tech}
                  </span>
                ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
              Full-stack development, conversion-focused design, and system integration for web and automation.
            </p>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.12),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl flex flex-col items-center text-center">
            <div className="relative w-full max-w-[220px] sm:max-w-[260px] mx-auto h-12 sm:h-14 mb-5 sm:mb-6 invert">
              <Image
                src={ASCENDRA_LOGO}
                alt="Ascendra Technologies"
                fill
                className="object-contain object-center opacity-95"
                sizes="(max-width: 640px) 220px, 260px"
              />
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 break-words">
              Ready to grow your digital presence?
            </h2>
            <Button asChild size="lg" className="gap-2 min-h-[48px] mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
              <Link href={STRATEGY_CALL_PATH}>
                {ECOSYSTEM_CTA_STRATEGY_CALL}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
