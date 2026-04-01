import { NextResponse } from "next/server";
import { storage } from "@server/storage";

const ENV_LOCK_INTERNAL = "internal";

/** When set to `internal`, public Ascendra OS routes stay off regardless of the database toggle (production kill switch). */
export function isAscendraOsPublicAccessEnvLocked(): boolean {
  return (
    process.env.ASCENDRA_OS_PUBLIC_ACCESS_LOCK?.trim().toLowerCase() === ENV_LOCK_INTERNAL
  );
}

export type AscendraOsPublicAccessState = {
  storedPublicAccessEnabled: boolean;
  effectivePublicAccessEnabled: boolean;
  envLockForcesInternal: boolean;
};

export async function getAscendraOsPublicAccessState(): Promise<AscendraOsPublicAccessState> {
  const envLockForcesInternal = isAscendraOsPublicAccessEnvLocked();
  const row = await storage.getAscendraOsSettings();
  const storedPublicAccessEnabled = row.publicAccessEnabled;
  return {
    storedPublicAccessEnabled,
    effectivePublicAccessEnabled: envLockForcesInternal ? false : storedPublicAccessEnabled,
    envLockForcesInternal,
  };
}

/** If public Ascendra OS is not allowed, return a JSON NextResponse; otherwise null (caller continues). */
export async function ascendraOsPublicGateResponse(): Promise<NextResponse | null> {
  const { effectivePublicAccessEnabled, envLockForcesInternal } =
    await getAscendraOsPublicAccessState();
  if (effectivePublicAccessEnabled) return null;
  return NextResponse.json(
    {
      error: "ascendra_os_internal_only",
      message:
        "Ascendra OS is available to your team only right now. Public client access is disabled or locked by environment.",
      envLockForcesInternal,
    },
    { status: 403 },
  );
}
