import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift portal): 5 Carhartt products from the sm SKU manager,
// at the gift price tiers. Photos are the sm SKU images with the MN logo baked
// on at the sm placements (scripts/bake-gift-carhartt.py) -> public/gift/<code>/.
// Sort orders slot each one in among its category's items by price.
// Usage: tsx scripts/add-gift-carhartt.ts [--delete]
const VENDOR = "modernniagara";
const BLACK = "#1a1a18", NAVY = "#2c3e50", GREY = "#6e6e6e", CARBON = "#5f6062", TARMAC = "#5b5444";
const ROWS = [
  { sku: "MN-42", code: "K121", name: "Carhartt Marquette Pullover Hoodie", category: "Fleece", price: 75, sort: 302.5,
    sizes: "S - 4XL", colors: [BLACK, CARBON, NAVY], slugs: ["black", "carbon-heather", "navy"],
    material: "10.5 oz, 50% cotton / 50% polyester",
    details: "Three-piece hood with drawcord, Rib-knit cuffs and waist, Front handwarmer pocket, Triple-stitched seams, Carhartt patch, Loose fit, #K121" },
  { sku: "MN-51", code: "102208", name: "Carhartt Gilliam Jacket", category: "Jackets", price: 110, sort: 312.6,
    sizes: "S - 3XL / LT - 2XLT", colors: [BLACK, NAVY], slugs: ["black", "navy"],
    material: "100% nylon Cordura shell with quilted polyester insulation",
    details: "Rain Defender durable water repellent, Wind Fighter windproof technology, Mock-neck collar, Left-chest map pocket, Two lower-front pockets with hidden snap closure, Two inside pockets, Hook-and-loop adjustable cuffs, Drawcord adjustable hem, Relaxed fit, #102208" },
  { sku: "MN-52", code: "105751", name: "Carhartt Storm Defender Packable Jacket", category: "Jackets", price: 150, sort: 312.7,
    sizes: "S - 4XL / LT - 2XLT", colors: [BLACK, TARMAC], slugs: ["black", "tarmac"],
    material: "100% nylon, lightweight",
    details: "Storm Defender waterproof breathable technology (10K/5K), Wind Fighter technology, Adjustable hood, Water-repellent front zip, Drawcord-adjustable droptail hem, Zippered chest and two lower pockets, Packs into its left lower pocket, Relaxed fit, #105751" },
  { sku: "MN-50", code: "104277", name: "Carhartt Washed Duck Mock Neck Vest", category: "Jackets", price: 100, sort: 312.5,
    sizes: "S - 5XL", colors: [BLACK, GREY], slugs: ["black", "grey"],
    material: "12 oz, 100% cotton washed duck, sherpa lining",
    details: "Sherpa lining for warmth, Map pocket on left chest with zipper closure, Two large sherpa-lined front pockets, Two inside pockets, Droptail hem for added coverage, #104277" },
  { sku: "MN-53", code: "106673", name: "Carhartt Iconic Duck Active Jac", category: "Jackets", price: 150, sort: 312.9,
    sizes: "S - 5XL", colors: [BLACK], slugs: ["black"],
    material: "12 oz, 100% cotton firm duck",
    details: "Quilted-flannel lining in body, Quilted-nylon lining in sleeves, Attached quilted-flannel-lined hood with drawcord, Two inside pockets, Rib-knit cuffs, #106673" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const p of ROWS) {
    if (process.argv.includes("--delete")) {
      await db.execute({ sql: "DELETE FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
      console.log("deleted", p.sku); continue;
    }
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (ex.rows.length) { console.log(`skip ${p.sku} (exists)`); continue; }
    const imgs = p.slugs.map((s) => `/gift/${p.code}/${s}-front.webp`);
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.sku, p.name, p.category, p.sizes, "", JSON.stringify(p.colors), p.price, imgs[0], JSON.stringify(imgs),
        p.material, p.details, null, p.sort, VENDOR, p.code, JSON.stringify(["gift"])],
    });
    console.log("inserted", p.sku, p.name, `$${p.price}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
