import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const SKU = "MN-32";

// Native TravisMathew site photos (scraped 1380x1737), 3 stances per colour.
// Swatch → gallery image mapping in the storefront works by matching the colour
// NAME (from fetch-products colorNames) against the image filename, so each file
// is named "<colourslug>-<stance>.webp" and the colour hex below resolves to that
// slug's name (Black, Copen Blue, Heather Microchip, Vintage Indigo, Heather Scooter).
const COLORS = ["#1a1a18", "#517fa4", "#c9c7c8", "#47536b", "#ca7988"];
const STANCES = ["front", "side", "chest"];
const SLUGS = ["black", "copenblue", "heathermicrochip", "vintageindigo", "heatherscooter"];
const IMGS = SLUGS.flatMap((s) => STANCES.map((st) => `/heater/${s}-${st}.webp`));
const IMG = IMGS[0]; // black-front

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
  console.log("BEFORE (save this to revert):");
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
