#!/usr/bin/env python3
"""Brand Modern Niagara product blanks with the Modern Niagara logo.

Reads the placements saved in the sm SKU manager (src/data/placements.json,
keyed "<code>::modernniagara-<division>") and composites
public/logos/modernniagara.png onto each blank exactly the way the app previews
it (logo-overlay.tsx: the logo is object-contained inside the normalized
[x,y,w,h] box, then rotated). Output is flattened onto white and written to
mn2/public/sku, plus a .webp sibling — overwriting the plain blanks so the
DB's img/imgs paths (/sku/<file>) now serve the branded versions.

Re-run after re-cropping / re-placing logos in sm:
    python3 scripts/place-modernniagara-logos.py
"""
import json
from PIL import Image

SM = "/home/jvm/sm"
MN2 = "/home/jvm/mn2"
LOGO = f"{SM}/public/logos/modernniagara.png"  # Modern Niagara wordmark (single variant)

# (code, division, source blank in sm/public/skus, output file in mn2/public/sku)
# Output names match the img/imgs paths already stored on the DB rows.
TASKS = [
    ("102208", "service", "102208-black.png", "102208-black.png"),
    ("102208", "service", "102208-navy.png",  "102208-navy.png"),
]

placements = json.load(open(f"{SM}/src/data/placements.json"))
P = placements.get("placements", placements)
logo = Image.open(LOGO).convert("RGBA")

for code, division, src, out in TASKS:
    key = f"{code}::modernniagara-{division}"
    if key not in P:
        print(f"  ! no placement for {key}; skipping {out}")
        continue
    pl = P[key]
    base = Image.open(f"{SM}/public/skus/{src}").convert("RGBA")
    W, H = base.size
    bx, by = pl["x"] * W, pl["y"] * H
    bw, bh = pl["w"] * W, pl["h"] * H
    # object-contain the logo inside the box (preserve aspect, center)
    scale = min(bw / logo.width, bh / logo.height)
    lg = logo.resize((max(1, round(logo.width * scale)), max(1, round(logo.height * scale))), Image.LANCZOS)
    rot = pl.get("rotation", 0) or 0
    if rot:
        lg = lg.rotate(-rot, expand=True, resample=Image.BICUBIC)
    px = round(bx + (bw - lg.width) / 2)
    py = round(by + (bh - lg.height) / 2)
    base.alpha_composite(lg, (px, py))
    # flatten onto white (removes transparent-blank fuzz)
    flat = Image.new("RGBA", base.size, (255, 255, 255, 255))
    flat.alpha_composite(base)
    rgb = flat.convert("RGB")
    outp = f"{MN2}/public/sku/{out}"
    if out.lower().endswith((".jpg", ".jpeg")):
        rgb.save(outp, "JPEG", quality=92)
    else:
        rgb.save(outp, "PNG")
    rgb.save(outp.rsplit(".", 1)[0] + ".webp", "WEBP", quality=82)
    print(f"  branded {out}  (logo {lg.width}x{lg.height} @ {px},{py} on {W}x{H})")

print("done")
