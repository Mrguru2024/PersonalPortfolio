import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FOUNDERS, getFounderImageUrl, type FounderProfile } from "@/lib/partnerFounders";

const DISCIPLINE_LABEL: Record<string, string> = {
  strategy: "Strategy",
  design: "Design",
  technology: "Technology",
};

function FounderCard({ founder }: { founder: FounderProfile }) {
  const imageUrl = getFounderImageUrl(founder);
  const isRemote = imageUrl.startsWith("http");

  return (
    <Card className="group border-border/80 bg-card/80 overflow-hidden shadow-md transition hover:border-primary/30 hover:shadow-lg backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Wide visual strip — 16:9, not a tiny phone avatar */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {imageUrl ? (
            founder.useLogo ? (
              <>
                <Image
                  src={imageUrl}
                  alt={founder.imageAlt ?? founder.name}
                  fill
                  className={`object-contain p-6 sm:p-8 ${founder.logoDark ? "dark:hidden" : ""}`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized={isRemote}
                />
                {founder.logoDark ? (
                  <Image
                    src={founder.logoDark}
                    alt={founder.imageAlt ?? founder.name}
                    fill
                    className="object-contain p-6 sm:p-8 hidden dark:block"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : null}
              </>
            ) : (
              <Image
                src={imageUrl}
                alt={founder.imageAlt ?? founder.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized={isRemote}
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <span className="text-5xl font-bold text-muted-foreground">{founder.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent pt-12 pb-3 px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {DISCIPLINE_LABEL[founder.discipline] ?? founder.discipline}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">{founder.name}</h3>
            <Link href={founder.companyHref} className="text-sm font-medium text-primary hover:underline">
              {founder.company}
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{founder.intro}</p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">In the ecosystem:</strong> {founder.roleInEcosystem}
          </p>
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
            {founder.perspective}
          </p>
          <ul className="flex flex-wrap gap-2 pt-1">
            {founder.focus.map((item) => (
              <li
                key={item}
                className="text-xs px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground border border-border/60"
              >
                {item}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-2 gap-1.5 w-full sm:w-auto">
            <Link href={founder.companyHref}>
              Visit {founder.company}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EcosystemTeamSection() {
  return (
    <section
      id="ecosystem-team"
      className="scroll-mt-24 space-y-8 sm:space-y-10"
      aria-labelledby="ecosystem-team-heading"
    >
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h2
          id="ecosystem-team-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground"
        >
          Meet the founders behind the ecosystem
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground">
          The Ascendra ecosystem brings together three disciplines that most businesses need to grow: brand
          strategy and messaging, visual design and presentation, and technology and conversion systems. Each is led
          by an experienced founder who focuses on that area every day.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {FOUNDERS.map((founder) => (
          <FounderCard key={founder.slug} founder={founder} />
        ))}
      </div>
    </section>
  );
}
