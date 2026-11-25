import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: the two Herschel bags keep "Classic" in their full names (product
// page, cart). The catalog CARD titles drop it — see CARD_TITLE in product-catalog.tsx.
// Usage: tsx scripts/rename-gift-herschel.ts
const NAMES: [string, string][] = [
  ["MN-146", "Herschel Recycled Classic Crossbody Tote"],
  ["MN-151", "Herschel Recycled Classic Gym Bag"],
];
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [sku, name] of NAMES) {
    await db.execute({ sql: "UPDATE products SET name = ? WHERE vendor = 'modernniagara' AND sku = ?", args: [name, sku] });
    console.log(sku, name);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
