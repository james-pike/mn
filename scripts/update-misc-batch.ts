import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  // Cooler (MN-17, B0000558) -> $85
  await db.execute({ sql: "UPDATE products SET price=? WHERE vendor=? AND sku=?", args: [85, VENDOR, "MN-17"] });
  // K126 long-sleeve (MN-2) -> $60, and drop the wrong sleeve alt image
  const before = await db.execute({ sql: "SELECT img, imgs FROM products WHERE vendor=? AND sku=?", args: [VENDOR, "MN-2"] });
  const imgs = JSON.parse((before.rows[0]?.imgs as string) || "[]").filter((s: string) => !/sleeve/i.test(s));
  await db.execute({ sql: "UPDATE products SET price=?, imgs=? WHERE vendor=? AND sku=?", args: [60, JSON.stringify(imgs), VENDOR, "MN-2"] });

  const rows = await db.execute({ sql: "SELECT sku,name,price,imgs FROM products WHERE vendor=? AND sku IN ('MN-17','MN-2')", args: [VENDOR] });
  for (const r of rows.rows) console.log(r.sku, "$" + r.price, r.name, "imgs=" + r.imgs);
}
main().catch((e) => { console.error(e); process.exit(1); });
