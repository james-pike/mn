import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// After re-baking gift images in place (same filenames), browsers/CDN can keep
// serving the old copies for up to 4h (cache-control max-age=14400). This tags
// every /gift/ image URL on the live gift products with ?v=<n> so clients fetch
// the new files. Re-run with a higher number after the next bake.
// Usage: tsx scripts/bust-gift-image-cache.ts <n>
const V = process.argv[2] || "2";

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute("SELECT sku, img, imgs FROM products WHERE vendor = 'modernniagara' AND portals LIKE '%\"gift\"%' AND (hidden IS NULL OR hidden = 0) AND portals NOT LIKE '%staging%'");
  const tag = (p: string) => (p.startsWith("/gift/") ? `${p.split("?")[0]}?v=${V}` : p);
  for (const row of r.rows as any[]) {
    const imgs = (JSON.parse(String(row.imgs)) as string[]).map(tag);
    await db.execute({ sql: "UPDATE products SET img = ?, imgs = ? WHERE vendor = 'modernniagara' AND sku = ?", args: [tag(String(row.img)), JSON.stringify(imgs), row.sku] });
    console.log(row.sku, tag(String(row.img)));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
