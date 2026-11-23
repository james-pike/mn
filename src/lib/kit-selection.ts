// Electrical kit: the sizes chosen for each kit item, shared between the kit
// cards (gallery) and the product pages, so a size picked on a product page
// shows in that product's card (and the other way round). Browser-only
// (localStorage); callers run it from visible tasks / handlers.
export type KitSel = { size?: string; fit?: string; waist?: string; length?: string };
const KEY = "mn_kit_sel";

export function readKitSel(): Record<string, KitSel> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; }
}
/** Save one item's sizes. `silent` skips the "kit-sel-updated" event — used
 *  when the kit cards mirror their own picks (announcing those made the cards
 *  re-read half-written storage and snap other items back to old sizes). */
export function writeKitSel(sku: string, v: KitSel, silent = false) {
  try {
    const all = readKitSel();
    const clean: KitSel = {};
    for (const k of ["size", "fit", "waist", "length"] as const) if (v[k]) clean[k] = v[k];
    all[sku] = clean;
    localStorage.setItem(KEY, JSON.stringify(all));
    if (!silent) window.dispatchEvent(new CustomEvent("kit-sel-updated"));
  } catch { /* storage unavailable */ }
}
