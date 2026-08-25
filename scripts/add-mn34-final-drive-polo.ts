import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const HEATHER_BLACK = "#1a1a18";
const GREEN_BAY = "#9caf88"; // sage/eucalyptus green — approximate swatch
const WHITE = "#ffffff";

// TravisMathew Final Drive View Polo (style #A48406) — printed performance polo.
// Stored under SWAG like the other apparel rows; displayed under "Polos" via the
// fetch-products OVERRIDES map. `details` is comma-split into bullets on render,
// so each bullet must be comma-free.
const product = {
  sku: "MN-34",
  name: "Travis Mathew Final Drive View Polo",
  category: "SWAG",
  sizes: "S - 3XL",
  colors: [HEATHER_BLACK, GREEN_BAY, WHITE],
  price: 120.0,
  img: "/final-drive-view-polo-green.webp", // Green Bay colorway — primary
  imgs: ["/final-drive-view-polo-green.webp", "/final-drive-view-polo.webp"],
  material: "",
  details:
    "4-Way Stretch, Breathable, Modern Fit, Signature self-fabric collar, Modern logo on sleeve (tone on tone)",
  sort_order: 18, // right after the Heater Jersey Polo (MN-33, sort_order 17)
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
