import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const BULLET = "Modern logo on sleeve (tone on tone)";

// Every Travis Mathew garment carries the tone-on-tone Modern sleeve logo, so the
// bullet belongs on all of them. MN-34/MN-35 already ship with it baked into
// their insert; this patches the pre-existing Heater polos. Idempotent — skips
// any row that already lists the bullet. `details` renders as comma-split
// bullets, so we append with a comma separator.
const SKUS = ["MN-32", "MN-33"];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  for (const sku of SKUS) {
    const res = await db.execute({
      sql: "SELECT details FROM products WHERE vendor = ? AND sku = ?",
      args: [VENDOR, sku],
    });
    if (res.rows.length === 0) { console.warn(`SKIP: ${sku} not found`); continue; }
    const details = String(res.rows[0].details ?? "");
    if (details.includes(BULLET)) { console.log(`OK (already present): ${sku}`); continue; }
    const updated = details.trim().length ? `${details.trim()}, ${BULLET}` : BULLET;
    await db.execute({
      sql: "UPDATE products SET details = ? WHERE vendor = ? AND sku = ?",
      args: [updated, VENDOR, sku],
    });
    console.log(`Updated ${sku}:\n  ${updated}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
