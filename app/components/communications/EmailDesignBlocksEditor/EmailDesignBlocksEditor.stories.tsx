/**
 * Visual documentation. If you add Storybook, convert to CSF with @storybook/react.
 */
import { useState } from "react";
import { EmailDesignBlocksEditor } from "./index";

export default {
  title: "Communications/EmailDesignBlocksEditor",
  component: EmailDesignBlocksEditor,
};

export function Default() {
  const [rows, setRows] = useState<string[]>(["hero_cta", "footer"]);
  return (
    <div className="p-6 bg-muted/30 max-w-lg">
      <EmailDesignBlocksEditor blockRows={rows} onBlockRowsChange={setRows} externalLinkCount={2} />
    </div>
  );
}
