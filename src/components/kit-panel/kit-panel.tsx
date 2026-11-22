/**
 * Electrical portal: every order is the same kit (lib/lineup.ts —
 * ELECTRICAL_FIXED_QTY), so the gallery IS the order form.
 *
 *  - Each of the four cards carries its quantity badge and its own size picker.
 *  - Tapping a product's photo or name opens its full product page.
 *  - A sticky "Your kit" bar stays on screen with progress and the single
 *    Add Kit to Cart button (adds all four at their fixed quantities,
 *    replacing any kit already in the cart).
 */
import { component$, useStore, useSignal, useContext, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { allProducts, colorName } from "../../routes/apparel/products";
import { expandSizes } from "../../routes/apparel/utils";
import { LoginTypeContext } from "../../routes/layout";
import { LocaleContext } from "../../i18n";
import { ELECTRICAL_SKUS, ELECTRICAL_FIXED_QTY } from "../../lib/lineup";
import "./kit-panel.css";

// Size choices per kit item — the same options the product pages offer.
type Pick = { kind: "size"; sizes: string[] }
  | { kind: "fit"; fits: Record<string, string[]> }
  | { kind: "waistLength"; waists: string[]; lengths: string[] }
  | { kind: "one" };

const PICKS: Record<string, Pick> = {
  // Carhartt FR Force Dearborn LS T-Shirt: "S - 4XL / LT - 3XLT".
  "MN-38": { kind: "fit", fits: { Regular: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"], Tall: ["L", "XL", "2XL", "3XL"] } },
  // Atlas Guardian FR/AR 1/4 Zip Hoodie.
  "MN-40": { kind: "size", sizes: expandSizes("XXS - 7XL") },
  // Carhartt FR Rigby Pants (waist x length grid, as on its product page).
  "MN-36": {
    kind: "waistLength",
    waists: ["30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "46", "48", "52"],
    lengths: ["30", "32", "34", "36"],
  },
  // Flexfit Embroidered Cap.
  "MN-39": { kind: "one" },
};

// Short labels for the bar ("5 T-shirts").
const SHORT: Record<string, string> = { "MN-38": "shirts", "MN-40": "hoodie", "MN-36": "pants", "MN-39": "cap" };
// Order of the bar's kit list: shirts, pants, hoodie, cap.
const BAR_ORDER = ["MN-38", "MN-36", "MN-40", "MN-39"];

type KitSel = { size?: string; fit?: string; waist?: string; length?: string };

// Module-level (not closures) so Qwik's $() handlers can call them.
function isReady(sku: string, v: KitSel | undefined): boolean {
  const pk = PICKS[sku];
  if (!pk || pk.kind === "one") return true;
  if (!v) return false;
  if (pk.kind === "waistLength") return !!v.waist && !!v.length;
  return !!v.size;
}
function kitProducts() {
  return ELECTRICAL_SKUS
    .map((sku) => allProducts.find((p) => p.sku === sku))
    .filter((p): p is (typeof allProducts)[number] => !!p);
}
// "Carhartt FR Rigby Pants - Dark Khaki" -> "Carhartt FR Rigby Pants"
const baseName = (n: string) => n.replace(/\s+-\s+[^-]+$/, "");
const cartKey = (lt: string | null | undefined) => `ce_cart_mn_${lt || "clothing"}`;
// Feature bullets from the comma list; the "#code" goes on its own line.
const features = (d: string | undefined) =>
  (d || "").split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("#"))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
const styleCode = (d: string | undefined) => (d || "").match(/#[A-Za-z0-9]+/)?.[0];

/** Size pickers for one kit item (shared by the cards and the tablet PDP panel). */
export const KitPickers = component$<{ sku: string; v: KitSel; label: string }>(({ sku, v, label }) => {
  const pk = PICKS[sku];
  return (
    <div class="kit-card__pick">
      {pk?.kind === "fit" && (
        <>
          <select aria-label={`${label} fit`} value={v.fit} onChange$={(_, el) => { v.fit = el.value; if (v.size && !pk.fits[el.value].includes(v.size)) v.size = undefined; }}>
            {Object.keys(pk.fits).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select aria-label={`${label} size`} value={v.size ?? ""} onChange$={(_, el) => { v.size = el.value || undefined; }}>
            <option value="">Size</option>
            {pk.fits[v.fit || "Regular"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}
      {pk?.kind === "size" && (
        <select aria-label={`${label} size`} value={v.size ?? ""} onChange$={(_, el) => { v.size = el.value || undefined; }}>
          <option value="">Size</option>
          {pk.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {pk?.kind === "waistLength" && (
        <>
          <select aria-label={`${label} waist`} value={v.waist ?? ""} onChange$={(_, el) => { v.waist = el.value || undefined; }}>
            <option value="">Waist</option>
            {pk.waists.map((w) => <option key={w} value={w}>{`W${w}`}</option>)}
          </select>
          <select aria-label={`${label} length`} value={v.length ?? ""} onChange$={(_, el) => { v.length = el.value || undefined; }}>
            <option value="">Length</option>
            {pk.lengths.map((l) => <option key={l} value={l}>{`L${l}`}</option>)}
          </select>
        </>
      )}
      {(!pk || pk.kind === "one") && <span class="kit-card__one">One Size</span>}
    </div>
  );
});

/** The cart "size" string a selection produces (same format the cart stores). */
function sizeLabel(sku: string, v: KitSel | undefined): string {
  const pk = PICKS[sku];
  if (!pk || pk.kind === "one") return "One Size";
  if (!v) return "";
  if (pk.kind === "waistLength") return `W${v.waist} x L${v.length}`;
  if (pk.kind === "fit") return `${v.size} ${v.fit}`;
  return v.size || "";
}

export const KitBuilder = component$(() => {
  const loginType = useContext(LoginTypeContext);
  const sel = useStore<Record<string, KitSel>>(
    Object.fromEntries(ELECTRICAL_SKUS.map((s) => [s, s === "MN-38" ? { fit: "Regular" } : {}])),
  );
  const added = useSignal(false);
  const inCart = useSignal(false);
  // Sizes of the kit currently in the cart (sku -> cart size string).
  const cartSizes = useStore<Record<string, string>>({});
  const nav = useNavigate();

  // Pre-fill from a kit already in the cart, so coming back shows the sizes
  // chosen; keep "in cart" in sync as the cart changes.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const readCart = () => {
      try { return JSON.parse(localStorage.getItem(cartKey(loginType.value)) || "[]") as any[]; } catch { return []; }
    };
    for (const i of readCart().filter((i) => ELECTRICAL_SKUS.includes(i.sku))) {
      const v = sel[i.sku];
      if (!v) continue;
      if (i.waist) { v.waist = String(i.waist); v.length = String(i.length); }
      else if (i.variant) { v.fit = i.variant; v.size = String(i.size).replace(` ${i.variant}`, ""); }
      else if (i.size && i.size !== "One Size") v.size = i.size;
    }
    const sync = () => {
      const c = readCart();
      inCart.value = ELECTRICAL_SKUS.every((s) => c.some((i) => i.sku === s));
      for (const sku of ELECTRICAL_SKUS) cartSizes[sku] = String(c.find((i) => i.sku === sku)?.size ?? "");
    };
    sync();
    window.addEventListener("cart-updated", sync);
    cleanup(() => window.removeEventListener("cart-updated", sync));
  });

  const items = kitProducts();
  const needing = items.filter((p) => PICKS[p.sku]?.kind !== "one");
  const chosen = needing.filter((p) => isReady(p.sku, sel[p.sku])).length;
  const allReady = chosen === needing.length;
  // The kit in the cart matches what's picked here -> the bar becomes the
  // order summary with a Checkout button.
  const inCartMatch = inCart.value && allReady && ELECTRICAL_SKUS.every((sku) => cartSizes[sku] === sizeLabel(sku, sel[sku]));

  const addKit = $(() => {
    const items = kitProducts();
    if (!items.every((p) => isReady(p.sku, sel[p.sku]))) return;
    try {
      const key = cartKey(loginType.value);
      const kitSkus = new Set(ELECTRICAL_SKUS);
      const cart = (JSON.parse(localStorage.getItem(key) || "[]") as any[]).filter((i) => !kitSkus.has(i.sku));
      for (const p of items) {
        const pk = PICKS[p.sku]; const v = sel[p.sku];
        const item: any = {
          name: p.name, sku: p.sku, category: p.category,
          color: p.colors?.[0] ?? "", quantity: ELECTRICAL_FIXED_QTY[p.sku] ?? 1,
          price: p.price, img: p.img,
        };
        if (pk?.kind === "waistLength") {
          item.size = `W${v.waist} x L${v.length}`; item.waist = v.waist; item.length = v.length;
        } else if (pk?.kind === "fit") {
          item.size = `${v.size} ${v.fit}`; item.variant = v.fit;
        } else if (pk?.kind === "size") {
          item.size = v.size;
        } else {
          item.size = "One Size";
        }
        const code = p.details?.match(/#[A-Za-z0-9]+/);
        if (code) item.code = code[0];
        cart.push(item);
      }
      localStorage.setItem(key, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent("cart-updated"));
      added.value = true;
      setTimeout(() => { added.value = false; }, 2200);
    } catch (err) { console.error("addKit error:", err); }
  });

  return (
    <div class="kit-builder">
      <div class="kit-builder__grid">
        {items.map((p) => {
          const pk = PICKS[p.sku]; const v = sel[p.sku];
          // Picked items show as done; the one-size cap joins them once the
          // other three are all picked, so the kit lights up as a group.
          const done = pk?.kind === "one" ? allReady : isReady(p.sku, v);
          const col = p.colors?.[0];
          return (
            <article class={`kit-card ${done ? "kit-card--done" : ""}`} key={p.sku} data-sku={p.sku}>
              <Link href={`/${p.sku}/`} class="kit-card__media" aria-label={`${baseName(p.name)}: product page`}>
                <img src={p.img} alt="" width="600" height="600" loading="eager" decoding="async" />
                <span class="kit-card__qty">×{ELECTRICAL_FIXED_QTY[p.sku]}</span>
                {done && <span class="kit-card__check" aria-label="Size chosen">✓</span>}
              </Link>
              <div class="kit-card__body">
                <h3 class="kit-card__name"><Link href={`/${p.sku}/`} class="kit-card__name-btn">{baseName(p.name)}</Link></h3>
                {col && <div class="kit-card__colour"><span class="kit-card__swatch" style={{ background: col }} />{colorName(col, "en")}</div>}
                {/* Material line (shown on tablets, where list rows have room). */}
                {(p as any).material && <p class="kit-card__spec"><strong>Material:</strong> {(p as any).material}</p>}
                {/* Size range (desktop + tablet; phones have no room). */}
                {PICKS[p.sku]?.kind !== "one" && <p class="kit-card__range"><strong>Sizes:</strong> {p.sizes.replace(/\s*-\s*/g, " – ")}</p>}
                <KitPickers sku={p.sku} v={v} label={baseName(p.name)} />
              </div>
            </article>
          );
        })}
      </div>

      <div class={`kit-bar ${inCartMatch ? "kit-bar--incart" : ""}`} role="region" aria-label="Electrical FR kit">
        {inCartMatch ? (
          <>
            {/* Kit in the cart: summary of what's ordered + straight to checkout. */}
            <div class="kit-bar__info">
              <span class="kit-bar__summary-title">Kit order</span>
              <span class="kit-bar__summary">
                {BAR_ORDER.map((sku) => {
                  const sz = cartSizes[sku];
                  return `${ELECTRICAL_FIXED_QTY[sku]} ${SHORT[sku]}${sz && sz !== "One Size" ? ` (${sz.replace(" x ", " × ")})` : ""}`;
                }).join(" · ")}
              </span>
            </div>
            <button type="button" class="btn btn--primary kit-bar__add kit-bar__checkout" onClick$={() => nav("/checkout/")}>
              Checkout
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </button>
          </>
        ) : (
          <>
            <div class="kit-bar__info">
              <span class="kit-bar__list"><span class="kit-bar__label">Electrical FR kit:</span> {BAR_ORDER.map((sku) => `${ELECTRICAL_FIXED_QTY[sku]} ${SHORT[sku]}`).join(" · ")}</span>
              <span class={`kit-bar__status ${allReady ? "kit-bar__status--ok" : ""}`}>
                {allReady ? (inCart.value ? "Sizes changed — update your kit order" : "All sizes chosen") : `Pick a size for each item · ${chosen} of ${needing.length}`}
              </span>
            </div>
            <button type="button" class="btn btn--primary kit-bar__add" disabled={!allReady} onClick$={addKit}>
              {inCart.value ? "Update Kit Order" : "Add to Order"}
              {/* small white tote-bag icon, on the right */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 8.5h15l-1.2 12a1.5 1.5 0 0 1-1.5 1.35H7.2a1.5 1.5 0 0 1-1.5-1.35z"/><path d="M8.5 11V6.5a3.5 3.5 0 0 1 7 0V11"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * Electrical, desktop: a branding panel in place of the category sidebar
 * (four products don't need filters) — like the Farm Boy store's left panel:
 * the Modern Niagara mark + wordmark, the portal name, what the kit contains,
 * and the contact email at the bottom.
 */
export const ElectricalBrandPanel = component$(() => {
  const locale = useContext(LocaleContext);
  // Desktop: tell the header exactly where this panel sits (relative to the
  // header), so it can colour the corner above the panel to match it.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const sync = () => {
      const panel = document.querySelector(".mn-brand-panel") as HTMLElement | null;
      const header = document.querySelector(".site-header") as HTMLElement | null;
      if (!panel || !header) return;
      const p = panel.getBoundingClientRect(); const h = header.getBoundingClientRect();
      const root = document.documentElement.style;
      // Exact (sub-pixel) positions, so the corner lines up pixel-perfectly.
      root.setProperty("--mn-panel-l", `${p.left - h.left}px`);
      root.setProperty("--mn-panel-r", `${p.right - h.left}px`);
      // Viewport positions too (used by the checkout page, whose content is
      // fixed-position and sits beside this panel).
      root.setProperty("--mn-hdr-l", `${h.left}px`);
      root.setProperty("--mn-hdr-w", `${h.width}px`);
      root.setProperty("--mn-panel-abs-r", `${p.right}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(document.documentElement);
    const panel = document.querySelector(".mn-brand-panel");
    if (panel) ro.observe(panel);
    cleanup(() => ro.disconnect());
  });
  return (
  <aside class="mn-brand-panel" aria-label="Modern Niagara Electrical">
    <div class="mn-brand-panel__lockup">
      <svg class="mn-brand-panel__mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="50,50 50,0 100,0" fill="#ffe2a6" />
        <polygon points="50,50 100,0 100,50" fill="#ae1f2a" />
        <polygon points="50,50 100,50 100,100" fill="#d43950" />
        <polygon points="50,50 100,100 50,100" fill="#9ec069" />
        <polygon points="50,50 50,100 0,100" fill="#7fa244" />
        <polygon points="50,50 0,100 0,50" fill="#4689b3" />
        <polygon points="50,50 0,50 0,0" fill="#31759c" />
        <polygon points="50,50 0,0 50,0" fill="#ffd25b" />
      </svg>
      <div class="mn-brand-panel__words">
        <span class="mn-brand-panel__w1">MODERN NIAGARA</span>
        <span class="mn-brand-panel__w2">BUILDING SERVICES</span>
        <span class="mn-brand-panel__w3">APPAREL</span>
      </div>
    </div>
    <p class="mn-brand-panel__portal">Electrical FR Kit</p>
    {/* One line with dots on desktop; two per line on wide tablets. */}
    <p class="mn-brand-panel__kit">
      <span>5 shirts</span><span>5 pants</span><span>1 hoodie</span><span>1 cap</span>
    </p>
    <div class="mn-brand-panel__contact">
      <div class="mn-brand-panel__contact-main">
        <span class="mn-brand-panel__contact-label">Contact</span>
        <a href="mailto:info@mnbsapparel.ca">info@mnbsapparel.ca</a>
      </div>
      {/* The footer (and its language button) is hidden where this panel shows,
          so the panel carries the language switch — it triggers the footer's
          own toggle so there's one source of truth. */}
      <button type="button" class="mn-brand-panel__locale" aria-label={locale.value === "en" ? "Français" : "English"}
        onClick$={() => { (document.querySelector(".site-footer__locale") as HTMLElement | null)?.click(); }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        {locale.value === "en" ? "FR" : "EN"}
      </button>
    </div>
  </aside>
  );
});
