import { component$, useSignal, useVisibleTask$, type CSSProperties } from "@builder.io/qwik";
import type { LogoBox } from "../../data/logo-placements";

interface LogoSlideProps {
  /** Blank garment base image (public-relative path). */
  base: string;
  /** Intrinsic aspect ratio (width / height) of the base image. */
  ar: number;
  /** Logo asset to overlay, or null to show the bare garment. */
  logo: string | null;
  /** Normalized placement box (fractions of the base image), or null. */
  box: LogoBox | null;
  /** Whether this slide is the visible one (drives the crossfade opacity). */
  active: boolean;
  alt: string;
  eager?: boolean;
}

/**
 * One carousel slide that renders a blank garment image with the MN logo
 * composited LIVE, instead of a pre-baked image.
 *
 * Both the garment and the logo are drawn as CSS background-images on <div>s,
 * not <img> elements. That is deliberate: a Qwik-hydrated <img> here fails to
 * paint until a user interaction, whereas a background-image div paints
 * immediately and letterboxes via `background-size: contain`.
 *
 * The garment div fills the panel and contains itself via CSS. The logo is
 * positioned with explicit pixels computed from the panel's measured size: we
 * reproduce the garment's object-contain rect, then place the logo using its
 * normalized box (fractions of the base image) mapped into that rect — matching
 * the sm bake pipeline (logo fit contain + centred in the box, then rotated).
 */
export const LogoSlide = component$<LogoSlideProps>((props) => {
  const hostRef = useSignal<HTMLDivElement>();
  const logoStyle = useSignal<CSSProperties>({ display: "none" });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    // Re-run when the placement, logo, base or aspect changes.
    track(() => props.box);
    track(() => props.ar);
    track(() => props.logo);
    track(() => props.base);

    const place = () => {
      // Read the host each call: on a fast card grid the ref can still be unset
      // when the visible task first fires, so a later rAF/observer call recovers
      // instead of leaving the logo unpositioned until the next remount.
      const host = hostRef.value;
      if (!host) return;
      const box = props.box;
      const logo = props.logo;
      if (!box || !logo) {
        logoStyle.value = { display: "none" };
        return;
      }
      const ar = props.ar;
      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (!cw || !ch) return;
      // Reproduce the garment's object-contain rect inside the panel.
      const R = cw / ch;
      let rw: number, rh: number, ox: number, oy: number;
      if (ar > R) {
        rw = cw; rh = cw / ar; ox = 0; oy = (ch - rh) / 2;
      } else {
        rh = ch; rw = ch * ar; oy = 0; ox = (cw - rw) / 2;
      }
      logoStyle.value = {
        position: "absolute",
        left: `${ox + box.x * rw}px`,
        top: `${oy + box.y * rh}px`,
        width: `${box.w * rw}px`,
        height: `${box.h * rh}px`,
        backgroundImage: `url("${logo}")`,
        transform: box.rotation ? `rotate(${box.rotation}deg)` : undefined,
      };
    };

    let ro: ResizeObserver | undefined;
    const observe = () => {
      const host = hostRef.value;
      if (host && !ro) { ro = new ResizeObserver(place); ro.observe(host); }
    };

    place();
    observe();
    // Recompute after layout settles (hydration/grid layout can run this before
    // the panel has its final size) and once more on the next frame.
    const raf = requestAnimationFrame(() => { observe(); place(); requestAnimationFrame(place); });
    cleanup(() => { cancelAnimationFrame(raf); ro?.disconnect(); });
  });

  return (
    <div ref={hostRef} class={`logo-slide ${props.active ? "active" : ""}`}>
      <div
        class="logo-slide__base"
        role="img"
        aria-label={props.alt}
        style={{ backgroundImage: `url("${props.base}")` }}
      />
      {props.logo && props.box && (
        <div class="logo-slide__logo" aria-hidden="true" style={logoStyle.value} />
      )}
    </div>
  );
});
