"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmailHubContactsPage() {
  return (
    <Card className="rounded-2xl border-border/60 max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Contacts
        </CardTitle>
        <CardDescription>
          Email Hub links outbound messages to CRM contacts via <strong>related contact id</strong>. Manage people in
          the CRM — from a contact profile use <strong>Send email</strong> to prefill the composer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/crm">Open CRM</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/email-hub/compose">Compose</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
