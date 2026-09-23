import { component$, useSignal, useComputed$, useTask$, useVisibleTask$, $, useContext, type QRL } from "@builder.io/qwik";
import { Carousel } from "@qwik-ui/headless";
import { Link } from "@builder.io/qwik-city";
import { LocaleContext, t } from "../../i18n";
import { allProducts, colorName, categoryLabel } from "../../routes/apparel/products";
import { expandSizes, sizeGroups, sortColorsWhiteLast } from "../../routes/apparel/utils";
import { LoginTypeContext } from "../../routes/layout";
import { ELECTRICAL_SKUS } from "../product-catalog/product-catalog";
import { ProductImage } from "../product-image/product-image";

// Colours whose per-colour IMAGE FILES use a slug that differs from the (renamed)
// display name. The gallery matches images by colour NAME → filename, so a rename
// like #ca7988 "Heather Scooter" → "Red" (files still heatherscooter-*) needs the
// original slug here, else no image matches and ALL colours' images show at once.
const IMG_NAME_ALIAS: Record<string, string> = {
  "#ca7988": "heatherscooter",
  "#1e40af": "royal", // UA polos: shown as "Blue" but the image files are "royal"
};
const imgNorm = (color: string) =>
  (IMG_NAME_ALIAS[color.toLowerCase()] ?? colorName(color, "en"))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Tall sizes are rendered on their own row, separate from the regular sizes.
const TALL_SIZES = new Set(["ST", "MT", "LT", "XLT", "2XLT", "3XLT", "4XLT", "5XLT"]);

// SKUs whose TALL fit costs more than the regular fit (both fits live on one
// product); selecting a tall size swaps the PDP price to this amount.
const TALL_PRICE: Record<string, number> = { "MN-20": 85 };

// Base (fit-less) size tokens, largest last, for parsing fit variants.
const SIZE_BASES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

/** Split a size token into its base and fit: "LT" → {base:"L",fit:"Tall"},
 *  "MS" → {base:"M",fit:"Short"}, "2XL" → {base:"2XL",fit:"Regular"}. */
function parseFitToken(tok: string): { base: string; fit: "Regular" | "Tall" | "Short" } {
  if (SIZE_BASES.includes(tok)) return { base: tok, fit: "Regular" };
  if (tok.endsWith("T")) {
    const base = tok.slice(0, -1);
    if (SIZE_BASES.includes(base)) return { base, fit: "Tall" };
  }
  if (tok.endsWith("S")) {
    const base = tok.slice(0, -1);
    if (SIZE_BASES.includes(base)) return { base, fit: "Short" };
  }
  return { base: tok, fit: "Regular" };
}

/**
 * Derive fit-variant size groups from a slash-separated sizes string, e.g.
 * "S - 3XL / LT - 2XLT" → { Regular: [S…3XL], Tall: [L…2XL] }. Each "/" group
 * must be a fit-suffixed range; anything else (volumes like "25 oz / 35 oz",
 * waist/length "W 30 - 52 / L 30 - 36") yields null so those never become
 * variants. Returns null unless at least two real fit groups are found — so a
 * product's sizes are NEVER clumped into one button when they span fits.
 */
function variantMapFromSizes(sizes: string): Record<string, string[]> | null {
  if (!sizes || !sizes.includes("/")) return null;
  const map: Record<string, string[]> = {};
  for (const group of sizes.split("/").map((s) => s.trim()).filter(Boolean)) {
    const m = group.match(/^(\S+)\s*-\s*(\S+)$/);
    if (!m) return null;
    const a = parseFitToken(m[1]);
    const b = parseFitToken(m[2]);
    const list = expandSizes(`${a.base} - ${b.base}`);
    // A range that doesn't expand to real sizes (e.g. "W 30 - 52") isn't a fit.
    if (list.length === 0 || (list.length === 1 && list[0].includes(" "))) return null;
    map[a.fit] = list;
  }
  return Object.keys(map).length >= 2 ? map : null;
}

// SKUs whose sizing is a waist × length grid (their own picker), never fit variants.
const waistLengthSkus = new Set(["CAR-12", "CAR-14", "MN-1", "MNFR-1", "MN-36"]);

// Explicit fit-variant size maps. Any product not listed here still gets fit
// variants automatically when its sizes string encodes them (variantMapFromSizes),
// so this is only for overrides that can't be derived from the sizes string.
const variantSizesBySku: Record<string, Record<string, string[]>> = {
  "MN-3": {
    "Regular": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    "Tall": ["L", "XL", "2XL", "3XL", "4XL"],
  },
  "CAR-11": {
    "Regular": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    "Tall": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
  "CAR-17": {
    "Regular": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    "Tall": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
  "MN-8": {
    "Short": ["M", "L", "XL", "2XL", "3XL", "4XL"],
    "Regular": ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    "Tall": ["M", "L", "XL", "2XL", "3XL", "4XL"],
  },
};

// A product has fit variants when it's explicitly configured OR its sizes string
// encodes fit groups (e.g. "S - 3XL / LT - 2XLT"). Waist/length SKUs use their own
// picker, so they never resolve to fit variants. This is what stops multi-fit sizes
// from ever being clumped into a single size button. Module-scoped (not a closure)
// so it can be referenced from Qwik's $ / useComputed$ / useTask$ boundaries.
function getVariantMap(
  p: { sku: string; sizes: string } | null | undefined,
): Record<string, string[]> | null {
  if (!p || waistLengthSkus.has(p.sku)) return null;
  return variantSizesBySku[p.sku] ?? variantMapFromSizes(p.sizes);
}

interface ProductDetailPanelProps {
  /** SKU to render (from the route param, or the in-frame catalog overlay). */
  sku: string;
  /** In-frame overlay mode: when set, renders a close button instead of the
      breadcrumb, and related items switch the panel in place instead of navigating. */
  onClose$?: QRL<() => void>;
  onSelectSku$?: QRL<(sku: string) => void>;
}

/**
 * The product-detail view — image carousel, size/colour/variant pickers, add-to-
 * cart and the related-items carousel. Rendered both as the /apparel/[sku]/ route
 * (full page) and as the catalog's in-frame overlay panel; the two never diverge
 * because they share this one component. `sku` comes from a prop rather than the
 * route so the same logic drives both.
 */
export const ProductDetailPanel = component$<ProductDetailPanelProps>((props) => {
  const locale = useContext(LocaleContext);
  const loginType = useContext(LoginTypeContext);
  const hidePrice = loginType.value === "tech";
  const inFrame = !!props.onClose$;

  // Reference props.sku directly inside computed/tasks so they re-track when the
  // panel is pointed at a different product (route [sku]→[sku] nav, or the
  // in-frame overlay switching products via a related item).
  const product = useComputed$(() => allProducts.find((p) => p.sku === props.sku) || null);

  const imgIndex = useSignal(0);
  const touchStartX = useSignal(0);
  const selectedSize = useSignal("");
  const selectedColor = useSignal("");
  const selectedQty = useSignal(1);
  const selectedWaist = useSignal("");
  const selectedLength = useSignal("");
  const selectedVariant = useSignal("");
  const added = useSignal(false);
  const addedInfo = useSignal("");
  const imgFullscreen = useSignal(false);
  const imgLayout = useSignal<"rail" | "full">("rail");

  // Map each colour to the gallery image that depicts it, by matching the
  // colour's name against the image filename (e.g. "…-navy.png" ↔ "Navy"). Only
  // colours whose image exists get an entry, so products whose images are
  // alternate VIEWS (front/back of one colour) rather than colourways are left
  // untouched — clicking a swatch there won't move the gallery.
  const colorImgIndex = useComputed$(() => {
    const map: Record<string, number> = {};
    const p = product.value;
    if (!p) return map; // null while navigating away from a product route
    const imgs = (p.imgs && p.imgs.length ? p.imgs : [p.img]) as string[];
    for (const color of p.colors) {
      const norm = imgNorm(color);
      if (!norm) continue;
      const idx = imgs.findIndex((src) =>
        src.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm),
      );
      if (idx >= 0) map[color] = idx;
    }
    return map;
  });

  // For per-colour products (each colour maps to its own images, e.g. the Travis
  // Mathew polos with front/side/chest per colour) show ONLY the selected
  // colour's images in the gallery, instead of every colour's images at once.
  const visibleImgs = useComputed$(() => {
    const p = product.value;
    if (!p) return [] as string[];
    const all = (p.imgs && p.imgs.length ? p.imgs : [p.img]) as string[];
    const cmap = colorImgIndex.value;
    const color = selectedColor.value;
    if (color && Object.keys(cmap).length > 1) {
      const norm = imgNorm(color);
      const filtered = norm
        ? all.filter((src) =>
            src.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm),
          )
        : [];
      if (filtered.length) return filtered;
    }
    return all;
  });
  // Keep the same view position (front/side/…) when switching colour instead of
  // snapping back to the first image — clamp it to the new colour's image set.
  useTask$(({ track }) => {
    track(() => selectedColor.value);
    const n = visibleImgs.value.length;
    if (imgIndex.value >= n) imgIndex.value = Math.max(0, n - 1);
  });

  const relatedPerView = useSignal(2);
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const mq = window.matchMedia("(min-width: 1025px)");
    const apply = () => { relatedPerView.value = mq.matches ? 4 : 2; };
    apply();
    mq.addEventListener("change", apply);
    cleanup(() => mq.removeEventListener("change", apply));
  });

  // Warm the browser cache with EVERY colourway's image as soon as the PDP
  // opens, so the first swatch switch is instant instead of flashing while the
  // browser fetches the new image. Preloads the .webp the <picture> actually
  // renders. Re-runs when navigating to a different product.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const p = track(() => product.value);
    if (!p) return;
    const imgs = (p.imgs && p.imgs.length ? p.imgs : [p.img]) as string[];
    for (const src of imgs) {
      if (!src) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = src.replace(/\.(jpe?g|png)$/i, ".webp");
    }
  });

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
  const waistOptionsBySku: Record<string, string[]> = {
    "MN-1": ["28", "29", "30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54"],
    "MNFR-1": ["30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "46"],
    "MN-36": ["30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "46", "48", "52"],
  };
  const lengthOptionsBySku: Record<string, string[]> = {
    "MN-1": ["28", "30", "32", "34", "36"],
    "MNFR-1": ["30", "32", "34", "36"],
    "MN-36": ["30", "32", "34", "36"],
  };
  const waistOptions = ["28", "29", "30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "46", "48", "50"];
  const lengthOptions = ["30", "32", "34", "36"];

  const sizeOptions = useComputed$<string[]>(() => {
    const p = product.value;
    if (!p) return [];
    const variantMap = getVariantMap(p);
    if (variantMap) {
      if (selectedVariant.value && variantMap[selectedVariant.value]) {
        return variantMap[selectedVariant.value];
      }
      const union = new Set<string>();
      Object.values(variantMap).forEach((arr) => arr.forEach((s) => union.add(s)));
      return Array.from(union).sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
    }
    return expandSizes(p.sizes);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => selectedVariant.value);
    const p = product.value;
    if (p && waistLengthSkus.has(p.sku)) return;
    if (!selectedSize.value) return;
    if (!sizeOptions.value.includes(selectedSize.value)) {
      selectedSize.value = "";
    }
  });

  const addToCart = $(() => {
    const p = product.value;
    if (!p || !selectedSize.value) return;
    if (p.colors.length > 0 && !selectedColor.value) return;
    if (waistLengthSkus.has(p.sku) && (!selectedWaist.value || !selectedLength.value)) return;
    if (getVariantMap(p) && !selectedVariant.value) return;
    const sizeVal = waistLengthSkus.has(p.sku)
      ? `W${selectedWaist.value} x L${selectedLength.value}`
      : getVariantMap(p)
        ? `${selectedSize.value} ${selectedVariant.value}`
        : selectedSize.value;
    try {
      const saved = localStorage.getItem(`ce_cart_mn_${loginType.value || "clothing"}`);
      const items = saved ? JSON.parse(saved) : [];
      const existing = items.find(
        (i: any) => i.name === p.name && i.size === sizeVal && i.color === selectedColor.value
      );
      if (existing) {
        existing.quantity += selectedQty.value;
      } else {
        const codeMatch = p.details?.match(/#[A-Za-z0-9]+/);
        let colorVal = selectedColor.value;
        if (!colorVal && (!p.colors || p.colors.length === 0)) {
          const nm = p.name.match(/\s-\s([A-Za-z ]+)$/);
          if (nm) colorVal = nm[1].trim();
        }
        // Cart thumbnail: use the SELECTED colour's image (matched the same way
        // the gallery filters), not the product's default image.
        let colorImg = p.img;
        if (selectedColor.value) {
          const all = (p.imgs && p.imgs.length ? p.imgs : [p.img]) as string[];
          const norm = imgNorm(selectedColor.value);
          const match = norm
            ? all.find((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm))
            : null;
          if (match) colorImg = match;
        }
        const item: any = {
          name: p.name,
          sku: p.sku,
          category: p.category,
          size: sizeVal,
          color: colorVal,
          quantity: selectedQty.value,
          price: p.price,
          img: colorImg,
        };
        if (codeMatch) item.code = codeMatch[0];
        if (waistLengthSkus.has(p.sku)) {
          item.waist = selectedWaist.value;
          item.length = selectedLength.value;
        }
        if (getVariantMap(p)) {
          item.variant = selectedVariant.value;
        }
        items.push(item);
      }
      localStorage.setItem(`ce_cart_mn_${loginType.value || "clothing"}`, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (err) { console.error("addToCart error:", err); }
    addedInfo.value = selectedColor.value ? `${p.name} — ${colorName(selectedColor.value, "en")} / ${sizeVal}` : `${p.name} — ${sizeVal}`;
    added.value = true;
    selectedQty.value = 1;
    setTimeout(() => { added.value = false; }, 1300);
  });

  useTask$(({ track }) => {
    track(() => props.sku);
    imgIndex.value = 0;
    imgFullscreen.value = false;
    selectedQty.value = 1;
    selectedWaist.value = "";
    selectedLength.value = "";
    selectedVariant.value = "";
    selectedSize.value = "";
    selectedColor.value = "";
    const p0 = product.value;
    if (!p0) return;
    selectedColor.value = sortColorsWhiteLast(p0.colors)[0];
    if (waistLengthSkus.has(p0.sku)) {
      selectedSize.value = "W/L";
    } else if (getVariantMap(p0)) {
      const variantMap = getVariantMap(p0)!;
      const variantKeys = Object.keys(variantMap);
      const defVariant = variantKeys.includes("Regular") ? "Regular" : variantKeys[0];
      selectedVariant.value = defVariant;
      const sizes = variantMap[defVariant];
      const lIdx = sizes.indexOf("L");
      selectedSize.value = lIdx !== -1 ? sizes[lIdx] : sizes[0];
    } else {
      const sizes = expandSizes(p0.sizes);
      const lIdx = sizes.indexOf("L");
      selectedSize.value = lIdx !== -1 ? sizes[lIdx] : sizes[0];
    }
  });

  if (!product.value) {
    return (
      <div class="apparel-catalog" id="products">
        <div class="product-detail">
          <p style={{ padding: "2rem", textAlign: "center" }}>{t("product.notfound", locale.value)}</p>
        </div>
      </div>
    );
  }

  const p = product.value;
  const pdf = (p as any).pdf as string | undefined;
  const hasMultipleImgs = visibleImgs.value.length > 1;
  const isFootwear = (c: string) => c === "Safety Boots" || c === "Safety Shoes" || c === "Footwear";
  const tabCategory = isFootwear(p.category) ? "Footwear" : p.category;
  const catHash = tabCategory.toLowerCase().replace(/\s+/g, "-");
  const backLabel = loginType.value === "tech" ? t("cat.Work Wear", locale.value) : t("nav.apparel", locale.value);
  const catLabel = categoryLabel(tabCategory, locale.value);

  return (
    <div class={`apparel-catalog ${inFrame ? "apparel-catalog--inframe" : ""}`} id={inFrame ? undefined : "products"}>
      {inFrame ? (
        <button class="product-detail__close" aria-label="Close" onClick$={() => props.onClose$?.()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      ) : (
        <nav class="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" class="pdp-breadcrumb__link pdp-breadcrumb__back">
            <svg class="pdp-breadcrumb__arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>{backLabel}</span>
          </Link>
          <Link href={`/#${catHash}`} class="pdp-breadcrumb__link pdp-breadcrumb__cat">
            {tabCategory === "New Hire Kit" ? (
              <>
                <span class="pdp-breadcrumb__cat-full">{catLabel}</span>
                <span class="pdp-breadcrumb__cat-short">{t("cat.newhirekit.short", locale.value)}</span>
              </>
            ) : catLabel}
          </Link>
          <span class="pdp-breadcrumb__sku">{p.sku}</span>
          {hasMultipleImgs && (
            <button
              class="pdp-breadcrumb__view"
              aria-label={imgLayout.value === "rail" ? "Full-width image" : "Show image previews"}
              onClick$={() => (imgLayout.value = imgLayout.value === "rail" ? "full" : "rail")}
            >
              {imgLayout.value === "rail" ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              )}
            </button>
          )}
        </nav>
      )}
      <div class={`product-detail ${imgLayout.value === "full" ? "product-detail--imgfull" : ""}`}>
        <div class="product-modal__layout">
          <div class="product-image-row">
            <div
              class="product-carousel"
              onTouchStart$={(e) => { touchStartX.value = e.touches[0].clientX; }}
              onTouchEnd$={(e) => {
                const diff = touchStartX.value - e.changedTouches[0].clientX;
                const imgs = visibleImgs.value;
                if (Math.abs(diff) > 40) {
                  if (diff > 0) {
                    imgIndex.value = (imgIndex.value + 1) % imgs.length;
                  } else {
                    imgIndex.value = (imgIndex.value - 1 + imgs.length) % imgs.length;
                  }
                }
              }}
              onClick$={() => {
                const imgs = visibleImgs.value;
                if (window.innerWidth > 1024) {
                  imgFullscreen.value = true;
                } else if (imgs.length > 1) {
                  imgIndex.value = (imgIndex.value + 1) % imgs.length;
                }
              }}
            >
              {(visibleImgs.value).map((src, i) => (
                <picture key={i}>
                  <source srcset={src.replace(/\.(jpe?g|png)$/i, ".webp")} type="image/webp" />
                  <img
                    src={src}
                    alt={p.name}
                    width="600"
                    height="400"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    class={`product-carousel__slide ${imgIndex.value === i ? "active" : ""} ${src.includes("spec") ? "product-carousel__slide--contain" : ""}`}
                    style={src.includes("BACK") ? { objectPosition: "center 65%" } : {}}
                  />
                </picture>
              ))}
              {pdf && (
                <a href={pdf} target="_blank" class="product-modal__pdf" onClick$={(e) => e.stopPropagation()}>
                  {t("product.specsheet.pdf", locale.value)}
                </a>
              )}
              {(visibleImgs.value).length > 1 && (
                <div class="product-carousel__indicators">
                  {(visibleImgs.value).map((_, i) => (
                    <button
                      key={i}
                      class={`product-carousel__dot ${imgIndex.value === i ? "active" : ""}`}
                      aria-label={`Image ${i + 1}`}
                      onClick$={(e) => { e.stopPropagation(); imgIndex.value = i; }}
                    />
                  ))}
                </div>
              )}
            </div>
            {(visibleImgs.value).length > 1 && (
              <div class="product-thumbs product-thumbs--column">
                {(visibleImgs.value).map((src, i) => (
                  <button
                    key={i}
                    class={`product-thumbs__item ${imgIndex.value === i ? "active" : ""}`}
                    onClick$={() => { imgIndex.value = i; }}
                  >
                    <ProductImage src={src} alt={`${p.name} ${i + 1}`} width={80} height={80} loading={i === 0 ? "eager" : "lazy"} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div class="product-modal__details">
            <h2 class="product-modal__name">{p.name}</h2>
            {!hidePrice && (() => {
              // Tall fit costs more on some SKUs. The fit is either a Regular/Tall
              // variant toggle (getVariantMap) or a tall-suffixed size token.
              const isTall =
                (getVariantMap(p) != null && selectedVariant.value === "Tall") ||
                (!!selectedSize.value && TALL_SIZES.has(selectedSize.value));
              const price =
                isTall && TALL_PRICE[p.sku] != null
                  ? TALL_PRICE[p.sku]
                  : Number(p.price) || 0;
              return <div class="product-modal__price">${price.toFixed(2)}</div>;
            })()}
            {p.material && (
              <div class="product-modal__material">
                <strong>{t("modal.material", locale.value)}:</strong> {p.material}
              </div>
            )}
            {p.details && (
              <ul class={`product-modal__details-list ${p.details.split(",").length <= 2 ? "product-modal__details-list--single" : ""}`}>
                {p.details.split(",").map((detail, i) => (
                  <li key={i}>{detail.trim()}</li>
                ))}
              </ul>
            )}
            {!waistLengthSkus.has(p.sku) && (
            <div class="product-modal__field">
              <label class="product-modal__label">{t("modal.size", locale.value)}{getVariantMap(p) && selectedVariant.value && <span class="product-modal__color-inline"> — {t(`variant.${selectedVariant.value}` as any, locale.value)}</span>}{!getVariantMap(p) && sizeOptions.value.some((s) => TALL_SIZES.has(s)) && selectedSize.value && <span class="product-modal__color-inline"> — {t(TALL_SIZES.has(selectedSize.value) ? "variant.Tall" : "variant.Regular", locale.value)}</span>}</label>
              <div class="product-modal__options">
                {sizeOptions.value.filter((s) => !TALL_SIZES.has(s)).map((size) => (
                  <button
                    key={size}
                    class={`product-modal__option ${selectedSize.value === size ? "active" : ""}`}
                    onClick$={() => (selectedSize.value = size)}
                  >
                    {size === "One Size" ? t("modal.onesize", locale.value) : size}
                  </button>
                ))}
              </div>
              {sizeOptions.value.some((s) => TALL_SIZES.has(s)) && (
                <div class="product-modal__options product-modal__options--tall">
                  {sizeOptions.value.filter((s) => TALL_SIZES.has(s)).map((size) => (
                    <button
                      key={size}
                      class={`product-modal__option ${selectedSize.value === size ? "active" : ""}`}
                      onClick$={() => (selectedSize.value = size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
            {getVariantMap(p) && (
              <div class="product-modal__field">
                <label class="product-modal__label">{t("product.variant", locale.value)}</label>
                <div class="product-modal__options">
                  {Object.keys(getVariantMap(p) ?? {}).map((v) => (
                    <button
                      key={v}
                      class={`product-modal__option ${selectedVariant.value === v ? "active" : ""}`}
                      onClick$={() => (selectedVariant.value = v)}
                    >
                      {t(`variant.${v}` as any, locale.value)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {waistLengthSkus.has(p.sku) && (
              <div class="product-modal__field product-modal__waist-length-row">
                <div class="product-modal__select-group">
                  <label class="product-modal__label">{t("product.waist", locale.value)}</label>
                  <select
                    class="product-modal__select"
                    value={selectedWaist.value}
                    onChange$={(_, el) => (selectedWaist.value = el.value)}
                  >
                    <option value="" disabled>{t("product.select", locale.value)}</option>
                    {(waistOptionsBySku[p.sku] ?? waistOptions).map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div class="product-modal__select-group">
                  <label class="product-modal__label">{t("product.length", locale.value)}</label>
                  <select
                    class="product-modal__select"
                    value={selectedLength.value}
                    onChange$={(_, el) => (selectedLength.value = el.value)}
                  >
                    <option value="" disabled>{t("product.select", locale.value)}</option>
                    {(lengthOptionsBySku[p.sku] ?? lengthOptions).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {p.colors.length > 0 && (
              <div class="product-modal__field">
                <label class="product-modal__label">{t("modal.color", locale.value)}{selectedColor.value && <span class="product-modal__color-inline"> — {colorName(selectedColor.value, locale.value)}</span>}</label>
                <div class="product-modal__options">
                  {sortColorsWhiteLast(p.colors).map((color) => (
                    <button
                      key={color}
                      class={`product-modal__color ${selectedColor.value === color ? "active" : ""}`}
                      style={{ background: color }}
                      onClick$={() => {
                        // Keep the current view (front/side/…) — the task below
                        // clamps imgIndex to the new colour's set instead of
                        // snapping back to the first image.
                        selectedColor.value = color;
                      }}
                      aria-label={colorName(color, locale.value)}
                      title={colorName(color, locale.value)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div class="product-modal__field product-modal__qty-group">
              <label class="product-modal__label">{t("modal.quantity", locale.value)}</label>
              <div class="product-modal__qty">
                <button class="product-modal__qty-btn" aria-label="Decrease quantity" onClick$={() => { if (selectedQty.value > 1) selectedQty.value--; }}>-</button>
                <span class="product-modal__qty-val">{selectedQty.value}</span>
                <button class="product-modal__qty-btn" aria-label="Increase quantity" onClick$={() => (selectedQty.value++)}>+</button>
              </div>
            </div>
            <div class="product-modal__actions">
              <button
                class={`btn btn--primary product-modal__add product-modal__add--branded ${added.value ? "product-modal__add--added" : ""}`}
                disabled={!selectedSize.value || (waistLengthSkus.has(p.sku) && (!selectedWaist.value || !selectedLength.value)) || (getVariantMap(p) != null && !selectedVariant.value)}
                onClick$={addToCart}
              >
                <span class="product-modal__add-label">
                  <span class="product-modal__add-label-text product-modal__add-label-text--primary">{selectedSize.value ? t("modal.addtocart", locale.value) : t("modal.selectsize", locale.value)}</span>
                  <span class="product-modal__add-label-text product-modal__add-label-text--added">{t("modal.added", locale.value)}</span>
                </span>
                <span class="product-modal__add-mark" aria-hidden="true">
                  <svg class="product-modal__add-pinwheel" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="50,50 50,0 100,0" fill="#ffe2a6" />
                    <polygon points="50,50 100,0 100,50" fill="#ae1f2a" />
                    <polygon points="50,50 100,50 100,100" fill="#d43950" />
                    <polygon points="50,50 100,100 50,100" fill="#9ec069" />
                    <polygon points="50,50 50,100 0,100" fill="#7fa244" />
                    <polygon points="50,50 0,100 0,50" fill="#4689b3" />
                    <polygon points="50,50 0,50 0,0" fill="#31759c" />
                    <polygon points="50,50 0,0 50,0" fill="#ffd25b" />
                  </svg>
                  <svg class="product-modal__add-glyph product-modal__add-glyph--cart" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                  <svg class="product-modal__add-glyph product-modal__add-glyph--check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {(() => {
        const visibleByLogin: Record<string, string[]> = {
          clothing: ["Jackets", "Sweaters", "Shirts", "Polos", "Hats", "SWAG", "New Hire Kit"],
          tech: ["Work Wear"],
          safety: ["Flame Resistant", "Shirts", "Hats"],
        };
        const isElectrical = loginType.value === "electrical";
        const visible = visibleByLogin[loginType.value] || visibleByLogin.clothing;
        const inVisible = visible.includes(p.category);
        // The "more products" carousel may ONLY contain items in the current
        // site's lineup — same rule the main catalog uses. Electrical shows just
        // its ELECTRICAL_SKUS; Service shows everything that isn't an
        // Electrical-only SKU or a Flame-Resistant item. Without this, an
        // Electrical-only SKU that happens to share a category (e.g. the Atlas
        // Guardian FR/AR hoodies, category "Sweaters") leaked into the Service
        // carousel even though it's off-lineup.
        const inLineup = (r: (typeof allProducts)[number]) =>
          isElectrical
            ? ELECTRICAL_SKUS.includes(r.sku)
            : !ELECTRICAL_SKUS.includes(r.sku) && r.category !== "Flame Resistant";
        const sameCat = allProducts.filter((r) => r.sku !== p.sku && r.sku !== "CAR-12" && inLineup(r) && r.category === p.category);
        const allApparel = allProducts.filter((r) => r.sku !== p.sku && r.sku !== "CAR-12" && inLineup(r) && visible.includes(r.category));
        // Use the SKU's own category only when it has enough siblings to fill a
        // carousel; otherwise (e.g. Sweaters, with a single item) fall back to the
        // whole "Apparel" lineup so the row isn't empty/near-empty.
        const useCat = inVisible && sameCat.length >= 2;
        const related = isElectrical
          ? allProducts.filter((r) => r.sku !== p.sku && inLineup(r)).slice(0, 8)
          : (useCat ? sameCat : allApparel).slice(0, 8);
        const headingSuffix = isElectrical ? t("login.portal.electrical", locale.value) : useCat ? catLabel : t("nav.apparel", locale.value);
        // Card inner markup, shared by the grid + carousel below (inline, not a
        // component, to keep it a plain render helper).
        const cardInner = (item: typeof related[number], loading: "eager" | "lazy") => (
          <>
            <div class="product-card__image">
              <ProductImage src={item.img} alt={item.name} width={440} height={440} loading={loading} />
            </div>
            <div class="product-card__info">
              <div class="product-card__name-row">
                <div class="product-card__name">{item.name}</div>
                <div class="product-card__price-group">
                  {!hidePrice && (() => {
                    const pr = Number(item.price) || 0;
                    const dollars = Math.floor(pr);
                    const cents = Math.round((pr - dollars) * 100).toString().padStart(2, "0");
                    return (
                      <div class="product-card__price">
                        ${dollars}
                        {cents !== "00" && <span class="product-card__price-cents">.{cents}</span>}
                      </div>
                    );
                  })()}
                  <span class="product-card__sizes">
                    {(item.sizes === "One Size" ? [t("modal.onesize", locale.value)] : sizeGroups(item.sizes)).map((g) => (
                      <span key={g} class="product-card__sizes-line">{g}</span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </>
        );
        return (
          <div class="related-items">
            <h3 class="related-items__title">{t("product.more", locale.value)} {headingSuffix}</h3>
            {/* In-frame: related items switch the panel in place (button + onSelectSku$).
                Route: they navigate (Link). */}
            <div class="related-items__grid">
              {related.slice(0, 4).map((item) => (
                inFrame ? (
                  <button key={item.sku} type="button" class="product-card product-card-link" onClick$={() => props.onSelectSku$?.(item.sku)}>
                    {cardInner(item, "eager")}
                  </button>
                ) : (
                  <Link key={item.sku} href={`/${item.sku}/`} class="product-card product-card-link">
                    {cardInner(item, "eager")}
                  </Link>
                )
              ))}
            </div>
            <Carousel.Root class="related-carousel" slidesPerView={relatedPerView.value} gap={0.4} align="start" sensitivity={{ touch: 1.5, mouse: 1.5 }} rewind>
              <div class="related-carousel__wrapper">
                {related.length > relatedPerView.value && (
                <Carousel.Previous class="related-carousel__arrow related-carousel__arrow--prev">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </Carousel.Previous>
                )}
                <Carousel.Scroller class="related-carousel__scroller">
                  {related.map((item) => (
                    <Carousel.Slide key={item.sku} class="related-carousel__slide">
                      {inFrame ? (
                        <button type="button" class="product-card product-card-link" onClick$={() => props.onSelectSku$?.(item.sku)}>
                          {cardInner(item, "lazy")}
                        </button>
                      ) : (
                        <Link href={`/${item.sku}/`} class="product-card product-card-link">
                          {cardInner(item, "lazy")}
                        </Link>
                      )}
                    </Carousel.Slide>
                  ))}
                </Carousel.Scroller>
                {related.length > relatedPerView.value && (
                <Carousel.Next class="related-carousel__arrow related-carousel__arrow--next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </Carousel.Next>
                )}
              </div>
            </Carousel.Root>
          </div>
        );
      })()}
      {added.value && (
        <div class="toast">{t("modal.added", locale.value)} — {addedInfo.value}</div>
      )}
      {imgFullscreen.value && (
        <div class="product-fullscreen" onClick$={() => (imgFullscreen.value = false)}>
          <button class="product-fullscreen__close" aria-label="Close fullscreen" onClick$={(e) => { e.stopPropagation(); imgFullscreen.value = false; }}>&times;</button>
          <img
            src={(visibleImgs.value)[imgIndex.value]}
            alt={p.name}
            class="product-fullscreen__img"
            onClick$={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
});
