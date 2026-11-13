// Which products each storefront login shows. Shared by the catalog, the
// product route guard and the layout's menu drawer so all three always agree.
import { isSafetyProduct } from "./hvac";

// Electrical portal: shows ONLY these SKUs (the small Electrical-division lineup).
// Add/replace the Electrical SKU codes here — order is preserved in the grid.
// MN-36 = Carhartt FR Rigby Pants (104204), MN-37 = Carhartt FR Full Zip Hoodie
// (104982) — renamed off the old MNFR- prefix to match the catalog's MN- numbering.
// The FR Dearborn LS Tee (100235) isn't in the catalog yet — add it to the DB,
// then drop its SKU in here.
// Display order: T-Shirts, Sweaters, Pants, Headwear (matches the sidebar).
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
  // Clothing / Service (default): everything except FR + Electrical-only SKUs.
  return category !== "Flame Resistant" && !ELECTRICAL_SKUS.includes(sku);
};
