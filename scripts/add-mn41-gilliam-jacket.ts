import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const BLACK = "#1a1a18";
const NAVY = "#2c3e50";

// Carhartt Gilliam Jacket (#102208) — Rain Defender / Wind Fighter insulated
// jacket. Service-side only (no `portals`), so it lands in the full Service
// catalog under the Jackets tab and stays out of the Electrical view. Black is
// the default colour; navy is the alternate. Images live in public/sku.
const product = {
  sku: "MN-41",
  name: "Carhartt Gilliam Jacket",
  category: "Jackets",
  sizes: "S - 3XL / LT - 2XLT",
  colors: [BLACK, NAVY],
  price: 109.99,
  img: "/sku/102208-black.png",
  imgs: ["/sku/102208-black.png", "/sku/102208-navy.png"],
  material: "",
  details:
    "Rain Defender durable water repellent, Wind Fighter windproof technology, Mock-neck collar, Left-chest map pocket, Two lower-front pockets with hidden snap closure, Two inside pockets (one zippered, one hook-and-loop), Hook-and-loop adjustable cuffs, Drawcord adjustable hem, Triple-stitched main seams, Relaxed fit, #102208",
  sort_order: 9, // Jackets tab, right after the Coal Harbour soft shells (7, 8)
};

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  const existing = await db.execute({
    sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, product.sku],
  });
  if (existing.rows.length > 0) {
    console.error(`ABORT: ${product.sku} already exists for ${VENDOR}.`);
    process.exit(1);
  }

  await db.execute({
    sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.sku, product.name, product.category, product.sizes, "",
      JSON.stringify(product.colors), product.price,
      product.img, JSON.stringify(product.imgs),
      product.material, product.details, null, product.sort_order, VENDOR, "102208",
    ],
  });

  const row = await db.execute({
    sql: "SELECT sku, name, category, sizes, colors, price, img, imgs, details, sort_order, vendor, code FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, product.sku],
  });
  console.log("Inserted:");
  console.log(JSON.stringify(row.rows[0], null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
