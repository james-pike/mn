import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const SKU = "MN-11"; // Men's FootJoy Speckle Print Polo (style 16324)

// Solace Blue is the real model photo; Navy + Black are xAI recolours of that
// same stance. Swatch→image mapping matches the colour NAME to the filename.
const COLORS = ["#6b8bb0", "#2c3e50", "#1a1a18"]; // Solace Blue, Navy, Black
const IMGS = ["/footjoy/solaceblue.webp", "/footjoy/navy.webp", "/footjoy/black.webp"];
const IMG = IMGS[0];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const before = await db.execute({ sql: "SELECT sku, colors, img, imgs FROM products WHERE vendor=? AND sku=?", args: [VENDOR, SKU] });
  if (!before.rows.length) { console.error(`ABORT: ${SKU} not found`); process.exit(1); }
  console.log("BEFORE:", JSON.stringify(before.rows[0]));
  await db.execute({
    sql: "UPDATE products SET colors=?, img=?, imgs=? WHERE vendor=? AND sku=?",
    args: [JSON.stringify(COLORS), IMG, JSON.stringify(IMGS), VENDOR, SKU],
  });
  const after = await db.execute({ sql: "SELECT sku, colors, img, imgs FROM products WHERE vendor=? AND sku=?", args: [VENDOR, SKU] });
  console.log("AFTER:", JSON.stringify(after.rows[0]));
}
main().catch((e) => { console.error(e); process.exit(1); });
