import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const BLACK = "#1a1a18";
const RED = "#c0392b";
const WHITE = "#ffffff";

// TravisMathew Heater SERIES JERSEY POLO — men's performance polo, the jersey
// sibling to the Heater Polo (MN-32). Sits with the other polos in the SWAG tab
// (mapped to the Polos category via fetch-products OVERRIDES). Structured like
// the other apparel rows: fabric composition in `material`, terse garment
// features in `details` (comma-split into bullets).
const product = {
  sku: "MN-33",
  name: "Men's Travis Mathew Heater Jersey Polo",
  category: "SWAG",
  sizes: "S - 3XL",
  colors: [BLACK, RED, WHITE],
  price: 110.0,
  img: "/heater-jersey.webp",
  imgs: ["/heater-jersey.webp"],
  material: "63% Polyester / 34% Cotton / 3% Elastane, Imported",
  // NOTE: `details` is comma-split into bullets on render, so each bullet must be
  // comma-free.
  details:
    "Signature double-needle collar, Contrast interior collar, Printed logo on the back yoke, Fold over placket",
  sort_order: 17, // right after the Heater Polo (MN-32, sort_order 16) in the SWAG tab
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
    sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.sku, product.name, product.category, product.sizes, "",
      JSON.stringify(product.colors), product.price,
      product.img, JSON.stringify(product.imgs),
      product.material, product.details, null, product.sort_order, VENDOR,
    ],
  });

  const row = await db.execute({
    sql: "SELECT sku, name, category, sizes, colors, price, img, imgs, material, details, sort_order FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, product.sku],
  });
  console.log("Inserted:");
  console.log(JSON.stringify(row.rows[0], null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
