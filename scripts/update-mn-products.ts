import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

const VENDOR = "modernniagara";

type Update = {
  sku: string;
  material?: string;
  details?: string;
  img?: string;
  imgs?: string[];
};

const updates: Update[] = [
  {
    sku: "MN-2",
    material: "100% cotton jersey, 6.75 oz heavyweight",
    details: "Loose fit with dropped shoulders, rib-knit crewneck, side-seam construction, left-chest pocket with Carhartt patch, tagless neck label, #K126",
  },
  {
    sku: "MN-5",
    material: "Poly/spandex blend with performance mesh back",
    details: "Mid-profile structured trucker cap, shapeable pre-curved visor, UV protection, moisture wicking, 110 Technology® sweatband, adjustable plastic snapback, grey under visor, #i8502",
    img: "/sku/cap.png",
    imgs: ["/sku/cap.png"],
  },
  {
    sku: "MN-6",
    material: "100% acrylic rib knit",
    details: "Stretchy thick knit, fold-up cuff with Carhartt patch, one-size-fits-most, #A18",
    img: "/sku/toque.png",
    imgs: ["/sku/toque.png"],
  },
  {
    sku: "MN-7",
    material: "12 oz 100% ringspun cotton duck shell, quilted nylon lining, Arctic-weight polyester insulation",
    details: "Two-way brass zip, pleated bi-swing back, internal rib-knit storm cuffs, four exterior pockets, two interior pockets, triple-stitched seams, #106674",
    img: "/sku/winterjacket.jpeg",
    imgs: ["/sku/winterjacket.jpeg"],
  },
  {
    sku: "MN-9",
    material: "10.5 oz midweight 50% cotton / 50% polyester blend",
    details: "Three-piece hood with drawcord, rib-knit cuffs and waist, front handwarmer pocket, triple-stitched seams, Carhartt patch, #K121",
    img: "/sku/pulloverhoodie.png",
    imgs: ["/sku/pulloverhoodie.png"],
  },
  {
    sku: "MN-10",
    material: "10.5 oz midweight 50% cotton / 50% polyester blend",
    details: "Three-piece hood with drawcord, full-length brass zipper, rib-knit cuffs and waist, two front handwarmer pockets, Carhartt patch on pocket, loose fit, #K122",
    img: "/sku/fullziphoodie.png",
    imgs: ["/sku/fullziphoodie.png"],
  },
  {
    sku: "MN-3",
    material: "6 oz/yd² 100% US cotton, 18 singles",
    details: "Classic fit, rib collar, taped neck and shoulders, tear-away label, no optical brighteners for consistent dye adherence, OEKO-TEX and FLA certified, #2000",
    img: "/sku/tshirt.png",
    imgs: ["/sku/tshirt.png"],
  },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  let updated = 0;
  let missing = 0;
  for (const u of updates) {
    const row = await db.execute({
      sql: "SELECT sku FROM products WHERE vendor = ? AND sku = ?",
      args: [VENDOR, u.sku],
    });
    if (row.rows.length === 0) {
      console.log(`  missing ${u.sku} (no row in DB)`);
      missing++;
      continue;
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (u.material !== undefined) { sets.push("material = ?"); args.push(u.material); }
    if (u.details !== undefined)  { sets.push("details = ?");  args.push(u.details); }
    if (u.img !== undefined)      { sets.push("img = ?");      args.push(u.img); }
    if (u.imgs !== undefined)     { sets.push("imgs = ?");     args.push(JSON.stringify(u.imgs)); }
    if (sets.length === 0) continue;

    args.push(VENDOR, u.sku);
    await db.execute({
      sql: `UPDATE products SET ${sets.join(", ")} WHERE vendor = ? AND sku = ?`,
      args,
    });
    console.log(`  update ${u.sku}: ${sets.map((s) => s.split(" = ")[0]).join(", ")}`);
    updated++;
  }
  console.log(`Done: ${updated} updated, ${missing} missing.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
