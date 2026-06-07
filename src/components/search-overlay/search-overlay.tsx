import { component$, useComputed$, useContext, useSignal, type Signal } from "@builder.io/qwik";
import { LocaleContext, t } from "../../i18n";
import { LoginTypeContext } from "../../routes/layout";
import { categoryLabel } from "../../routes/apparel/products";
import {
  ProductCard,
  CATEGORY_ICONS,
  CLOTHING_CATEGORIES,
  SAFETY_CATEGORIES,
  categoryForQuery,
  getBaseProducts,
} from "../product-catalog/product-catalog";

interface Props {
  /** Whether the search overlay is open (header search active). */
  open: Signal<boolean>;
  /** The current search text (the header search input value). */
  query: Signal<string>;
}

const ALWAYS_SHOW = new Set(["All", "New Hire Kit"]);

/**
 * Full-screen (below the header) search results view shown on mobile/tablet when
 * the header search is open. It renders its own category tabs + product grid and
 * filters by the typed query — entirely in place, so the page never scrolls
 * (no scroll-repaint flicker, and the header can't be pushed out of view).
 */
export const SearchOverlay = component$<Props>(({ open, query }) => {
  const locale = useContext(LocaleContext);
  const loginType = useContext(LoginTypeContext);

  const baseProducts = useComputed$(() => getBaseProducts(loginType.value));

  const visibleCategories = useComputed$(() => {
    if (loginType.value === "tech") return ["Work Wear"];
    const present = new Set(baseProducts.value.map((p) => p.category));
    const source = loginType.value === "safety" ? SAFETY_CATEGORIES : CLOTHING_CATEGORIES;
    return source.filter((c) => ALWAYS_SHOW.has(c) || present.has(c));
  });

  // The category being browsed in the overlay (when not actively typing a query).
  const activeCat = useSignal("All");

  // Which tab to highlight: the first match while typing, else the picked tab.
  const activeTab = useComputed$(() =>
    query.value.trim() ? categoryForQuery(query.value, baseProducts.value) : activeCat.value,
  );

  const filtered = useComputed$(() => {
    const products = baseProducts.value;
    const q = query.value.trim().toLowerCase();
    if (q) {
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (activeCat.value !== "All") return products.filter((p) => p.category === activeCat.value);
    return products;
  });

  if (!open.value) return null;

  return (
    <div class="search-overlay">
      <div class="search-overlay__tabs">
        {visibleCategories.value.map((cat) => (
          <button
            key={cat}
            class={`apparel-titlebar__tab ${activeTab.value === cat ? "active" : ""}`}
            // Tapping a tab filters the overlay in place (clears any typed query),
            // keeping the search view — you continue browsing from here.
            onClick$={() => {
              query.value = "";
              activeCat.value = activeCat.value === cat ? "All" : cat;
            }}
          >
            <span class="apparel-titlebar__tab-icon" dangerouslySetInnerHTML={CATEGORY_ICONS[cat]} />
            {cat === "All" ? t("apparel.all", locale.value) : categoryLabel(cat, locale.value).replace(/^T-/, "")}
          </button>
        ))}
      </div>
      <div class="search-overlay__grid">
        {filtered.value.map((item) => (
          <ProductCard key={item.sku} item={item} sku={item.sku} />
        ))}
      </div>
    </div>
  );
});
