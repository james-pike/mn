import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Full feature lists for the FR Insulated Bib (MNFR-5) and FR Insulated Jacket
// (MNFR-6), from Carhartt's spec sheets for #101626 and #101618 (as listed by
// retailers). `details` is a comma-separated list the product page shows as
// bullets, ending with the style code; no commas inside a bullet, and each
// short enough to stay on one line.
const VENDOR = "modernniagara";
const updates = [
  {
    sku: "MNFR-5",
    material: "13 oz 100% cotton FR duck / 11.5 oz FR quilted twill lining / FR modacrylic insulation",
    details: [
      "Built for warmth in severe cold",
      "11.5 oz FR quilted lining with insulation",
      "Meets NFPA 70E requirements",
      "UL classified to NFPA 2112",
      "Carhartt FR and CAT 4 labels on pocket",
      "High back with FR suspenders and buckles",
      "Multi-compartment bib pocket",
      "Two lower-front and two back pockets",
      "Double knees with knee-pad openings",
      "Ankle-to-thigh brass leg zips",
      "Nomex zip tape with snap-closed flaps",
      "#101626",
    ].join(", "),
  },
  {
    sku: "MNFR-6",
    material: "13 oz 100% cotton FR duck / 11.5 oz FR quilted twill lining / FR modacrylic insulation",
    details: [
      "Arc rating CAT 4 (ATPV 54.3 cal/cm²)",
      "Meets NFPA 70E requirements",
      "UL classified to NFPA 2112",
      "11.5 oz FR quilted lining with batting",
      "Two-way brass zipper with Nomex tape",
      "Arc-protective storm flaps",
      "Two inside hook-and-loop pockets",
      "Nomex inside waist drawcord",
      "Nomex rib-knit storm cuffs",
      "Under-collar snaps for optional FR hood",
      "Carhartt FR and CAT 4 chest labels",
      "#101618",
    ].join(", "),
  },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const u of updates) {
    const r = await db.execute({
      sql: "UPDATE products SET material = ?, details = ? WHERE vendor = ? AND sku = ?",
      args: [u.material, u.details, VENDOR, u.sku],
    });
    if (r.rowsAffected !== 1) { console.error(`ABORT: expected 1 row for ${u.sku}, got ${r.rowsAffected}`); process.exit(1); }
  }
  const rows = await db.execute({ sql: "SELECT sku, material, details FROM products WHERE vendor = ? AND sku IN ('MNFR-5','MNFR-6')", args: [VENDOR] });
  for (const r of rows.rows) console.log(r.sku, "\n  material:", r.material, "\n  details:", r.details);
}

main().catch((e) => { console.error(e); process.exit(1); });
