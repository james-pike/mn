import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift): Gildan SS/LS tees in 6 popular colours. The shared
// navy-only MN-3 / MN-31 stay on Service unchanged (their "gift" flag is dropped);
// gift gets its own copies MN-98 / MN-99 with the extra colours. MN logo baked by
// sm/scripts/bake-mn-gift-shirts.py into public/gift/2000|2400/<slug>.webp.
// Usage: tsx scripts/add-gift-gildan-colours.ts
const VENDOR = "modernniagara";
const PALETTE: [string, string][] = [
  ["#1f2a48", "navy"], ["#1a1a18", "black"], ["#4a4a4a", "charcoal"],
  ["#9fa1a4", "sportgrey"], ["#1c57a5", "royal"], ["#c0392b", "red"],
];
const COPIES = [
  { from: "MN-3", sku: "MN-98", code: "2000", name: "Gildan Short Sleeve T-Shirt" },
  { from: "MN-31", sku: "MN-99", code: "2400", name: "Gildan Long Sleeve T-Shirt" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const c of COPIES) {
    const src = (await db.execute({ sql: "SELECT * FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, c.from] })).rows[0];
    if (!src) throw new Error(`missing ${c.from}`);
    const imgs = PALETTE.map(([, s]) => `/gift/${c.code}/${s}.webp`);
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, c.sku] });
    if (ex.rows.length) {
      await db.execute({ sql: "UPDATE products SET colors = ?, img = ?, imgs = ? WHERE vendor = ? AND sku = ?",
        args: [JSON.stringify(PALETTE.map(([h]) => h)), imgs[0], JSON.stringify(imgs), VENDOR, c.sku] });
      console.log("updated", c.sku);
    } else {
      await db.execute({
        sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [c.sku, c.name, src.category, src.sizes, src.badge ?? "", JSON.stringify(PALETTE.map(([h]) => h)), src.price, imgs[0],
          JSON.stringify(imgs), src.material, src.details, null, src.sort_order, VENDOR, c.code, JSON.stringify(["gift"])],
      });
      console.log("inserted", c.sku, c.name, "price", src.price);
    }
    // Drop the shared navy-only product from the gift portal (keeps Service + any other portals).
    const portals: string[] = JSON.parse(String(src.portals || "[]")).filter((p: string) => p !== "gift");
    await db.execute({ sql: "UPDATE products SET portals = ? WHERE vendor = ? AND sku = ?",
      args: [portals.length ? JSON.stringify(portals) : null, VENDOR, c.from] });
    console.log(c.from, "portals ->", portals);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
