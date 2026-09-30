import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const SKU = "MN-29";

// Microfiber Waffle Towel — adds the Blue colour and gives each colour swatch its
// own (logo-free) product photo. Swatch→image mapping in the storefront matches
// the colour NAME to the filename, so files are /towel/<name>.webp.
const COLORS = ["#1a1a18", "#3758a9", "#6e6e6e", "#ffffff"]; // Black, Blue, Grey, White
const IMGS = ["/towel/black.webp", "/towel/blue.webp", "/towel/grey.webp", "/towel/white.webp"];
const IMG = IMGS[0];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  const before = await db.execute({
    sql: "SELECT sku, colors, img, imgs FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, SKU],
  });
  if (before.rows.length === 0) { console.error(`ABORT: ${SKU} not found.`); process.exit(1); }
  console.log("BEFORE (save to revert):");
  console.log(JSON.stringify(before.rows[0], null, 2));

  await db.execute({
    sql: "UPDATE products SET colors = ?, img = ?, imgs = ? WHERE vendor = ? AND sku = ?",
    args: [JSON.stringify(COLORS), IMG, JSON.stringify(IMGS), VENDOR, SKU],
  });

  const after = await db.execute({
    sql: "SELECT sku, colors, img, imgs FROM products WHERE vendor = ? AND sku = ?",
    args: [VENDOR, SKU],
  });
  console.log("\nAFTER:");
  console.log(JSON.stringify(after.rows[0], null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
