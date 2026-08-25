import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const HEATHER_BLACK = "#1a1a18";
const HEATHER_NAVY = "#3b4657"; // heathered navy — approximate swatch

// TravisMathew Tour Ready Stripe 1/4 Zip (style #A48471) — mid-layer stripe
// quarter-zip pullover. Stored under SWAG; displayed under "Sweaters" via the
// fetch-products OVERRIDES map. `details` is comma-split into bullets on render,
// so each bullet must be comma-free.
const product = {
  sku: "MN-35",
  name: "Travis Mathew Tour Ready Stripe 1/4 Zip",
  category: "SWAG",
  sizes: "S - 3XL",
  colors: [HEATHER_BLACK, HEATHER_NAVY],
  price: 110.0,
  img: "/tour-ready-quarter-zip.webp",
  imgs: ["/tour-ready-quarter-zip.webp"],
  material: "",
  details:
    "Quarter-zip pullover, Performance stretch fabric, Ribbed cuffs and hem, Modern logo on sleeve (tone on tone)",
  sort_order: 19, // right after the Final Drive View Polo (MN-34, sort_order 18)
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
    sql: "SELECT sku, name, category, sizes, colors, price, img, details, sort_order FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, product.sku],
  });
  console.log("Inserted:");
  console.log(JSON.stringify(row.rows[0], null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
