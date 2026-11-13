import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const NAVY = "#2c3e50";

// Re-adds the two FR items the old mn Safety login carried (MNFR-1 pants,
// MNFR-4 full zip) for the HVAC login. Category "Flame Resistant" with no
// `portals`: the Service catalog hides that whole category and Electrical only
// shows its own tagged SKUs, so neither of those logins sees them. HVAC picks
// them up through isSafetyProduct() (every MNFR-* SKU). Data and images are the
// old mn entries; images already live in public/sku.
const products = [
  {
    sku: "MNFR-1",
    name: "Carhartt FR Rigby Pants - Navy",
    category: "Flame Resistant",
    sizes: "S - 4XL", // the product page shows its waist/inseam runs instead
    colors: [NAVY],
    price: 159,
    img: "/sku/FRpants.png",
    imgs: ["/sku/FRpants.png"],
    material: "9 oz 98% cotton / 2% spandex canvas with Rugged Flex stretch",
    details:
      "Flame-resistant, NFPA 70E and UL classified to NFPA 2112, relaxed fit, straight leg, phone and utility pockets, OEKO-TEX Standard 100, #104204",
    sort_order: 56,
    code: "104204",
  },
  {
    sku: "MNFR-4",
    name: "Carhartt FR Full Zip Hoodie - Navy",
    category: "Flame Resistant",
    sizes: "S - 4XL",
    colors: [NAVY],
    price: 239.99,
    img: "/sku/FRfullzip.png",
    imgs: ["/sku/FRfullzip.png"],
    material: "10.5 oz 40% cotton / 35% modacrylic / 15% viscose / 8% aramid / 2% antistat FR fleece",
    details:
      "Full-zip hood with adjustable drawcord, Vislon zip with Nomex tape, flame-resistant (meets NFPA 70E, ASTM F1506, UL classified to NFPA 2112), Force sweat-wicking, FastDry, #104982",
    sort_order: 57,
    code: "104982",
  },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  for (const p of products) {
    const existing = await db.execute({ sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?", args: [VENDOR, p.sku] });
    if (existing.rows.length > 0) { console.error(`ABORT: ${p.sku} already exists for ${VENDOR}.`); process.exit(1); }
  }

  for (const p of products) {
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor, code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.sku, p.name, p.category, p.sizes, "",
        JSON.stringify(p.colors), p.price,
        p.img, JSON.stringify(p.imgs),
        p.material, p.details, null, p.sort_order, VENDOR, p.code,
      ],
    });
  }

  const rows = await db.execute({
    sql: "SELECT sku, name, category, sizes, price, img, sort_order, vendor, code, portals FROM products WHERE vendor = ? AND sku IN ('MNFR-1', 'MNFR-4')",
    args: [VENDOR],
  });
  console.log("Inserted:");
  console.log(JSON.stringify(rows.rows, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
