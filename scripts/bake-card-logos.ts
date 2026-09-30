/**
 * Bake a static "card" image per logo product + colour: the logo-free front base
 * with the DEFAULT chest logo (left-chest box, the product's default style)
 * composited on, exactly as the PDP/card overlay renders it live. Catalog cards
 * then show this single flat image instead of a base + CSS logo overlay, so the
 * logo is always present and never pops in on a colour switch.
 *
 * Output: sibling of each front, "<front>-logo.webp" (e.g. /heater/black-front.webp
 * -> /heater/black-front-logo.webp). The live PDP still uses the logo-free front.
 *
 *   npx tsx scripts/bake-card-logos.ts
 */
import sharp from "sharp";
import { existsSync } from "fs";
import { join } from "path";
import { LOGO_PRODUCTS } from "../src/data/logo-placements";

const PUB = "public";
export const cardLogoSrc = (frontSrc: string) => frontSrc.replace(/\.webp$/i, "-logo.webp");

let ok = 0, skip = 0;
for (const [sku, def] of Object.entries(LOGO_PRODUCTS)) {
  for (const [hex, cd] of Object.entries(def.colors)) {
    const frontPath = join(PUB, cd.views.front.src);
    const logoRel = def.defaultStyle === "default" ? cd.defaultLogo : cd.toneLogo;
    const logoPath = join(PUB, logoRel);
    const outPath = join(PUB, cardLogoSrc(cd.views.front.src));
    if (!existsSync(frontPath) || !existsSync(logoPath)) {
      console.log(`  SKIP ${sku} ${cd.slug}: missing ${!existsSync(frontPath) ? frontPath : logoPath}`);
      skip++; continue;
    }
    const box = cd.boxes["left-chest"];
    // Cards render at ~440px; 880 covers retina. Downscale + q80 keeps these
    // optimized (the front sources are ~1000-1300px).
    const baseBuf = await sharp(frontPath).resize({ width: 880, withoutEnlargement: true }).toBuffer();
    const base = sharp(baseBuf);
    const meta = await base.metadata();
    const W = meta.width!, H = meta.height!;
    const bw = box.w * W, bh = box.h * H, bx = box.x * W, by = box.y * H;
    // object-contain the logo inside the box (matches CSS background-size: contain)
    let logo = sharp(logoPath).resize({
      width: Math.max(1, Math.round(bw)),
      height: Math.max(1, Math.round(bh)),
      fit: "inside",
    });
    if (box.rotation) logo = logo.rotate(box.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    const lbuf = await logo.png().toBuffer();
    const lmeta = await sharp(lbuf).metadata();
    const left = Math.round(bx + (bw - lmeta.width!) / 2);
    const top = Math.round(by + (bh - lmeta.height!) / 2);
    await base
      .composite([{ input: lbuf, left, top }])
      .webp({ quality: 80 })
      .toFile(outPath);
    console.log(`  baked ${sku} ${cd.slug.padEnd(14)} -> ${outPath}`);
    ok++;
  }
}
console.log(`\n${ok} baked, ${skip} skipped`);
