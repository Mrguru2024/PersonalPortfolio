"use client";

import { use } from "react";
import ProjectDetails from "@/pages/ProjectDetails";

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectDetails />;
}
