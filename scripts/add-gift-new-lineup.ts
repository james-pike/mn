import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift portal) — new lineup, 2026-11-25. 16 products from the
// links supplied (SanMar Canada: Nike + The North Face; Trimark: Herschel bags;
// S&S: Columbia 208855 + Adidas A588/A589). Prices are the gift tiers
// ($50/$100/$150/$200); categories Polos / Fleece / Jackets / Bags.
//   - 14 new rows MN-144..MN-157 (portals=["gift"]), photos in public/gift/<code>/,
//     sm blanks under <code>MNG (no clash with other stores' blanks).
//   - A588/A589 already exist (MN-54/MN-56, hidden by hide-gift-lineup.ts):
//     un-hidden, moved to Fleece, $100, re-sorted into link order.
// Data: scripts/gift-lineup-2026-11-25.json. Usage: tsx scripts/add-gift-new-lineup.ts
const VENDOR = "modernniagara";
const B = JSON.parse(readFileSync(new URL("./gift-lineup-2026-11-25.json", import.meta.url), "utf8"));
const EXISTING: Record<string, string> = { A588: "MN-54", A589: "MN-56" };

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  let n = 0;
  for (const p of B.rows) {
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (ex.rows.length) { console.log(`skip ${p.sku} (exists)`); continue; }
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.sku, p.name, p.category, p.sizes, "", JSON.stringify(p.colors), p.price, p.img, JSON.stringify(p.imgs),
        p.material, p.details, null, p.sort_order, VENDOR, p.code, JSON.stringify(p.portals)],
    });
    n++;
  }
  for (const u of B.update) {
    const sku = EXISTING[u.code];
    await db.execute({
      sql: "UPDATE products SET hidden = 0, category = ?, price = ?, sort_order = ? WHERE vendor = ? AND sku = ?",
      args: [u.category, u.price, u.sort_order, VENDOR, sku],
    });
    console.log("updated", sku, u.code, u.category, u.price);
  }
  console.log("inserted", n, "of", B.rows.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
