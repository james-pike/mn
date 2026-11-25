import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: Herschel Retreat Backpack (MN-154, $150) defaults to Navy —
// first colour + default image.
// Usage: tsx scripts/set-mn154-navy-default.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute({
    sql: "UPDATE products SET colors = ?, img = ?, imgs = ? WHERE vendor = 'modernniagara' AND sku = 'MN-154'",
    args: [JSON.stringify(["#2c3e50", "#1a191e"]), "/gift/CA2009-73/navy-front.webp",
      JSON.stringify(["/gift/CA2009-73/navy-front.webp", "/gift/CA2009-73/black-tonal-front.webp"])],
  });
  console.log("MN-154 default -> Navy:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
