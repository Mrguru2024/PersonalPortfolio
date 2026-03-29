"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { queryClient } from "@/lib/queryClient";
import { ViewModeProvider } from "@/lib/view-mode-context";
import { SuperAdminErrorReporter } from "@/components/SuperAdminErrorReporter";
import PwaRegistration from "@/components/PwaRegistration";
import { FunnelProvider } from "@/lib/funnel-store";
import { GlobalTooltipProvider } from "@/components/ui/GlobalTooltipProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
        <GlobalTooltipProvider>
          <LocaleProvider>
            <ViewModeProvider>
              <AuthProvider>
                <FunnelProvider>
                  <PwaRegistration />
                  {children}
                  <Toaster />
                  <SuperAdminErrorReporter />
                </FunnelProvider>
              </AuthProvider>
            </ViewModeProvider>
          </LocaleProvider>
        </GlobalTooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
