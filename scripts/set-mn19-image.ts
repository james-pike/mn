import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

const SKU = "MN-19"; // Women's Soft Shell Jacket, Port Authority #L7603
const NEW_IMG = "/l7603_blackheather_modl_studio3.webp";
const OLD_IMG = "/sku/women-jacket.jpg";

const before = await db.execute({
  sql: "SELECT sku, name, img, imgs FROM products WHERE vendor='modernniagara' AND sku=?",
  args: [SKU],
});
console.log("Before:");
for (const r of before.rows as any[]) console.log(`  ${r.sku} img=${r.img} imgs=${r.imgs}`);

if (before.rows.length !== 1) {
  console.error(`ABORT: expected exactly 1 row for ${SKU}, found ${before.rows.length}.`);
  process.exit(1);
}

const current = JSON.parse((before.rows[0] as any).imgs || "[]") as string[];
const rest = current.filter((p) => p !== NEW_IMG);
const newImgs = [NEW_IMG, ...rest];
if (!newImgs.includes(OLD_IMG)) newImgs.splice(1, 0, OLD_IMG);

await db.execute({
  sql: "UPDATE products SET img=?, imgs=? WHERE vendor='modernniagara' AND sku=?",
  args: [NEW_IMG, JSON.stringify(newImgs), SKU],
});

const after = await db.execute({
  sql: "SELECT sku, name, img, imgs FROM products WHERE vendor='modernniagara' AND sku=?",
  args: [SKU],
});
console.log("After:");
for (const r of after.rows as any[]) console.log(`  ${r.sku} img=${r.img} imgs=${r.imgs}`);
