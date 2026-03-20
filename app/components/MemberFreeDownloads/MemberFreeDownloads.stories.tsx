/**
 * Visual documentation for MemberFreeDownloads.
 * If you add Storybook, convert this file to CSF with @storybook/react.
 */
import React from "react";
import { MemberFreeDownloads } from "./index";

export default {
  title: "Member/MemberFreeDownloads",
  component: MemberFreeDownloads,
};

export function Default() {
  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <MemberFreeDownloads />
    </div>
  );
}
