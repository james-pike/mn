import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";

// Per-colour image sets. Colours stay as-is; we only refresh img/imgs so each
// swatch has its own photo (storefront matches colour NAME → filename).
const UPDATES: { sku: string; imgs: string[] }[] = [
  // Coal Harbour soft shell — Black / Grey / Navy (J7603 men's, L7603 women's)
  { sku: "MN-20", imgs: ["/coalharbour/black.webp", "/coalharbour/grey.webp", "/coalharbour/navy.webp"] },
  { sku: "MN-19", imgs: ["/coalharbour-womens/black.webp", "/coalharbour-womens/grey.webp", "/coalharbour-womens/navy.webp"] },
  // Under Armour Tech Polo — Navy / Black / White / Grey Heather / Purple / Red / Royal
  { sku: "MN-15", imgs: ["/uapolo/navy.webp", "/uapolo/black.webp", "/uapolo/white.webp", "/uapolo/greyheather.webp", "/uapolo/purple.webp", "/uapolo/red.webp", "/uapolo/royal.webp"] },
  { sku: "MN-16", imgs: ["/uapolo-womens/navy.webp", "/uapolo-womens/black.webp", "/uapolo-womens/white.webp", "/uapolo-womens/greyheather.webp", "/uapolo-womens/purple.webp", "/uapolo-womens/red.webp", "/uapolo-womens/royal.webp"] },
  // Gildan short-sleeve tee (2000/2000T) — single Navy, updated SM model shot
  { sku: "MN-3", imgs: ["/gildan/navy.webp"] },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  for (const u of UPDATES) {
    const before = await db.execute({ sql: "SELECT sku, colors, img, imgs FROM products WHERE vendor=? AND sku=?", args: [VENDOR, u.sku] });
    if (!before.rows.length) { console.error(`ABORT: ${u.sku} not found`); continue; }
    console.log(`BEFORE ${u.sku}:`, JSON.stringify(before.rows[0].imgs));
    await db.execute({
      sql: "UPDATE products SET img=?, imgs=? WHERE vendor=? AND sku=?",
      args: [u.imgs[0], JSON.stringify(u.imgs), VENDOR, u.sku],
    });
    const after = await db.execute({ sql: "SELECT sku, img, imgs FROM products WHERE vendor=? AND sku=?", args: [VENDOR, u.sku] });
    console.log(`AFTER  ${u.sku}:`, JSON.stringify(after.rows[0].imgs), "\n");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
