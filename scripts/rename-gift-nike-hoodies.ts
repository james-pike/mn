import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: drop "Fleece" from the two Nike Club hoodie titles (they sit
// under the Fleeces category already; "Hoodie" says what they are).
// Usage: tsx scripts/rename-gift-nike-hoodies.ts
const NAMES: [string, string][] = [
  ["MN-152", "Nike Club Sleeve Swoosh Full Zip Hoodie"],
  ["MN-153", "Nike Club Sleeve Swoosh Pullover Hoodie"],
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
