import { component$, useSignal, useContext, useVisibleTask$, useComputed$ } from "@builder.io/qwik";
import { Carousel } from "@qwik-ui/headless";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LocaleContext, t } from "../i18n";
import { ProductCatalog } from "../components/product-catalog/product-catalog";
import { LoginTypeContext } from "./layout";

export default component$(() => {
  const locale = useContext(LocaleContext);
  const loginType = useContext(LoginTypeContext);
  const isTech = useComputed$(() => loginType.value === "tech");
  const hasCartItems = useSignal(false);
  const heroIndex = useSignal(0);
  const bentoIndex = useSignal(0);
  const carouselPaused = useSignal(false);
  const touchStartX = useSignal(0);
  const touchStartY = useSignal(0);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const check = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("ce_cart") || "[]");
        hasCartItems.value = cart.length > 0;
      } catch { hasCartItems.value = false; }
    };
    check();
    window.addEventListener("cart-updated", check);
    cleanup(() => window.removeEventListener("cart-updated", check));
  });

  // Carousel autoplay (manual to avoid qwik-ui serialization bug)
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const id = setInterval(() => {
      if (carouselPaused.value) return;
      heroIndex.value = (heroIndex.value + 1) % 2;
      bentoIndex.value = (bentoIndex.value + 1) % 2;
    }, 9000);
    // Resume autoplay when user clicks anywhere outside a carousel pagination
    const onDocClick = (e: MouseEvent) => {
      if (!carouselPaused.value) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.hero-carousel__dots, .hero-bento-carousel__dots')) {
        carouselPaused.value = false;
      }
    };
    document.addEventListener('click', onDocClick);
    cleanup(() => {
      clearInterval(id);
      document.removeEventListener('click', onDocClick);
    });
  });

  return (
    <div class="home-page">
      {/* Hero */}
      <section class="hero">
        <div class="hero__content">
          <div class="hero__text">
            <div class="hero__logo-group">
              <div class="hero-card-header dot-pattern dot-pattern--light">
                <a href="/" class="hero-card-header__logo">
                  <img src="/modernniagara-logo.png" alt="Modern Niagara" class="hero-card-header__logo-img" width="200" height="200" loading="eager" />
                  <div class="hero-card-header__brand">
                    <img src="/logo3.png" alt="Modern Niagara" class="hero-card-header__brand-text" width="408" height="61" loading="eager" />
                    <span class="hero-card-header__apparel">{t("logo.apparel", locale.value)}</span>
                  </div>
                </a>
                <nav class="hero-card-header__nav">
                  <a href="/" class="hero-card-header__nav-link active">{t("nav.home", locale.value)}</a>
                  <a href="/apparel/" class="hero-card-header__nav-link">{isTech.value ? t("teaser.workwear.title", locale.value) : t("nav.apparel", locale.value)}</a>
                </nav>
                <div class="hero-card-header__actions">
                  <button class="hero-card-header__btn" onClick$={() => {
                    const btn = document.querySelector('.locale-btn') as HTMLElement;
                    btn?.click();
                  }} aria-label="Language">
                    <span class="hero-card-header__locale-short">{locale.value === "en" ? "FR" : "EN"}</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                    <span class="hero-card-header__btn-label">{locale.value === "en" ? "Français" : "English"}</span>
                  </button>
                  <button class={`hero-card-header__btn ${hasCartItems.value ? "hero-card-header__btn--cart-active" : ""}`} onClick$={() => {
                    const btn = document.querySelector('.cart-btn') as HTMLElement;
                    btn?.click();
                  }} aria-label="Cart">
                    <span class="hero-card-header__btn-label">{t("cart.mycart", locale.value)}</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                  </button>
                  <button class="hero-card-header__btn hero-card-header__btn--logout" onClick$={() => {
                    const btn = document.querySelector('.logout-btn') as HTMLElement;
                    btn?.click();
                  }} aria-label={t("login.logout", locale.value)}>
                    <span class="hero-card-header__btn-label">{t("login.logout", locale.value)}</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </button>
                  <button class="hero-card-header__btn" onClick$={() => {
                    const btn = document.querySelector('.hamburger-btn') as HTMLElement;
                    btn?.click();
                  }} aria-label="Menu">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                  </button>
                </div>
              </div>
              <div class="hero__middle-section dot-pattern dot-pattern--light">
                <div class="hero__top-row">
                  <div class="hero__badge">
                    <span class="hero__badge-dot" />
                    {t("hero.badge", locale.value)}
                  </div>
                  <img src="/modernniagara-logo.png" alt="" class="hero__title-icon" width="200" height="200" loading="eager" decoding="sync" />
                </div>
                <img src="/logo3.png" alt="Modern Niagara" class="hero__title-img" width="408" height="61" loading="eager" decoding="sync" />
                <span class="hero__title-apparel">{t("logo.apparel", locale.value)}</span>
                <p class="hero__subtitle-inline">{t("hero.subtitle", locale.value)}</p>
                <div class="hero__logo-spacer hero__logo-spacer--mobile">
                  <img src="/carmichael-services/canada2.png" alt="Proudly Canadian" class="hero__logo-spacer-canada" loading="eager" />
                </div>
                <div class="hero__logo-spacer">
                  <img src="/carmichael-services/canada2.png" alt="Proudly Canadian" class="hero__logo-spacer-canada" loading="eager" />
                </div>
              </div>
              <Carousel.Root class="hero-carousel dot-pattern dot-pattern--light" bind:selectedIndex={heroIndex} align="start" draggable={false} rewind>
                <Carousel.Scroller
                  class="hero-carousel__scroller"
                  onClick$={() => { carouselPaused.value = true; heroIndex.value = (heroIndex.value + 1) % 2; }}
                  onTouchStart$={(e) => {
                    if (e.touches.length !== 1) return;
                    touchStartX.value = e.touches[0].clientX;
                    touchStartY.value = e.touches[0].clientY;
                  }}
                  onTouchEnd$={(e) => {
                    const t = e.changedTouches[0];
                    const dx = t.clientX - touchStartX.value;
                    const dy = t.clientY - touchStartY.value;
                    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
                    carouselPaused.value = true;
                    heroIndex.value = (heroIndex.value + 1) % 2;
                    bentoIndex.value = (bentoIndex.value + 1) % 2;
                  }}
                >
                  <Carousel.Slide class="hero-carousel__slide">
                    <img src="/carmichael-services/van-building.jpeg" alt="Modern Niagara van" loading="eager" />
                  </Carousel.Slide>
                  <Carousel.Slide class="hero-carousel__slide hero-carousel__slide--transparent hero-carousel__slide--white">
                    <img src="/modernniagara.webp" alt="Modern Niagara vintage car" loading="eager" />
                  </Carousel.Slide>
                </Carousel.Scroller>
                <Carousel.Pagination class="hero-carousel__dots" onClick$={() => { carouselPaused.value = true; }}>
                  <Carousel.Bullet class="hero-carousel__dot" />
                  <Carousel.Bullet class="hero-carousel__dot" />
                </Carousel.Pagination>
              </Carousel.Root>
              <div class="hero-bento">
                <Carousel.Root class="hero-bento-carousel dot-pattern dot-pattern--light" bind:selectedIndex={bentoIndex} align="start" draggable={false} rewind>
                  <Carousel.Scroller
                    class="hero-bento-carousel__scroller"
                    onClick$={() => { carouselPaused.value = true; bentoIndex.value = (bentoIndex.value + 1) % 2; }}
                    onTouchStart$={(e) => {
                      if (e.touches.length !== 1) return;
                      touchStartX.value = e.touches[0].clientX;
                      touchStartY.value = e.touches[0].clientY;
                    }}
                    onTouchEnd$={(e) => {
                      const t = e.changedTouches[0];
                      const dx = t.clientX - touchStartX.value;
                      const dy = t.clientY - touchStartY.value;
                      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
                      carouselPaused.value = true;
                      bentoIndex.value = (bentoIndex.value + 1) % 2;
                      heroIndex.value = (heroIndex.value + 1) % 2;
                    }}
                  >
                    <Carousel.Slide class="hero-bento-carousel__slide hero-bento-carousel__slide--van">
                      <img src="/carmichael-services/van-building.jpeg" alt="Modern Niagara van" loading="eager" />
                    </Carousel.Slide>
                    <Carousel.Slide class="hero-bento-carousel__slide hero-bento-carousel__slide--transparent hero-bento-carousel__slide--white">
                      <img src="/modernniagara.webp" alt="Modern Niagara vintage car" loading="eager" />
                    </Carousel.Slide>
                  </Carousel.Scroller>
                  <Carousel.Pagination class="hero-bento-carousel__dots" onClick$={() => { carouselPaused.value = true; }}>
                    <Carousel.Bullet class="hero-bento-carousel__dot" />
                    <Carousel.Bullet class="hero-bento-carousel__dot" />
                  </Carousel.Pagination>
                </Carousel.Root>
              </div>
              <div class="hero-categories">
                {isTech.value ? (<>
                  <a href="/apparel/" class="category-card category-card--tech-primary">
                    <picture>
                      <source media="(max-width: 767px)" srcset="/carmichael-services/chiller-retrofit.jpeg" />
                      <source media="(min-width: 768px) and (max-width: 1024px)" srcset="/carmichael-services/hvac-retrofit.jpeg" />
                      <img src="/carmichael-services/boiler-technicians.jpeg" alt="Work Wear" width="400" height="300" loading="eager" decoding="sync" />
                    </picture>
                    <span class="category-card__label">{t("teaser.workwear.title", locale.value)}</span>
                  </a>
                  <a href="/apparel/" class="category-card category-card--tech-extra category-card--tech-desktop">
                    <img src="/carmichael-services/careers.jpeg" alt="" width="400" height="300" loading="eager" decoding="sync" />
                  </a>
                  <a href="/apparel/" class="category-card category-card--tech-extra category-card--tech-desktop">
                    <img src="/carmichael-services/hvac-retrofit.jpeg" alt="" width="400" height="300" loading="eager" decoding="sync" />
                  </a>
                  <a href="/apparel/" class="category-card category-card--tech-extra category-card--tech-tablet">
                    <img src="/carmichael-services/chiller-retrofit.jpeg" alt="" width="400" height="300" loading="eager" decoding="sync" />
                  </a>
                </>) : (<>
                  <a href="/apparel/#work-wear" class="category-card">
                    <img src="/carmichael-services/boiler-technicians.jpeg" alt="Work Wear" width="400" height="300" loading="eager" decoding="sync" />
                    <span class="category-card__label">{t("teaser.workwear.title", locale.value)}</span>
                  </a>
                  <a href="/apparel/#jackets" class="category-card">
                    <img src="/carmichael-services/careers.jpeg" alt="Jackets" width="400" height="300" loading="eager" decoding="sync" />
                    <span class="category-card__label">{t("teaser.jackets.title", locale.value)}</span>
                  </a>
                  <a href="/apparel/#polos" class="category-card">
                    <img src="/carmichael-services/hvac-retrofit.jpeg" alt="Polos" width="400" height="300" loading="eager" decoding="sync" />
                    <span class="category-card__label">{t("teaser.polos.title", locale.value)}</span>
                  </a>
                  <a href="/apparel/#hats" class="category-card">
                    <img src="/hat/30109107PS2_FRONT.JPG" alt="Hats" width="400" height="300" loading="eager" decoding="sync" />
                    <span class="category-card__label">{t("teaser.hats.title", locale.value)}</span>
                  </a>
                </>)}
              </div>
            </div>
          </div>
        </div>

      </section>



      {/* Apparel Catalog */}
      <ProductCatalog />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Modern Niagara Apparel",
  meta: [
    { name: "description", content: "Modern Niagara Employee Apparel. Order branded jackets, polos, hats, and more." },
    { name: "robots", content: "noindex, nofollow" },
    { name: "theme-color", content: "#ffffff" },
    { property: "og:title", content: "Modern Niagara Apparel" },
    { property: "og:description", content: "Internal apparel ordering for Modern Niagara staff." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://modernniagaraapparel.ca/" },
    { property: "og:image", content: "https://modernniagaraapparel.ca/modernniagara-logo.png" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Modern Niagara Apparel" },
    { name: "twitter:description", content: "Internal apparel ordering for Modern Niagara staff." },
    { name: "twitter:image", content: "https://modernniagaraapparel.ca/modernniagara-logo.png" },
  ],
};
