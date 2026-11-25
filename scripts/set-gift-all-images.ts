import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift lineup: every public image from each source link, not just front/back.
// Adds the Nike backpack's left/right/interior views, the Herschel Retreat's
// straight-on navy front, and the S&S flat shots (front / detail / back) for
// Columbia 208855 and Adidas A588/A589 — each slotted after its colour's photos.
// Data: scripts/gift-imgs-all-2026-11-25.json (sku -> full imgs list).
// Usage: tsx scripts/set-gift-all-images.ts
const U: Record<string, string[]> = JSON.parse(readFileSync(new URL("./gift-imgs-all-2026-11-25.json", import.meta.url), "utf8"));

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [sku, imgs] of Object.entries(U)) {
    await db.execute({ sql: "UPDATE products SET imgs = ? WHERE vendor = 'modernniagara' AND sku = ?", args: [JSON.stringify(imgs), sku] });
    console.log(sku, imgs.length, "images");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
