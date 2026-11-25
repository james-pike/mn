import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: Women's Core365 Operate Long Sleeve Twill Shirt (MN-97) defaults
// to Carbon (charcoal grey).
// Usage: tsx scripts/set-mn97-carbon-default.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute("UPDATE products SET img = '/gift/78193/carbon.webp' WHERE vendor = 'modernniagara' AND sku = 'MN-97'");
  console.log("MN-97 default -> carbon:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
