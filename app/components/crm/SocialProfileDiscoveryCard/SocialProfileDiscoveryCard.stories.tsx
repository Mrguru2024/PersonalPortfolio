/**
 * Visual documentation for SocialProfileDiscoveryCard.
 * If you add Storybook, convert this file to CSF with @storybook/react.
 */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocialProfileDiscoveryCard } from "./index";

const client = new QueryClient();

export default {
  title: "CRM/SocialProfileDiscoveryCard",
  component: SocialProfileDiscoveryCard,
};

export function Default() {
  return (
    <QueryClientProvider client={client}>
      <div className="p-6 bg-muted/30 max-w-lg">
        <SocialProfileDiscoveryCard
          contactId={1}
          contactName="Jordan Lee"
          company="Northwind LLC"
          jobTitle="VP Marketing"
          onUpdated={() => {}}
        />
      </div>
    </QueryClientProvider>
  );
}
