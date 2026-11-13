import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Photos for the FR Insulated Bib (MNFR-5, #101626) and FR Insulated Jacket
// (MNFR-6, #101618), so the HVAC login can show them. Plain Carhartt navy
// photos, squared to 880px like the other FR images. No logo: bibs never get
// one, and the jacket is plain for now.
const VENDOR = "modernniagara";
const updates = [
  { sku: "MNFR-5", img: "/sku/FRbib.png" },
  { sku: "MNFR-6", img: "/sku/FRjacket.png" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const u of updates) {
    const r = await db.execute({
      sql: "UPDATE products SET img = ?, imgs = ? WHERE vendor = ? AND sku = ?",
      args: [u.img, JSON.stringify([u.img]), VENDOR, u.sku],
    });
    if (r.rowsAffected !== 1) { console.error(`ABORT: expected 1 row for ${u.sku}, got ${r.rowsAffected}`); process.exit(1); }
  }
  const rows = await db.execute({ sql: "SELECT sku, name, img, imgs, portals FROM products WHERE vendor = ? AND sku IN ('MNFR-5','MNFR-6')", args: [VENDOR] });
  console.log(JSON.stringify(rows.rows, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
