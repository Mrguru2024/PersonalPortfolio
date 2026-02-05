"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { ViewModeProvider } from "@/lib/view-mode-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
        <ViewModeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
