import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift lineup: products with a model photo open on it, not a flat/form shot.
// SanMar has one model photo per style (in one colour), so that colour becomes
// the default (first) colour and its model photo leads the gallery. NKFD9742's
// only model photo is a discontinued colour, so it keeps its flat default.
// Data: scripts/gift-model-defaults-2026-11-25.json. Usage: tsx scripts/set-gift-model-defaults.ts
const U: Record<string, { colors: string[]; img: string; imgs: string[] }> =
  JSON.parse(readFileSync(new URL("./gift-model-defaults-2026-11-25.json", import.meta.url), "utf8"));

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [sku, u] of Object.entries(U)) {
    await db.execute({
      sql: "UPDATE products SET colors = ?, img = ?, imgs = ? WHERE vendor = 'modernniagara' AND sku = ?",
      args: [JSON.stringify(u.colors), u.img, JSON.stringify(u.imgs), sku],
    });
    console.log(sku, "->", u.img);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
