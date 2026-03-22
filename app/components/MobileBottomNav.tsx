"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, FileText, Phone, Menu } from "lucide-react";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { FREE_GROWTH_TOOLS_PATH, STRATEGY_CALL_PATH } from "@/lib/funnelCtas";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: FREE_GROWTH_TOOLS_PATH, label: "Tools", icon: Wrench },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: STRATEGY_CALL_PATH, label: "Book", icon: Phone },
] as const;

/**
 * Fixed bottom navigation for mobile and tablet. App-like UX; hidden on desktop (lg+).
 * Uses safe-area-inset-bottom for notched devices.
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { toggle } = useMobileNav();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around min-h-[56px]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === STRATEGY_CALL_PATH
                ? pathname === "/contact" ||
                  pathname === STRATEGY_CALL_PATH ||
                  pathname.startsWith(`${STRATEGY_CALL_PATH}/`)
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 min-h-[56px] touch-manipulation transition-colors active:bg-muted/50",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden />
              <span className="text-[10px] sm:text-xs truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={toggle}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 min-h-[56px] touch-manipulation text-muted-foreground hover:text-foreground active:bg-muted/50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 shrink-0" aria-hidden />
          <span className="text-[10px] sm:text-xs truncate max-w-full">Menu</span>
        </button>
      </div>
    </nav>
  );
}
