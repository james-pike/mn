import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// FR Duck Insulated Jacket (MNFR-6, Carhartt 101618): add Tall (L-3XL, Dark
// Navy). The product page's Regular/Tall picker lists the exact runs
// (product-detail.tsx variantSizesBySku); this is the card summary.
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute({ sql: "UPDATE products SET sizes = ? WHERE vendor = 'modernniagara' AND sku = 'MNFR-6'", args: ["S - 4XL / LT - 3XLT"] });
  if (r.rowsAffected !== 1) { console.error(`ABORT: expected 1 row, got ${r.rowsAffected}`); process.exit(1); }
  console.log("MNFR-6 sizes set");
}

main().catch((e) => { console.error(e); process.exit(1); });
