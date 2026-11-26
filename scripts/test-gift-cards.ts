import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname });

// Test gift cards for trying the Milestone Awards (gift portal) checkout.
//   MN-TEST-500  — $500 balance  → covers most orders: payment shows "Gift card"
//   MN-TEST-0    — $0 balance    → never covers: payment shows "Gift card + credit card"
// Holder name "Genevieve Tremblay" (fills in on Apply). NOTE: the gift_cards table is the
// live database, so these codes also work on the deployed site — delete them
// before real use:  tsx scripts/test-gift-cards.ts --delete
// Re-running without --delete resets both balances.
// Usage: tsx scripts/test-gift-cards.ts [--delete]
const CARDS: [string, number][] = [["MN-TEST-500", 500], ["MN-TEST-0", 0]];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;
  if (!url) { console.error("Missing TURSO_URL"); process.exit(1); }
  const db = createClient({ url, authToken });
  for (const [code, bal] of CARDS) {
    await db.execute({ sql: "DELETE FROM gift_cards WHERE code = ? AND vendor = 'modernniagara'", args: [code] });
    if (process.argv.includes("--delete")) { console.log("deleted", code); continue; }
    await db.execute({
      sql: `INSERT INTO gift_cards (code, balance, initial_balance, active, note, vendor, first_name, last_name)
            VALUES (?, ?, ?, 1, 'test card (scripts/test-gift-cards.ts)', 'modernniagara', 'Genevieve', 'Tremblay')`,
      args: [code, bal, bal],
    });
    console.log("ready", code, `$${bal}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
