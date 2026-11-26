import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards: close the gap in the MN- numbers (2026-11-25).
//  1. Deletes the retired MN gift rows (hidden, or portals ∋ "staging") — the old
//     Puma/Adidas/Trimark/Gildan line and the unused Core365 lineup. All 163 MN
//     rows were saved first to db-backups/mn-products-before-renumber-2026-11-25.json.
//  2. Renumbers the live gift-only products to MN-42, MN-43, … in the gift
//     sidebar order (Fleece, Jackets, Polos, Bags, Hats; then sort_order).
//     MN-2..MN-41 (Service / Electrical, shared hats) and MNFR-* are unchanged.
// Dry run by default; --write applies it.
const VENDOR = "modernniagara";
const ORDER = ["Fleece", "Jackets", "Polos", "Bags", "Hats"];
const START = 42;
const WRITE = process.argv.includes("--write");
const num = (s: string) => parseInt(s.replace(/^MN-/, ""), 10);

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  const rows = (await db.execute({ sql: "SELECT id, sku, name, category, portals, hidden, sort_order FROM products WHERE vendor = ? AND sku LIKE 'MN-%'", args: [VENDOR] })).rows as any[];
  const portals = (r: any): string[] => (r.portals ? JSON.parse(r.portals) : []);
  const retired = rows.filter((r) => num(r.sku) >= START && (r.hidden || portals(r).includes("staging")));
  const gift = rows
    .filter((r) => !r.hidden && portals(r).includes("gift") && !portals(r).includes("staging") && !portals(r).includes("service"))
    .sort((a, b) => (ORDER.indexOf(a.category) + 1 || 99) - (ORDER.indexOf(b.category) + 1 || 99) || a.sort_order - b.sort_order || num(a.sku) - num(b.sku));
  // Anything else at/after MN-42 that's neither retired nor gift-only would collide.
  const other = rows.filter((r) => num(r.sku) >= START && !retired.includes(r) && !gift.includes(r));
  if (other.length) { console.error("Unexpected rows in range:", other.map((r) => r.sku)); process.exit(1); }
  const map = gift.map((r, i) => ({ id: r.id, from: r.sku as string, to: `MN-${START + i}`, name: r.name, cat: r.category }));
  console.log(`delete ${retired.length} retired rows: ${retired.map((r) => r.sku).join(" ")}`);
  for (const m of map) console.log(`${m.from.padEnd(7)} -> ${m.to.padEnd(7)} ${m.cat.padEnd(8)} ${m.name}`);
  console.log(`next new product: MN-${START + map.length}`);
  if (!WRITE) { console.log("(dry run — pass --write to apply)"); return; }
  const tx = await db.transaction("write");
  try {
    for (const r of retired) await tx.execute({ sql: "DELETE FROM products WHERE id = ?", args: [r.id] });
    // Two passes via temporary SKUs so no rename collides with another (sku is UNIQUE).
    for (const m of map) await tx.execute({ sql: "UPDATE products SET sku = ? WHERE id = ?", args: [`TMP-${m.to}`, m.id] });
    for (const m of map) await tx.execute({ sql: "UPDATE products SET sku = ?, updated_at = datetime('now') WHERE id = ?", args: [m.to, m.id] });
    await tx.commit();
    console.log("applied");
  } catch (e) { await tx.rollback(); throw e; }
}
main().catch((e) => { console.error(e); process.exit(1); });
