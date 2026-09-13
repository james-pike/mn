import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();
const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});
// Round two Electrical-division prices to whole dollars.
const updates: [string, number][] = [
  ["MN-38", 79],  // Carhartt FR Force Dearborn LS Tee (#100235) — was 79.99
  ["MN-37", 239], // Carhartt FR Full Zip Hoodie (#104982) — was 239.99
];
for (const [sku, price] of updates) {
  const b = await db.execute({ sql: "SELECT sku, name, price FROM products WHERE vendor='modernniagara' AND sku=?", args: [sku] });
  if (b.rows.length !== 1) { console.error(`ABORT: ${sku} matched ${b.rows.length} rows`); process.exit(1); }
  console.log(`Before: ${sku} ${b.rows[0].name} = $${b.rows[0].price}`);
  await db.execute({ sql: "UPDATE products SET price=? WHERE vendor='modernniagara' AND sku=?", args: [price, sku] });
  const a = await db.execute({ sql: "SELECT price FROM products WHERE vendor='modernniagara' AND sku=?", args: [sku] });
  console.log(`After:  ${sku} = $${a.rows[0].price}`);
}
