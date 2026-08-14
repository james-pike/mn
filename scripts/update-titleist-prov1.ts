import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// Repurpose the retired Wilson Ultra Distance slot (MN-30) as the Titleist Pro V1.
const update = {
  vendor: "modernniagara",
  sku: "MN-30",
  name: "Titleist Pro V1 Golf Balls (12)",
  sizes: "Pack of 12",
  badge: "",
  colors: JSON.stringify(["#ffffff"]),
  price: 75,
  img: "/Titleist-Pro-V1-Golf-Balls-2025-Model-White.webp",
  imgs: JSON.stringify([
    "/Titleist-Pro-V1-Golf-Balls-2025-Model-White.webp",
    "/Titleist-Pro-V1-Golf-Balls-2025.webp",
  ]),
  material: "",
  details: [
    "New faster high-gradient core",
    "Soft cast urethane elastomer cover",
    "Spherically-tiled 388 tetrahedral dimple design",
    "Speed-amplifying high-flex casing layer",
    "Soft 87 compression rating",
  ].join(", "),
};

async function main() {
  const res = await db.execute({
    sql: `UPDATE products
          SET name = ?, sizes = ?, badge = ?, colors = ?, price = ?, img = ?, imgs = ?, material = ?, details = ?
          WHERE sku = ? AND vendor = ?`,
    args: [
      update.name,
      update.sizes,
      update.badge,
      update.colors,
      update.price,
      update.img,
      update.imgs,
      update.material,
      update.details,
      update.sku,
      update.vendor,
    ],
  });
  console.log("Rows affected:", res.rowsAffected);

  const check = await db.execute({
    sql: "SELECT id, sku, name, category, sizes, price, img, imgs, details FROM products WHERE sku = ? AND vendor = ?",
    args: [update.sku, update.vendor],
  });
  console.log("Updated row:");
  console.log(JSON.stringify(check.rows, null, 2));
}

main();
