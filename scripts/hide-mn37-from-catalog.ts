import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// MN-37 (Atlas Guardian FR/AR Hoodie) should show on NEITHER site: it's not in
// the Electrical lineup (ELECTRICAL_SKUS in product-catalog.tsx) and it must not
// appear in the Service catalog either. The Service grid excludes every product
// whose category is "Flame Resistant" (see product-catalog.tsx), so re-tagging
// MN-37 from "Sweaters" to "Flame Resistant" hides it from Service while it
// stays out of Electrical — leaving it displayed nowhere. Reversible: set the
// category back to "Sweaters" to restore it. (products.ts is regenerated from
// this DB on every build, so the DB is the source of truth.)
const SKU = "MN-37";

async function main() {
  const before = await db.execute({
    sql: "SELECT sku, name, category FROM products WHERE vendor='modernniagara' AND sku=?",
    args: [SKU],
  });
  if (before.rows.length !== 1) {
    console.error(`ABORT: expected exactly 1 row for ${SKU}, found ${before.rows.length}.`);
    process.exit(1);
  }
  console.log("Before:\n" + JSON.stringify(before.rows, null, 2));

  await db.execute({
    sql: "UPDATE products SET category='Flame Resistant' WHERE vendor='modernniagara' AND sku=?",
    args: [SKU],
  });

  const after = await db.execute({
    sql: "SELECT sku, name, category FROM products WHERE vendor='modernniagara' AND sku=?",
    args: [SKU],
  });
  console.log("\nAfter:\n" + JSON.stringify(after.rows, null, 2));
}

main().then(() => process.exit(0));
