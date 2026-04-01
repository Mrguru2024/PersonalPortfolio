import type { ReactNode } from "react";
import { GrowthEngineShell } from "./GrowthEngineNav";

export default function GrowthEngineLayout({ children }: { children: ReactNode }) {
  return <GrowthEngineShell>{children}</GrowthEngineShell>;
}
