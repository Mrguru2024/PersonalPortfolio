import { loadGrowthPlatformEnginePricing } from "@server/services/growthPlatformOfferPricing";
import { GrowthPlatformRecommendationClient } from "./GrowthPlatformRecommendationClient";

export default async function GrowthPlatformRecommendationPage() {
  const enginePricing = await loadGrowthPlatformEnginePricing();
  return <GrowthPlatformRecommendationClient enginePricing={enginePricing} />;
}
