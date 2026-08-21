import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// Move the two Travis Mathew Heater polos out of Polos and into the SWAG
// section for the modernniagara storefront.
const SKUS = ["MN-32", "MN-33"];

async function main() {
  const before = await db.execute(
    `SELECT sku, name, category FROM products WHERE vendor='modernniagara' AND sku IN (${SKUS.map(() => "?").join(",")})`,
    SKUS,
  );
  console.log("Before:\n" + JSON.stringify(before.rows, null, 2));

  const res = await db.execute({
    sql: `UPDATE products SET category='SWAG' WHERE vendor='modernniagara' AND sku IN (${SKUS.map(() => "?").join(",")})`,
    args: SKUS,
  });
  console.log(`\nRows affected: ${res.rowsAffected}`);

  const after = await db.execute(
    `SELECT sku, name, category FROM products WHERE vendor='modernniagara' AND sku IN (${SKUS.map(() => "?").join(",")})`,
    SKUS,
  );
  console.log("\nAfter:\n" + JSON.stringify(after.rows, null, 2));
}
main().then(() => process.exit(0));
