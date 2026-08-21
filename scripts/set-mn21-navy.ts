import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// MN-21 (Mardi Gras Magic Pen): change the swatch / cart colour option from
// sky blue (#00b5e2) to Navy (#2c3e50, labelled "Navy"/"Marine" in products.ts).
const NAVY = "#2c3e50";

async function main() {
  const before = await db.execute("SELECT sku, name, colors FROM products WHERE vendor='modernniagara' AND sku='MN-21'");
  console.log("Before:\n" + JSON.stringify(before.rows, null, 2));

  await db.execute({
    sql: "UPDATE products SET colors = ? WHERE vendor='modernniagara' AND sku='MN-21'",
    args: [JSON.stringify([NAVY])],
  });

  const after = await db.execute("SELECT sku, name, colors FROM products WHERE vendor='modernniagara' AND sku='MN-21'");
  console.log("\nAfter:\n" + JSON.stringify(after.rows, null, 2));
}
main().then(() => process.exit(0));
