"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MORE_LEAD_MAGNETS,
  type FreeGrowthToolMagnet,
} from "@/lib/freeGrowthToolsLeadMagnets";
import { matchesLiveSearch } from "@/lib/matchesLiveSearch";

export function FreeGrowthToolsMoreToolsGrid() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      MORE_LEAD_MAGNETS.filter((m: FreeGrowthToolMagnet) =>
        matchesLiveSearch(query, [m.title, m.who, m.problem, m.get, m.cta, m.id, m.href]),
      ),
    [query],
  );

  return (
    <section
      id="all-tools"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 scroll-mt-24"
      aria-label="More free tools"
    >
      <h2 className="col-span-full text-lg font-semibold text-foreground mb-2">More free tools</h2>
      <p className="col-span-full text-sm text-muted-foreground mb-3">
        Calculators, blueprints, startup resources, and other extras beyond the four-step path above.
      </p>
      <div className="col-span-full relative max-w-md mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to filter tools by name or topic…"
          className="pl-9"
          aria-label="Filter free tools"
        />
      </div>
      <p className="col-span-full text-xs text-muted-foreground mb-4">
        Showing {filtered.length} of {MORE_LEAD_MAGNETS.length} tools
      </p>
      {filtered.length === 0 ? (
        <p className="col-span-full text-sm text-muted-foreground py-6 text-center">
          No tools match that phrase. Try different words or clear the box.
        </p>
      ) : (
        filtered.map((magnet: FreeGrowthToolMagnet) => {
          const Icon = magnet.icon;
          return (
            <Card key={magnet.id} className="border-border bg-card h-full flex flex-col">
              <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{magnet.title}</h3>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Who it&apos;s for</p>
                <p className="text-sm text-muted-foreground mb-3">{magnet.who}</p>
                <p className="text-sm font-medium text-foreground mb-1">Problem it helps solve</p>
                <p className="text-sm text-muted-foreground mb-3">{magnet.problem}</p>
                <p className="text-sm font-medium text-foreground mb-1">What you get</p>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{magnet.get}</p>
                <Button asChild className="w-full sm:w-auto gap-2 min-h-[44px]">
                  <TrackedCtaLink
                    href={magnet.href}
                    ctaLabel={magnet.id}
                    pageVisited="/free-growth-tools"
                    className="inline-flex items-center gap-2"
                  >
                    {magnet.cta}
                    <ArrowRight className="h-4 w-4" />
                  </TrackedCtaLink>
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </section>
  );
}
