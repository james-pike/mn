import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const NAVY = "#2c3e50";

// Gildan Ultra Cotton Long Sleeve T-Shirt (#2400) — long-sleeve sibling of the
// short-sleeve tee MN-3 (#2000). Structured to mirror MN-3: fabric spec in
// `material`, terse garment features in `details` (comma-split into bullets).
const product = {
  sku: "MN-31",
  name: "Long Sleeve T-Shirt - Navy",
  category: "Shirts",
  sizes: "S - 5XL",
  colors: [NAVY],
  price: 19.5,
  img: "/2400.jpg",
  imgs: ["/2400.jpg"],
  material: "6 oz/yd² (US) 10.1 oz/L yd (CA), 100% U.S. cotton, 18 singles",
  details:
    "Classic fit, Classic width rib collar, Taped neck and shoulders, Rib cuffs, Tear away label, #2400",
  sort_order: 12, // right after MN-3 (10) and MN-2 (11) in the Shirts tab
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
