import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Point the HVAC jacket and full zip at their logo-baked images under NEW file
// names. Same-name replacements stayed stale: public/_headers lets Cloudflare and
// browsers cache images for 30 days, so a new name is what forces a fresh fetch.
const VENDOR = "modernniagara";
const updates = [
  { sku: "MNFR-6", img: "/sku/FRjacket-logo.png" },
  { sku: "MNFR-4", img: "/sku/FRfullzip-logo.png" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const u of updates) {
    const r = await db.execute({ sql: "UPDATE products SET img = ?, imgs = ? WHERE vendor = ? AND sku = ?", args: [u.img, JSON.stringify([u.img]), VENDOR, u.sku] });
    if (r.rowsAffected !== 1) { console.error(`ABORT: expected 1 row for ${u.sku}, got ${r.rowsAffected}`); process.exit(1); }
    console.log(`${u.sku} -> ${u.img}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
