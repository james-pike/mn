import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// Swap MN-21 (Mardi Gras Magic Pen) to the newly added pen image.
const NEW_IMG = "/pen-blank-navy-white.jpg";

async function main() {
  const before = await db.execute("SELECT sku, name, img, imgs FROM products WHERE vendor='modernniagara' AND sku='MN-21'");
  if (!before.rows.length) { console.log("MN-21 not found — aborting."); process.exit(1); }
  console.log("Before:\n" + JSON.stringify(before.rows, null, 2));

  await db.execute({
    sql: "UPDATE products SET img = ?, imgs = ? WHERE vendor='modernniagara' AND sku='MN-21'",
    args: [NEW_IMG, JSON.stringify([NEW_IMG])],
  });

  const after = await db.execute("SELECT sku, name, img, imgs FROM products WHERE vendor='modernniagara' AND sku='MN-21'");
  console.log("\nAfter:\n" + JSON.stringify(after.rows, null, 2));
}
main().then(() => process.exit(0));
