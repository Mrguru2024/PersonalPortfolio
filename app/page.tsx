import Home from "@/pages/Home";
import { redirect } from "next/navigation";
import { resolveCampaignLandingPath, toQueryString } from "@/lib/campaignRouting";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const targetPath = resolveCampaignLandingPath(resolvedSearchParams);
  if (targetPath) {
    const queryString = toQueryString(resolvedSearchParams);
    const destination = queryString ? `${targetPath}?${queryString}` : targetPath;
    redirect(destination);
  }
  return <Home />;
}
