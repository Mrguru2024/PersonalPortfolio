import { format } from "date-fns";

interface DashboardHeaderProps {
  title: string;
  context?: string;
  description: string;
  subtext: string;
  generatedAt?: string;
}

export function DashboardHeader({ title, context, description, subtext, generatedAt }: DashboardHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{title}</h1>
      {context ? <p className="text-sm sm:text-base text-muted-foreground">{context}</p> : null}
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
      <p className="text-xs sm:text-sm text-muted-foreground">{subtext}</p>
      {generatedAt ? (
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          Last refreshed: {format(new Date(generatedAt), "MMM d, yyyy · h:mm a")}
        </p>
      ) : null}
    </header>
  );
}
