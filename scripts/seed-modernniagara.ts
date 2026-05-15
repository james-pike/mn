import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";
const NAVY = "#2c3e50";
const LIGHT_BLUE = "#7dd3fc";
const BLACK = "#1a1a18";
const SOLACE_BLUE = "#6b8bb0";

type Seed = {
  sku: string;
  name: string;
  category: string;
  sizes: string;
  colors: string[];
  price: number;
  details: string;
};

const seeds: Seed[] = [
  // FR Workwear
  { sku: "MNFR-1", name: "FR Pants", category: "FR Workwear", sizes: "S - 4XL", colors: [NAVY], price: 159.00, details: "Fire-resistant, #104204" },
  { sku: "MNFR-2", name: "FR Long Sleeve Button-Up Shirt", category: "FR Workwear", sizes: "S - 4XL", colors: [LIGHT_BLUE], price: 124.99, details: "Fire-resistant, #FRS160" },
  { sku: "MNFR-3", name: "FR Pullover Hoodie", category: "FR Workwear", sizes: "S - 4XL", colors: [NAVY], price: 214.99, details: "Fire-resistant, #104983" },
  { sku: "MNFR-4", name: "FR Full Zip Hoodie", category: "FR Workwear", sizes: "S - 4XL", colors: [NAVY], price: 239.99, details: "Fire-resistant, #104982" },
  { sku: "MNFR-5", name: "FR Insulated Bib", category: "FR Workwear", sizes: "S - 4XL", colors: [NAVY], price: 380.00, details: "Fire-resistant, #101626" },
  { sku: "MNFR-6", name: "FR Insulated Jacket", category: "FR Workwear", sizes: "S - 4XL", colors: [NAVY], price: 290.00, details: "Fire-resistant, #101618" },
  // Regular MN apparel
  { sku: "MN-1",  name: "Pants",                       category: "Pants",     sizes: "S - 4XL",  colors: [NAVY], price: 69.99,  details: "#102291" },
  { sku: "MN-2",  name: "Long Sleeve Shirt",           category: "Shirts",    sizes: "S - 4XL",  colors: [NAVY], price: 59.99,  details: "#K126" },
  { sku: "MN-3",  name: "Short Sleeve T-Shirt",        category: "T-Shirts",  sizes: "S - 4XL / LT - 4XLT", colors: [NAVY], price: 13.50,  details: "#2000 / #2000T" },
  { sku: "MN-5",  name: "Ball Cap",                    category: "Caps",      sizes: "One Size", colors: [NAVY], price: 23.50,  details: "#i8502" },
  { sku: "MN-6",  name: "Toque",                       category: "Caps",      sizes: "One Size", colors: [NAVY], price: 33.99,  details: "#A18" },
  { sku: "MN-7",  name: "Winter Jacket",               category: "Jackets",   sizes: "S - 4XL",  colors: [NAVY], price: 198.49, details: "#106674" },
  { sku: "MN-8",  name: "Winter Bibs",                 category: "Work Wear", sizes: "S - 4XL",  colors: [NAVY], price: 189.99, details: "#106672" },
  { sku: "MN-9",  name: "Pullover Hoodie",             category: "Hoodies",   sizes: "S - 4XL",  colors: [NAVY], price: 74.99,  details: "#K121" },
  { sku: "MN-10", name: "Full Zip Hoodie",             category: "Hoodies",   sizes: "S - 4XL",  colors: [NAVY], price: 89.99,  details: "#K122" },
  // SWAG
  { sku: "MN-11", name: "Men's Speckle Print Polo",    category: "SWAG",      sizes: "S - 3XL",  colors: [SOLACE_BLUE, NAVY, BLACK], price: 0, details: "FootJoy, #16324" },
  { sku: "MN-12", name: "Women's Speckle Print Polo",  category: "SWAG",      sizes: "XS - 2XL", colors: [SOLACE_BLUE, BLACK],       price: 0, details: "FootJoy, #96324" },
  { sku: "MN-13", name: "Yeti Rambler Straw Mug",      category: "SWAG",      sizes: "25 oz / 35 oz / 42 oz", colors: [NAVY],     price: 0, details: "YETI Rambler® Straw Mug" },
  { sku: "MN-14", name: "Yeti Tundra Cooler",          category: "SWAG",      sizes: "35L / 45L", colors: [NAVY],     price: 0, details: "YETI Tundra® Hard Cooler" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  const existing = await db.execute({
    sql: "SELECT sku FROM products WHERE vendor = ?",
    args: [VENDOR],
  });
  const existingSkus = new Set(existing.rows.map((r: any) => String(r.sku)));
  console.log(`Existing ${VENDOR} products in DB: ${existingSkus.size}`);

  const maxOrder = await db.execute("SELECT COALESCE(MAX(sort_order), -1) AS m FROM products");
  let nextOrder = Number((maxOrder.rows[0] as any).m) + 1;

  let inserted = 0;
  let skipped = 0;
  for (const s of seeds) {
    if (existingSkus.has(s.sku)) {
      console.log(`  skip ${s.sku} (already exists)`);
      skipped++;
      continue;
    }
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, vendor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.sku, s.name, s.category, s.sizes, "",
        JSON.stringify(s.colors), s.price,
        "", JSON.stringify([]),
        "", s.details, null, nextOrder, VENDOR,
      ],
    });
    console.log(`  insert ${s.sku} — ${s.name} ($${s.price.toFixed(2)}) sort_order=${nextOrder}`);
    nextOrder++;
    inserted++;
  }
  console.log(`Done: ${inserted} inserted, ${skipped} skipped.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
