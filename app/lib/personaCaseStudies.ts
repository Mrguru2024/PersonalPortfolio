import { projects, type Project } from "@/lib/data";

/**
 * Maps persona `caseStudyRefs` (project `id` from `projects` in data.ts) to portfolio entries.
 * Unknown ids are skipped so CMS drift does not break the UI.
 */
export function resolvePersonaCaseStudyProjects(refs: string[] | undefined): Project[] {
  if (!refs?.length) return [];
  const byId = new Map(projects.map((p) => [p.id, p]));
  return refs.map((id) => byId.get(id)).filter((p): p is Project => p != null);
}

export function projectCaseStudyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}
