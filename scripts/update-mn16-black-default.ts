import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const SKU = "MN-16"; // Women's Under Armour Tech Polo (1370431)

// Lead with BLACK instead of Navy (navy source shot is currently wrong anyway).
// Order drives the default swatch + main image in the storefront and the SM view.
const COLORS = ["#1a1a18", "#2c3e50", "#ffffff", "#b8b8b8", "#6b3fa0", "#c0392b", "#1e40af"];
const IMGS = [
  "/uapolo-womens/black.webp",
  "/uapolo-womens/navy.webp",
  "/uapolo-womens/white.webp",
  "/uapolo-womens/greyheather.webp",
  "/uapolo-womens/purple.webp",
  "/uapolo-womens/red.webp",
  "/uapolo-womens/royal.webp",
];
const IMG = IMGS[0];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const before = await db.execute({ sql: "SELECT sku, colors, img FROM products WHERE vendor=? AND sku=?", args: [VENDOR, SKU] });
  if (!before.rows.length) { console.error(`ABORT: ${SKU} not found`); process.exit(1); }
  console.log("BEFORE:", JSON.stringify(before.rows[0]));
  await db.execute({
    sql: "UPDATE products SET colors=?, img=?, imgs=? WHERE vendor=? AND sku=?",
    args: [JSON.stringify(COLORS), IMG, JSON.stringify(IMGS), VENDOR, SKU],
  });
  const after = await db.execute({ sql: "SELECT sku, colors, img FROM products WHERE vendor=? AND sku=?", args: [VENDOR, SKU] });
  console.log("AFTER: ", JSON.stringify(after.rows[0]));
}
main().catch((e) => { console.error(e); process.exit(1); });
