import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (GIFT_PASSWORD login): 40 Adidas products from S&S,
// model photos only (front/side/back per colour) in public/gift/<code>/ (code like A588).
// Flagged portals=["gift"] so they show ONLY on the Gift login.
// Usage: tsx scripts/add-gift-adidas-products.ts <products.json>
const VENDOR = "modernniagara";
const items = JSON.parse(readFileSync(process.argv[2], "utf8"));

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  
  for (const p of items) {
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (ex.rows.length) { console.log(`skip ${p.sku} (exists)`); continue; }
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.sku, p.name, p.category, p.sizes, "", JSON.stringify(p.colors), p.price, p.imgs[0], JSON.stringify(p.imgs),
        p.material, p.details, null, p.sort_order, VENDOR, p.code, JSON.stringify(["gift"])],
    });
    console.log("inserted", p.sku, p.name);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
