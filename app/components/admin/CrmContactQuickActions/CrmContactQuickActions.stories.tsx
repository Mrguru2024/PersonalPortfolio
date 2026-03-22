/**
 * Visual documentation for CrmContactQuickActions.
 * If you add Storybook, convert this file to CSF with @storybook/react.
 */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CrmContactQuickActions } from "./index";

const client = new QueryClient();

const sample = {
  id: 1,
  name: "Alex Rivera",
  email: "alex@example.com",
  phone: "+1 555-0100",
  intentLevel: "high_intent" as string | null,
};

export default {
  title: "Admin/CrmContactQuickActions",
  component: CrmContactQuickActions,
};

export function Default() {
  return (
    <QueryClientProvider client={client}>
      <div className="p-6 bg-muted/30 max-w-sm">
        <CrmContactQuickActions contact={sample} />
      </div>
    </QueryClientProvider>
  );
}
