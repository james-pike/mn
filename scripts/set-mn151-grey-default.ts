import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: Herschel Recycled Classic Gym Bag (MN-151, $100) defaults to
// Raven Crosshatch (grey) — first colour + default image.
// Usage: tsx scripts/set-mn151-grey-default.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute({
    sql: "UPDATE products SET colors = ?, img = ?, imgs = ? WHERE vendor = 'modernniagara' AND sku = 'MN-151'",
    args: [JSON.stringify(["#b5b9c4", "#1a1a18"]), "/gift/CA2009-46/raven-crosshatch-front.webp",
      JSON.stringify(["/gift/CA2009-46/raven-crosshatch-front.webp", "/gift/CA2009-46/black-front.webp"])],
  });
  console.log("MN-151 default -> Raven Crosshatch:", r.rowsAffected);
}
main().catch((e) => { console.error(e); process.exit(1); });
