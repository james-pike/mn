import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal: each gift card carries its holder's name, so entering the code
// at checkout fills in the employee's first + last name (no name fields).
// Additive, nullable columns — other vendors' cards (e.g. Wills) are unaffected.
// Usage: tsx scripts/add-giftcard-names.ts
async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const cols = (await db.execute("PRAGMA table_info(gift_cards)")).rows.map((r: any) => String(r.name));
  for (const c of ["first_name", "last_name"]) {
    if (cols.includes(c)) { console.log(`skip ${c} (exists)`); continue; }
    await db.execute(`ALTER TABLE gift_cards ADD COLUMN ${c} TEXT`);
    console.log("added", c);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
