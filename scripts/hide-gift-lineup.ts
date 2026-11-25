import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";

config({ path: new URL("../.env", import.meta.url).pathname });

// Milestone Awards (gift portal): clear out the whole live lineup ahead of a new
// set of products. Gift-only products are hidden (products.hidden = 1, reversible
// in cm-admin); products shared with Service (Carhartt LS, ball cap, toque, towel)
// only lose their "gift" portal so they stay on Service. Staged rows (Core365,
// portals ∋ "staging") are left alone. Everything changed is recorded in
// scripts/gift-lineup-hidden.json; `--restore` puts it all back.
// Usage: tsx scripts/hide-gift-lineup.ts [--restore]
const VENDOR = "modernniagara";
const LOG = new URL("./gift-lineup-hidden.json", import.meta.url).pathname;

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });

  if (process.argv.includes("--restore")) {
    const log = JSON.parse(readFileSync(LOG, "utf8"));
    for (const sku of log.hidden) await db.execute({ sql: "UPDATE products SET hidden = 0 WHERE vendor = ? AND sku = ?", args: [VENDOR, sku] });
    for (const [sku, portals] of Object.entries(log.portals)) await db.execute({ sql: "UPDATE products SET portals = ? WHERE vendor = ? AND sku = ?", args: [portals as string, VENDOR, sku] });
    console.log("restored", log.hidden.length, "hidden +", Object.keys(log.portals).length, "portal changes");
    return;
  }
  if (existsSync(LOG)) { console.error("gift-lineup-hidden.json exists — already hidden? (use --restore first)"); process.exit(1); }
  const r = await db.execute({ sql: "SELECT sku, portals, hidden FROM products WHERE vendor = ? AND portals LIKE '%\"gift\"%'", args: [VENDOR] });
  const log = { date: new Date().toISOString(), hidden: [] as string[], portals: {} as Record<string, string> };
  for (const row of r.rows as any[]) {
    const portals: string[] = JSON.parse(String(row.portals));
    if (portals.includes("staging") || row.hidden) continue;
    if (portals.includes("service")) {
      log.portals[row.sku] = String(row.portals);
      await db.execute({ sql: "UPDATE products SET portals = ? WHERE vendor = ? AND sku = ?", args: [JSON.stringify(portals.filter((p) => p !== "gift")), VENDOR, row.sku] });
    } else {
      log.hidden.push(row.sku);
      await db.execute({ sql: "UPDATE products SET hidden = 1 WHERE vendor = ? AND sku = ?", args: [VENDOR, row.sku] });
    }
  }
  writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n");
  console.log("hidden", log.hidden.length, "| gift tag removed from", Object.keys(log.portals).join(", "));
}
main().catch((e) => { console.error(e); process.exit(1); });
