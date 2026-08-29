"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarkerSymbol } from "./types";
import { DEFAULT_SYMBOLS } from "./types";

interface SymbolLibraryProps {
  selectedSymbol: MarkerSymbol | null;
  onSymbolSelect: (symbol: MarkerSymbol | null) => void;
}

export function SymbolLibrary({
  selectedSymbol,
  onSymbolSelect,
}: SymbolLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSymbols = DEFAULT_SYMBOLS.filter(
    (symbol) =>
      symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(
    new Set(filteredSymbols.map((s) => s.category))
  ).sort();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg">Symbol Library</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {category}s
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredSymbols
                .filter((s) => s.category === category)
                .map((symbol) => (
                  <Button
                    key={symbol.id}
                    variant={selectedSymbol?.id === symbol.id ? "default" : "outline"}
                    className={cn(
                      "h-auto flex-col gap-1 p-3",
                      selectedSymbol?.id === symbol.id && "ring-2 ring-offset-2"
                    )}
                    onClick={() =>
                      onSymbolSelect(
                        selectedSymbol?.id === symbol.id ? null : symbol
                      )
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold text-sm text-white"
                      style={{ backgroundColor: symbol.color }}
                    >
                      {symbol.abbreviation}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {symbol.name}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        ))}

        {filteredSymbols.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No symbols found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </CardContent>
    </Card>
  );
}
