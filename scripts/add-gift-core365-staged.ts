import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Core365 gift lineup (first 45 of https://en-ca.ssactivewear.com/ps/core365, minus
// 78193 which is MN-97): MN-100..MN-143, STAGED — portals=["gift","staging"].
// scripts/fetch-products.ts skips "staging" rows, so they're on no mn2 portal yet;
// the sm SKU manager's Gift division picks them up for logo placement. Their sm
// blanks use the code + "MNG" (e.g. 88181MNG) so they never mix with other stores'
// blanks of the same style. Publish later by dropping "staging" from portals.
// Usage: tsx scripts/add-gift-core365-staged.ts <sm_build.json>
const VENDOR = "modernniagara";
const { rows } = JSON.parse(readFileSync(process.argv[2], "utf8"));

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  let n = 0;
  for (const p of rows) {
    const ex = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (ex.rows.length) { console.log(`skip ${p.sku} (exists)`); continue; }
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code, portals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.sku, p.name, p.category, p.sizes, "", JSON.stringify(p.colors), p.price, p.img, JSON.stringify(p.imgs),
        p.material, p.details, null, p.sort_order, VENDOR, p.code, JSON.stringify(p.portals)],
    });
    n++;
  }
  console.log("inserted", n, "of", rows.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
