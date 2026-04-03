"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { LocaleProvider } from "@/contexts/LocaleContext";
import type { AppLocale } from "@/lib/i18n/constants";
import { queryClient } from "@/lib/queryClient";
import { ViewModeProvider } from "@/lib/view-mode-context";
import { AdminAudienceViewProvider } from "@/contexts/AdminAudienceViewContext";
import { SuperAdminErrorReporter } from "@/components/SuperAdminErrorReporter";
import PwaRegistration from "@/components/PwaRegistration";
import { FunnelProvider } from "@/lib/funnel-store";
import { GlobalTooltipProvider } from "@/components/ui/GlobalTooltipProvider";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: AppLocale;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
        <GlobalTooltipProvider>
          <LocaleProvider initialLocale={initialLocale}>
            <ViewModeProvider>
              <AuthProvider>
                <AdminAudienceViewProvider>
                  <FunnelProvider>
                    <PwaRegistration />
                    {children}
                    <Toaster />
                    <SuperAdminErrorReporter />
                  </FunnelProvider>
                </AdminAudienceViewProvider>
              </AuthProvider>
            </ViewModeProvider>
          </LocaleProvider>
        </GlobalTooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
