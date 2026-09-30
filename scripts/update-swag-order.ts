import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
// Swag tail order: the two golf bags together, then the two ball sets, then towel.
const ORDER: [string, number][] = [
  ["MN-26", 61], // Srixon Premium Golf Cart Bag (bag)
  ["MN-28", 62], // Nomad Air Stand Bag (bag)
  ["MN-27", 63], // Srixon Q-Star Tour Golf Balls (balls)
  ["MN-30", 64], // Titleist Pro V1 Golf Balls (balls)
  ["MN-29", 65], // Microfiber Waffle Towel (towel)
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [sku, sort] of ORDER) {
    await db.execute({ sql: "UPDATE products SET sort_order=? WHERE vendor=? AND sku=?", args: [sort, VENDOR, sku] });
    console.log(`${sku} -> sort_order ${sort}`);
  }
  const rows = await db.execute({ sql: "SELECT sku,name,sort_order FROM products WHERE vendor=? AND sort_order BETWEEN 55 AND 70 ORDER BY sort_order", args: [VENDOR] });
  console.log("\nSwag tail now:");
  for (const r of rows.rows) console.log(" ", r.sort_order, r.sku, r.name);
}
main().catch((e) => { console.error(e); process.exit(1); });
