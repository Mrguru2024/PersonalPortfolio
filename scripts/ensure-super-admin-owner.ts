import * as dotenv from "dotenv";
import { resolve } from "path";
import { ensureSuperAdminOwnerAccount } from "../server/ensureSuperAdminOwnerAccount";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const r = await ensureSuperAdminOwnerAccount();
  if (r.ok) {
    console.log(r.message);
    process.exit(0);
  }
  console.error(r.message);
  process.exit(1);
}

main();
