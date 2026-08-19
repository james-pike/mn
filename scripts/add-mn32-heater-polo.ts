import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const BLACK = "#1a1a18";
const WHITE = "#ffffff";
const COPEN_BLUE = "#517fa4";

// TravisMathew Heater Polo — men's performance polo. Sits with the other polos
// in the SWAG tab. Structured like the other apparel rows: fabric composition in
// `material`, terse garment features in `details` (comma-split into bullets).
const product = {
  sku: "MN-32",
  name: "Men's Travis Mathew Heater Polo",
  category: "SWAG",
  sizes: "S - 3XL",
  colors: [BLACK, WHITE, COPEN_BLUE],
  price: 110.0,
  img: "/heater.webp",
  imgs: ["/heater.webp"],
  material: "67% Polyester / 23% Cotton / 7% Elastane / 3% Polyester Blend",
  // NOTE: `details` is comma-split into bullets on render, so each bullet must be
  // comma-free. The collar's long description collapses to its feature name here.
  details:
    "4-Way Stretch, Breathable, Easy Wash & Wear, Modern Fit, Versatile Performance Fabric, Signature Double-Needle Collar",
  sort_order: 16, // right after the Speckle Print polos (14/15) in the SWAG tab
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
