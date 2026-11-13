import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// FR Insulated Bib (MNFR-5, Carhartt 101626) is sold by waist x length, not
// S-4XL. Dark Navy: W30-W44 and W48 (no W46), L30-L36. The product page's
// waist/length picker lists the exact runs (product-detail.tsx); this is the
// summary shown on the catalog card.
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const r = await db.execute({ sql: "UPDATE products SET sizes = ? WHERE vendor = 'modernniagara' AND sku = 'MNFR-5'", args: ["W30 - W48 / L30 - L36"] });
  if (r.rowsAffected !== 1) { console.error(`ABORT: expected 1 row, got ${r.rowsAffected}`); process.exit(1); }
  console.log("MNFR-5 sizes set");
}

main().catch((e) => { console.error(e); process.exit(1); });
