/**
 * Visual documentation for QuickCreatePersonaModal.
 * If you add Storybook, convert this file to CSF with @storybook/react.
 */
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickCreatePersonaModal } from "./index";
import { Button } from "@/components/ui/button";

const client = new QueryClient();

export default {
  title: "Admin/QuickCreatePersonaModal",
  component: QuickCreatePersonaModal,
};

export function Default() {
  const [open, setOpen] = useState(true);
  return (
    <QueryClientProvider client={client}>
      <div className="min-h-[50vh] bg-muted/30 p-4">
        <Button type="button" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <QuickCreatePersonaModal open={open} onOpenChange={setOpen} />
      </div>
    </QueryClientProvider>
  );
}
