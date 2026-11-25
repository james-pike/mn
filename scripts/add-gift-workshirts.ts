import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift portal): the Trimark Stirling/Wilshire and Core365
// Optimum/Operate work shirts from the TM store, in every colour the SM SKU bank
// carries (not just TM's green/black). MN logo baked by
// sm/scripts/bake-mn-gift-shirts.py into public/gift/<code>/<slug>.webp.
// Prices match the TM store exactly (no gift -10% reduction).
// Usage: tsx scripts/add-gift-workshirts.ts
const VENDOR = "modernniagara";

const TRIMARK: [string, string][] = [
  ["#1f2a48", "navy"], ["#1a1a18", "black"], ["#5e5c60", "greystorm"], ["#a1a8b0", "grey"],
  ["#446093", "blue"], ["#b5d5f0", "frostblue"], ["#1e4d2b", "forestgreen"], ["#baa48c", "desertkhaki"],
  ["#672e45", "maroon"], ["#382246", "darkplum"], ["#bc2c3a", "teamred"], ["#ffffff", "white"],
];
const CORE365: [string, string][] = [
  ["#1a1a18", "black"], ["#22304a", "classicnavy"], ["#53565a", "carbon"], ["#ffffff", "white"],
];

const TRIMARK_MAT = "65% polyester / 35% combed cotton woven twill (4.3 oz / 145 gsm)";
const CORE_MAT = "55/45 cotton/polyester twill (4.4 oz / 150 gsm)";

const items = [
  { sku: "MN-94", code: "17745", name: "Men's Trimark Stirling Short Sleeve Shirt", sizes: "S - 5XL", price: 45, palette: TRIMARK, material: TRIMARK_MAT,
    details: "Button-down collar, Upper patch pocket (left chest), Center-back box pleat, Back yoke, Flat-felled seams, Contrast inner yoke, EZ-Care fabric, #17745" },
  { sku: "MN-95", code: "17744", name: "Men's Trimark Wilshire Long Sleeve Shirt", sizes: "S - 5XL", price: 52, palette: TRIMARK, material: TRIMARK_MAT,
    details: "Button-down collar, Left chest pocket, Adjustable one-button cuffs with single pleats, Center-back box pleat, Back yoke, Flat-felled seams, Contrast inner yoke, EZ-Care fabric, #17744" },
  { sku: "MN-96", code: "78194", name: "Women's Core365 Optimum Short Sleeve Twill Shirt", sizes: "XS - 3XL", price: 45, palette: CORE365, material: CORE_MAT,
    details: "UV protection, button-down collar, flat-felled seams, left chest pocket, back yoke with box pleat, #78194" },
  { sku: "MN-97", code: "78193", name: "Women's Core365 Operate Long Sleeve Twill Shirt", sizes: "XS - 3XL", price: 52.5, palette: CORE365, material: CORE_MAT,
    details: "UV protection, button-down collar, flat-felled seams, adjustable cuffs, left chest pocket, back yoke with box pleat, #78193" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  let order = 252;
  for (const p of items) {
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (ex.rows.length) { console.log(`skip ${p.sku} (exists)`); order++; continue; }
    const imgs = p.palette.map(([, slug]) => `/gift/${p.code}/${slug}.webp`);
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.sku, p.name, "Polos", p.sizes, "", JSON.stringify(p.palette.map(([hex]) => hex)), p.price, imgs[0], JSON.stringify(imgs),
        p.material, p.details, null, order++, VENDOR, p.code, JSON.stringify(["gift"])],
    });
    console.log("inserted", p.sku, p.name);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
