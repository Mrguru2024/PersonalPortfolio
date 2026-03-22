/**
 * Visual documentation. If you add Storybook, convert to CSF with @storybook/react.
 */
import { useState } from "react";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { CommAudienceSegmentBuilder } from "./index";

export default {
  title: "Communications/CommAudienceSegmentBuilder",
  component: CommAudienceSegmentBuilder,
};

export function Default() {
  const [value, setValue] = useState<CommSegmentFilters>({ status: "new", excludeDoNotContact: true });
  const [savedListId, setSavedListId] = useState("");
  return (
    <div className="p-6 bg-muted/30 max-w-xl">
      <CommAudienceSegmentBuilder
        value={value}
        onChange={setValue}
        savedListId={savedListId}
        onSavedListIdChange={setSavedListId}
        savedLists={[
          { id: 1, name: "High intent" },
          { id: 2, name: "Newsletter opt-ins" },
        ]}
      />
    </div>
  );
}
