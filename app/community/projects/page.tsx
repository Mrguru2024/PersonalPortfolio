import Link from "next/link";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CommunityProjectsPage() {
  return (
    <CommunityShell>
      <div className="container max-w-2xl py-8 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collaboration projects</CardTitle>
            <CardDescription>
              Project-based matching extends the collaboration board — same data model, richer workflows later.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/community/collab">Open collaboration board</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}
