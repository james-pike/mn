import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift): drop the Men's Adidas Heathered Polo (MN-85) from the
// lineup. It's gift-only, so it's hidden (delisted) rather than un-tagged —
// clearing its "gift" portal would make it show up on Service instead.
// Usage: tsx scripts/hide-mn85-adidas-heathered-polo.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute("UPDATE products SET hidden = 1 WHERE vendor = 'modernniagara' AND sku = 'MN-85'");
  console.log("hidden MN-85:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
