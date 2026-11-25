import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: the Gildan Short Sleeve T-Shirt (MN-98) uses the original navy
// photo (/gildan/navy.webp, same as Service's MN-3) as its default, not the
// 2000T (tall) model shot. Other colours are unchanged.
// Usage: tsx scripts/set-mn98-navy-original.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const row = (await db.execute("SELECT imgs FROM products WHERE vendor = 'modernniagara' AND sku = 'MN-98'")).rows[0];
  if (!row) throw new Error("MN-98 missing");
  const imgs = (JSON.parse(String(row.imgs)) as string[]).map((s) => (s === "/gift/2000/navy.webp" ? "/gildan/navy.webp" : s));
  const r = await db.execute({
    sql: "UPDATE products SET img = '/gildan/navy.webp', imgs = ? WHERE vendor = 'modernniagara' AND sku = 'MN-98'",
    args: [JSON.stringify(imgs)],
  });
  console.log("MN-98 navy -> original:", r.rowsAffected, imgs);
}
main().catch((e) => { console.error(e); process.exit(1); });
