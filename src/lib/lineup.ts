// Which products each storefront login shows. Shared by the catalog, the
// product route guard and the layout's menu drawer so all three always agree.
import { isSafetyProduct } from "./hvac";

// Electrical portal: shows ONLY these SKUs (the small Electrical-division lineup).
// Add/replace the Electrical SKU codes here — order is preserved in the grid.
// MN-36 = Carhartt FR Rigby Pants (104204), MN-37 = Carhartt FR Full Zip Hoodie
// (104982) — renamed off the old MNFR- prefix to match the catalog's MN- numbering.
// The FR Dearborn LS Tee (100235) isn't in the catalog yet — add it to the DB,
// then drop its SKU in here.
// Display order: T-Shirts, Sweaters, Pants, Headwear (desktop moves the pants
// second with CSS — see kit-panel.css).
export const ELECTRICAL_SKUS: string[] = ["MN-38", "MN-40", "MN-36", "MN-39"];
export const ELECTRICAL_SKU_SET = new Set(ELECTRICAL_SKUS);

// Is a SKU part of the given login's catalogue lineup? Mirrors `baseProducts` in
// the product catalog, as a pure function the route guard and menu reuse —
// keeping direct-URL access in lockstep with what each login can browse.
export const isSkuInLineup = (
  loginType: string | null,
  product: { sku: string; category: string; portals?: string[] },
): boolean => {
  const { sku, category } = product;
  if (loginType === "electrical")
    return !!product.portals?.includes("electrical") || ELECTRICAL_SKUS.includes(sku);
  if (loginType === "tech") return category === "Work Wear";
  if (loginType === "hvac") return isSafetyProduct(sku); // HVAC login: the FR-workwear lineup
  // Gift (Milestone Awards): ONLY products flagged portals ∋ "gift" (DB-driven).
  if (loginType === "gift") return !!product.portals?.includes("gift");
  // Clothing / Service (default): everything except FR, Electrical-only and Gift-only SKUs.
  return category !== "Flame Resistant" && !ELECTRICAL_SKUS.includes(sku) && !product.portals?.includes("gift");
};

// Electrical portal ordering rules: no prices shown anywhere, no PO number, and
// every order is the same kit — each product's quantity is fixed (adding it
// again replaces its line; the cart has no +/- for it).
export const ELECTRICAL_FIXED_QTY: Record<string, number> = {
  "MN-36": 4, // Carhartt FR Rigby Pants
  "MN-38": 3, // Carhartt FR Force Dearborn LS T-Shirt
  "MN-40": 2, // Atlas Guardian FR/AR 1/4 Zip Hoodie
  "MN-39": 1, // Flexfit Embroidered Cap
};
/** Logins that never see prices (cards, product page, cart, checkout, email). */
export const hidesPrices = (loginType: string | null | undefined): boolean =>
  loginType === "tech" || loginType === "electrical";
/** Logins that check out without a PO number. */
export const poOptional = (loginType: string | null | undefined): boolean =>
  loginType === "electrical";
/** Fixed order quantity for a SKU on this login, or null when it's free. */
export const fixedQtyFor = (loginType: string | null | undefined, sku: string | undefined): number | null =>
  loginType === "electrical" && sku ? ELECTRICAL_FIXED_QTY[sku] ?? null : null;

// Every Electrical order is the complete kit: all four items, at the fixed
// quantities above. Short labels for the "still to add" note.
export const ELECTRICAL_KIT_LABELS: Record<string, string> = {
  "MN-36": "4 Pants",
  "MN-38": "3 Shirts",
  "MN-40": "2 Hoodies",
  "MN-39": "1 Cap",
};
/** Kit items still missing from the cart (labels), or [] when complete / not a kit login. */
export const kitMissing = (loginType: string | null | undefined, skus: (string | undefined)[]): string[] =>
  loginType === "electrical"
    ? Object.keys(ELECTRICAL_FIXED_QTY).filter((s) => !skus.includes(s)).map((s) => ELECTRICAL_KIT_LABELS[s])
    : [];

// Electrical orders all ship to Modern Niagara Toronto (shown read-only at
// checkout and enforced by the order action). "Attn" shows on the checkout's
// Ship To only — the order / confirmation email carry just the street.
export const ELECTRICAL_SHIP_TO = {
  label: "Modern Niagara Building Services - Toronto",
  attn: "Attn: Laurie Sousa",
  street: "8125 Highway 50",
  address1: "8125 Highway 50",
  city: "Vaughan",
  province: "ON",
  postal: "L4H 4S6",
};
/** Electrical order-summary order: shirts, pants, hoodie, cap. */
export const ELECTRICAL_SUMMARY_ORDER = ["MN-38", "MN-36", "MN-40", "MN-39"];
