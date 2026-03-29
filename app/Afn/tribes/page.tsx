import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommunityTribesPage() {
  return (
    <CommunityShell>
      <div className="container max-w-2xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Find your tribe</CardTitle>
            <CardDescription>
              Matchmaking into small founder groups — coming next on top of your profile tags and intelligence
              scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use <strong className="text-foreground">Members</strong> and your <strong className="text-foreground">AFN home</strong>{" "}
            for discovery until tribe rooms launch.
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}
