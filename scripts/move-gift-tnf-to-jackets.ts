import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: The North Face AIM Full Zip Fleece Jackets (MN-155 men's,
// MN-156 women's) belong under Jackets, not Fleeces.
// Usage: tsx scripts/move-gift-tnf-to-jackets.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute("UPDATE products SET category = 'Jackets' WHERE vendor = 'modernniagara' AND sku IN ('MN-155', 'MN-156')");
  console.log("moved to Jackets:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
