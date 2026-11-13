// HVAC login lineup (the old mn "Safety" FR-workwear catalog): every MNFR-*
// item plus a small allowlist of standard SKUs. Shared by the catalog, the
// product page and the menu drawer so they always agree.
// SAFETY_HIDDEN_SKUS is a deny list for FR items we don't show yet.
export const SAFETY_SKU_PREFIX = "MNFR-";
export const SAFETY_EXTRA_SKUS = new Set(["MN-2", "MN-3", "MN-5", "MN-6"]);
export const SAFETY_HIDDEN_SKUS = new Set<string>(); // nothing hidden (the FR Insulated Bib & Jacket have photos now)
export const SAFETY_CATEGORIES = ["All", "Shirts", "Flame Resistant", "Hats"]; // Shirts shows as "T-Shirts", Hats as "Headwear"
// Explicit display order for the HVAC (FR) "All" view, following the sidebar:
// T-shirts (short-sleeve tee, long-sleeve shirt), then FR (shirt, hoodies,
// insulated jacket, pants, insulated bib), then headwear (ball cap, toque).
export const SAFETY_SKU_ORDER = ["MN-3", "MN-2", "MNFR-2", "MNFR-3", "MNFR-4", "MNFR-6", "MNFR-1", "MNFR-5", "MN-5", "MN-6"];
export const isSafetyProduct = (sku: string) =>
  !SAFETY_HIDDEN_SKUS.has(sku) && (sku.startsWith(SAFETY_SKU_PREFIX) || SAFETY_EXTRA_SKUS.has(sku));

