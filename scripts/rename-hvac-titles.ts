import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// HVAC-only title tweaks: shorter FR button-up title so it fits the catalog card
// ("Long Sleeve" -> "LS"), and "Duck" added to the insulated bib and jacket.
// Each rename only applies if the title is still the old one, so re-running is safe.
const renames = [
  { sku: "MNFR-2", from: "Carhartt FR Long Sleeve Button-Up Shirt - Light Blue", to: "Carhartt FR LS Button-Up Shirt - Light Blue" },
  { sku: "MNFR-5", from: "Carhartt FR Insulated Bib - Navy", to: "Carhartt FR Duck Insulated Bib - Navy" },
  { sku: "MNFR-6", from: "Carhartt FR Insulated Jacket - Navy", to: "Carhartt FR Duck Insulated Jacket - Navy" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const r of renames) {
    const res = await db.execute({
      sql: "UPDATE products SET name = ? WHERE vendor = 'modernniagara' AND sku = ? AND name = ?",
      args: [r.to, r.sku, r.from],
    });
    console.log(`${r.sku}: ${res.rowsAffected ? "renamed" : "already up to date"} -> ${r.to}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
