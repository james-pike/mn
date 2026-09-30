/**
 * Runtime logo placement config for products whose MN logo is positioned LIVE on
 * the PDP (blank garment base image + a CSS-positioned logo overlay) instead of
 * being pre-baked into the static webp. Lets a customer pick the logo POSITION
 * and STYLE without loading a new image — the overlay just moves / re-tints.
 *
 * Coordinate system (identical to the sm bake pipeline): a placement is a
 * NORMALIZED box { x, y, w, h } where all four are fractions 0..1 of the BASE
 * IMAGE's own width/height (x,y = top-left of the box). The logo is drawn
 * object-contain (aspect preserved) and centred inside that box, optionally
 * rotated `rotation` degrees clockwise. The overlay renderer converts these
 * image-space fractions to on-screen coordinates, accounting for the
 * object-contain letterboxing of the base image inside the carousel panel.
 *
 * Prototype scope: MN-34 (Travis Mathew Final Drive View Polo, style A48406).
 * The existing baked images under /public/final-drive are left untouched so the
 * product can always be reverted by dropping this config.
 */

export type LogoPosition = "left-chest" | "right-chest" | "sleeve";
export type LogoStyle = "tone" | "default";

export interface LogoBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Clockwise degrees about the box centre. */
  rotation: number;
}

/** Which garment view a position lives on. Chest positions show the front view;
 *  the sleeve position swaps the primary image to the side view. */
export type LogoViewKey = "front" | "side";

export interface LogoColorDef {
  /** Image-filename slug for this colour (matches /final-drive/<slug>*). */
  slug: string;
  /** Per-colour tone-on-tone logo (transparent PNG). */
  toneLogo: string;
  /** Default full MN logo for this colour: dark (bold) on light garments,
   *  white (invert) on dark garments — same rule the bake used. */
  defaultLogo: string;
  /** Blank base image per view (no MN logo baked in), with its intrinsic
   *  aspect ratio (width/height) so the overlay can reproduce the
   *  object-contain letterbox without waiting for the image to load. */
  views: Record<LogoViewKey, { src: string; ar: number }>;
  /** Normalized placement box per position, in THAT position's view. */
  boxes: Record<LogoPosition, LogoBox>;
}

export interface LogoPositionOption {
  id: LogoPosition;
  /** i18n-free short label; the PDP wraps it in its own styling. */
  label: string;
  view: LogoViewKey;
}

export interface LogoProductDef {
  /** Offered positions, in display order. */
  positions: LogoPositionOption[];
  defaultPosition: LogoPosition;
  defaultStyle: LogoStyle;
  /** Ordered view keys → the carousel slide order for this product. */
  views: LogoViewKey[];
  /** Keyed by lowercased colour hex. */
  colors: Record<string, LogoColorDef>;
}

/** Mirror a box horizontally (left chest → right chest). */
export function mirrorBox(b: LogoBox): LogoBox {
  return { ...b, x: 1 - b.x - b.w, rotation: -b.rotation };
}

// --- MN-34 Final Drive View Polo (A48406) ------------------------------------
// Chest is the sm front placement (A48406::modernniagara-service) RE-MAPPED into
// the cropped baked front (the sm stores full-image fractions; the mn2 front base
// is cropped, so y/h are divided by the crop). Sleeve boxes are the A48406::color
// placements from the sm (authored against the blank side view).

const FD_CHEST_START: LogoBox = {
  x: 0.180727, y: 0.232377,
  w: 0.252758, h: 0.20783, rotation: 0,
};

function fdColor(
  slug: string,
  dark: boolean,
  frontAr: number,
  sideAr: number,
  sleeve: LogoBox,
  chest: LogoBox = FD_CHEST_START,
): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${slug}.png`,
    // -bold has WHITE text (for dark garments); -invert has DARK text (for
    // light garments).
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/final-drive/${slug}.webp`, ar: frontAr },
      side: { src: `/final-drive/blank/${slug}-side.webp`, ar: sideAr },
    },
    boxes: {
      "left-chest": chest,
      "right-chest": mirrorBox(chest),
      sleeve,
    },
  };
}

// --- MN-11 Men's FootJoy Speckle Print Polo (16324) --------------------------
// Fronts + sides are square (ar 1.0). Fronts are MIRRORED so the wearer's left
// chest is presented; the chest box is the sm front placement mirrored to match
// (16324::modernniagara-service, x flipped). Sleeve is the sm navy side placement
// (16324::color::navy), applied to all three same-stance colours so they match.
const FJ_CHEST: LogoBox = {
  x: 0.5189613821761018, y: 0.2817467964351703,
  w: 0.1784919833752735, h: 0.10409099981406253, rotation: 0,
};
const FJ_SLEEVE_START: LogoBox = {
  x: 0.2117243076727642, y: 0.6993108485772357,
  w: 0.26419937754065037, h: 0.12863424161585366, rotation: 0,
};

function fjColor(slug: string, toneSlug: string, dark: boolean): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${toneSlug}.png`,
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/footjoy/blank/${slug}.webp`, ar: 1 },
      side: { src: `/footjoy/blank/${slug}-side.webp`, ar: 1 },
    },
    boxes: {
      "left-chest": FJ_CHEST,
      "right-chest": mirrorBox(FJ_CHEST),
      sleeve: FJ_SLEEVE_START,
    },
  };
}

// --- MN-12 Women's FootJoy Speckle Print Polo (96324) ------------------------
// Blank fronts are the sm master (ar ~0.972, varies slightly per colour), now
// MIRRORED so the wearer's left chest is presented; the chest box is the sm front
// placement mirrored to match (96324::modernniagara-service, x flipped). Side
// profiles are portrait (ar 0.806). Sleeve = sm side placement
// (96324::color::solaceblue), applied to both same-stance colours.
const FJW_CHEST_START: LogoBox = {
  x: 0.46269661511787424, y: 0.26606352812783496,
  w: 0.19833627585532743, h: 0.14309536178801793, rotation: 0,
};
const FJW_SLEEVE_START: LogoBox = {
  x: 0.17593656333616342, y: 0.5129938389227643,
  w: 0.29222793734563135, h: 0.19796223958333334, rotation: 0,
};

function fjColorW(slug: string, toneSlug: string, dark: boolean, frontAr: number): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${toneSlug}.png`,
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/footjoy/blank/womens-${slug}.webp`, ar: frontAr },
      side: { src: `/footjoy/blank/womens-${slug}-side.webp`, ar: 0.8061 },
    },
    boxes: {
      "left-chest": FJW_CHEST_START,
      "right-chest": mirrorBox(FJW_CHEST_START),
      sleeve: FJW_SLEEVE_START,
    },
  };
}

// --- MN-33 Heater Jersey Polo (A47463) ---------------------------------------
// Fronts are the logo-free baked TM fronts (the woven TravisMathew mark sits on
// the right chest, so right-chest is omitted). Side bases are the blank 3/4 side
// shots exported from the sm (ar 0.7944). balsamgreen + roastedcashew carry
// their real sm sleeve placements (A47463::color::*); the colours without a saved
// placement fall back to a STARTING sleeve box — tune those in the SM.
// Chest = the sm front placement (A47463::modernniagara-service), shared colours.
const HJ_CHEST_START: LogoBox = {
  x: 0.2894515959048479, y: 0.2782694994918699,
  w: 0.20338696928635952, h: 0.11602626397357724, rotation: 0,
};
const HJ_SLEEVE_START: LogoBox = { x: 0.3, y: 0.3, w: 0.22, h: 0.12, rotation: 0 };

function hjColor(
  slug: string,
  dark: boolean,
  frontAr: number,
  sleeve: LogoBox = HJ_SLEEVE_START,
  chest: LogoBox = HJ_CHEST_START,
): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${slug}.png`,
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/heater-jersey/${slug}-front.webp`, ar: frontAr },
      // Blank side is the sm side cropped by the shared A47463 side crop (all five
      // colours share one crop → one cropped ar).
      side: { src: `/heater-jersey/blank/${slug}-side.webp`, ar: 0.8694 },
    },
    boxes: {
      "left-chest": chest,
      "right-chest": mirrorBox(chest),
      sleeve,
    },
  };
}

// --- MN-32 Heater Polo (1MW395) ----------------------------------------------
// Logo-free baked TM fronts (front ar varies per colour); blank 3/4 side shots
// exported from the sm (ar 0.7945). Each colour carries its real sm sleeve
// placement (1MW395::color::*); the chest is a STARTING box — place it in the SM.
const HP_CHEST_START: LogoBox = { x: 0.3, y: 0.28, w: 0.2, h: 0.11, rotation: 0 };

function hpColor(
  slug: string,
  dark: boolean,
  frontAr: number,
  sideAr: number,
  sleeve: LogoBox,
  chest: LogoBox = HP_CHEST_START,
): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${slug}.png`,
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/heater/${slug}-front.webp`, ar: frontAr },
      // Blank side is the sm side cropped by that colour's own side crop, so the
      // cropped aspect ratio varies per colour.
      side: { src: `/heater/blank/${slug}-side.webp`, ar: sideAr },
    },
    boxes: {
      "left-chest": chest,
      "right-chest": mirrorBox(chest),
      sleeve,
    },
  };
}

// --- MN-35 Tour Ready 1/4 Zip (A48471) ---------------------------------------
// Logo-free baked TM fronts; blank side shots exported from the sm. Front + side
// aspect ratios vary per colour. Each colour carries its real sm sleeve placement
// (A48471::color::*); the chest is a STARTING box — place it in the SM.
const TR_CHEST_START: LogoBox = { x: 0.3, y: 0.28, w: 0.2, h: 0.11, rotation: 0 };

function trColor(
  slug: string,
  dark: boolean,
  frontAr: number,
  sideAr: number,
  sleeve: LogoBox,
  chest: LogoBox = TR_CHEST_START,
): LogoColorDef {
  return {
    slug,
    toneLogo: `/logos/tone/modernniagara-${slug}.png`,
    defaultLogo: dark ? "/logos/modernniagara-bold.png" : "/logos/modernniagara-invert.png",
    views: {
      front: { src: `/tour-ready/${slug}.webp`, ar: frontAr },
      side: { src: `/tour-ready/blank/${slug}-side.webp`, ar: sideAr },
    },
    boxes: {
      "left-chest": chest,
      "right-chest": mirrorBox(chest),
      sleeve,
    },
  };
}

export const LOGO_PRODUCTS: Record<string, LogoProductDef> = {
  "MN-11": {
    positions: [
      { id: "left-chest", label: "Left chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "default",
    views: ["front", "side"],
    colors: {
      "#1a1a18": fjColor("black", "fjblack", true),
      "#6b8bb0": fjColor("solaceblue", "solaceblue", false),
      "#2c3e50": fjColor("navy", "navy", true),
    },
  },
  "MN-12": {
    positions: [
      { id: "left-chest", label: "Left chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "tone",
    views: ["front", "side"],
    colors: {
      "#6b8bb0": fjColorW("solaceblue", "solaceblue", false, 0.9716),
      "#1a1a18": fjColorW("black", "fjblack", true, 0.9723),
    },
  },
  "MN-34": {
    positions: [
      // The woven TravisMathew mark sits on the wearer's left chest, so the MN
      // logo goes on the right chest. The placement box is keyed "left-chest"
      // (viewer-left = wearer-right); only the shown label is wearer-perspective.
      { id: "left-chest", label: "Right chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "tone",
    views: ["front", "side"],
    colors: {
      "#9caf88": fdColor("greenbay", true, 0.6034, 0.8642, {
        x: 0.21002081981351792, y: 0.48482697315705126,
        w: 0.29620696045289313, h: 0.20380909455128207, rotation: 0,
      }),
      "#1a1a18": fdColor("black", true, 0.6011, 0.7991, {
        x: 0.22657049864539747, y: 0.45850986578525643,
        w: 0.30034885574588543, h: 0.23229842748397436, rotation: 0,
      }),
      // white side re-cropped to match black/greenbay framing; sideAr + sleeve
      // box re-mapped into the cropped blank/white-side.webp (was 0.6513 full).
      "#ffffff": fdColor("white", false, 0.6034, 0.7994, {
        x: 0.2075, y: 0.515731,
        w: 0.334707, h: 0.263204, rotation: 0,
      }),
    },
  },
  "MN-33": {
    positions: [
      { id: "left-chest", label: "Right chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "default",
    views: ["front", "side"],
    colors: {
      // Sleeve boxes are the sm A47463::color::* placements remapped into the
      // cropped side view (crop applied to the blank, so the box lives in crop space).
      "#1a1a18": hjColor("black", true, 0.8404, {
        x: 0.335000, y: 0.359865, w: 0.221609, h: 0.131543, rotation: 0,
      }),
      "#ffffff": hjColor("white", false, 0.8438, {
        x: 0.356821, y: 0.354368, w: 0.201020, h: 0.142963, rotation: 0,
      }),
      "#758073": hjColor("balsamgreen", true, 0.8438, {
        x: 0.350156, y: 0.350661, w: 0.182504, h: 0.114709, rotation: 0,
      }),
      "#2a3a49": hjColor("totaleclipse", true, 0.8438, {
        x: 0.370598, y: 0.355346, w: 0.205703, h: 0.139449, rotation: 0,
      }),
      "#baa591": hjColor("roastedcashew", true, 0.8438, {
        x: 0.375073, y: 0.349638, w: 0.186094, h: 0.130118, rotation: 0,
      }),
    },
  },
  "MN-32": {
    positions: [
      { id: "left-chest", label: "Right chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "tone",
    views: ["front", "side"],
    colors: {
      // Sleeve boxes are the sm 1MW395::color::* placements remapped into each
      // colour's cropped side view; sideAr is that colour's cropped aspect ratio.
      "#47536b": hpColor("vintageindigo", true, 0.877, 0.9084, {
        x: 0.300871, y: 0.477386, w: 0.233822, h: 0.178609, rotation: 0,
      }, {
        // Front chest = per-colour 1MW395::chest::vintageindigo remapped through
        // vintageindigo's front crop. Other colours keep their existing chest boxes.
        x: 0.282867, y: 0.273998, w: 0.183020, h: 0.129232, rotation: 0,
      }),
      "#517fa4": hpColor("copenblue", true, 0.8152, 0.8600, {
        x: 0.297860, y: 0.463287, w: 0.242773, h: 0.248885, rotation: 0,
      }),
      "#ca7988": hpColor("heatherscooter", true, 0.8986, 0.8046, {
        x: 0.223594, y: 0.230880, w: 0.250889, h: 0.729047, rotation: 0,
      }, {
        // red front is uncropped (no /skus/1MW395-heatherscooter.jpg crop), so
        // the sm modernniagara-service front chest applies raw (no remap).
        x: 0.28357569496716556, y: 0.25587207825203256,
        w: 0.20697276074722198, h: 0.1120922256097561, rotation: 0,
      }),
      "#1a1a18": hpColor("black", true, 0.8647, 0.7954, {
        x: 0.188692, y: 0.402110, w: 0.231112, h: 0.198422, rotation: 0,
      }),
    },
  },
  "MN-35": {
    positions: [
      { id: "left-chest", label: "Right chest", view: "front" },
      { id: "sleeve", label: "Right sleeve", view: "side" },
    ],
    defaultPosition: "left-chest",
    defaultStyle: "default",
    views: ["front", "side"],
    colors: {
      // chest = per-colour A48471::chest::* placement remapped through each colour's
      // front crop (the mn2 front base is the cropped baked front).
      "#3b4657": trColor("heathernavy", true, 0.6205, 0.3768, {
        x: 0.1585644172755802, y: 0.34693378307731393,
        w: 0.4063906376789473, h: 0.23635354371873044, rotation: 0,
      }, {
        x: 0.185903, y: 0.220131, w: 0.263429, h: 0.207742, rotation: 0,
      }),
      "#1a1a18": trColor("black", true, 0.634, 0.4011, {
        x: 0.11337897862396987, y: 0.3359857784650563,
        w: 0.47233440619642164, h: 0.2920898254280019, rotation: 0,
      }, {
        x: 0.247521, y: 0.247979, w: 0.255280, h: 0.188666, rotation: 0,
      }),
    },
  },
};

export function getLogoConfig(sku: string): LogoProductDef | null {
  return LOGO_PRODUCTS[sku] ?? null;
}

export function logoAsset(color: LogoColorDef, style: LogoStyle): string {
  return style === "tone" ? color.toneLogo : color.defaultLogo;
}
