import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: the Gildan Long Sleeve T-Shirt (MN-99) defaults to Sport Grey.
// Usage: tsx scripts/set-mn99-grey-default.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute("UPDATE products SET img = '/gift/2400/sportgrey.webp' WHERE vendor = 'modernniagara' AND sku = 'MN-99'");
  console.log("MN-99 default -> sport grey:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
