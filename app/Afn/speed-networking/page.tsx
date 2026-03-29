import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommunitySpeedNetworkingPage() {
  return (
    <CommunityShell>
      <div className="container max-w-2xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Speed networking</CardTitle>
            <CardDescription>
              Short structured sessions (chat first, live when you enable providers) — scaffolded for Zoom Video SDK /
              live providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Check live readiness under <code className="text-xs">/api/community/live/status</code> once credentials are
            configured.
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}
