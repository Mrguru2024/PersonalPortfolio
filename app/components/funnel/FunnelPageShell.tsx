import { cn } from "@/lib/utils";

interface FunnelPageShellProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "soft" | "strong";
}

export function FunnelPageShell({
  children,
  className,
  intensity = "soft",
}: FunnelPageShellProps) {
  return (
    <div
      className={cn(
        "funnel-page-shell relative w-full min-w-0 max-w-full overflow-x-hidden",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className={cn(
            "funnel-ambient-base absolute inset-0",
            intensity === "strong" && "funnel-ambient-strong"
          )}
        />
        <div className="funnel-grid-overlay absolute inset-0" />
        <div className="funnel-blob funnel-blob-primary -top-28 -left-20" />
        <div className="funnel-blob funnel-blob-secondary top-[32%] -right-24" />
        <div className="funnel-blob funnel-blob-tertiary bottom-[-90px] left-[28%]" />
      </div>
      {children}
    </div>
  );
}
