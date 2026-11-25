import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Gift portal bags: show the capacity in the size slot instead of "One Size"
// (and not in the title). Nike 27L from its SanMar listing; Herschel Retreat 23L
// (herschel.ca); Herschel Classic Gym Bag 27L (retailer listings — Herschel has
// delisted it). The $50 crossbody tote stays "One Size" (no published capacity).
// Usage: tsx scripts/set-gift-bag-capacities.ts
const BAGS: [string, string, string | null][] = [
  ["MN-146", "One Size", null], // crossbody tote: no capacity listed anywhere for it — keep "One Size"
  ["MN-150", "27L", "Nike Utility Speed Backpack 2.0"],
  ["MN-151", "27L", null],
  ["MN-154", "23L", null],
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [sku, size, name] of BAGS) {
    await db.execute(name
      ? { sql: "UPDATE products SET sizes = ?, name = ? WHERE vendor = 'modernniagara' AND sku = ?", args: [size, name, sku] }
      : { sql: "UPDATE products SET sizes = ? WHERE vendor = 'modernniagara' AND sku = ?", args: [size, sku] });
    console.log(sku, size, name ?? "");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
