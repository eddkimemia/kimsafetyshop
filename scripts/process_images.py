"""Product image processing service.

Automatically processes every product image into a premium PPE / workwear
catalogue advertisement:
  1. Remove background -> transparent cutout (presentation only)
  2. Crop to the product and center it in the main visual area
  3. Compose a 1200x1200 branded commercial advertisement:
       Top    -> KIM SAFETY SOLUTIONS logo + subtle orange/blue divider
       Middle -> the product, VERY LARGE and dominant, untouched, with a
                 soft drop shadow and minimal blue/orange accents
       Bottom -> compact deep navy footer with ORDER NOW + phone/WhatsApp
                 + website
  4. Compress to high-quality WebP + JPEG
  5. Save both the original and the processed image

The physical product is never altered: original colors are preserved, no
brightness/contrast/sharpness filters are applied, and the product pixels
are only cropped/resized to fit the layout.

Usage:
    python process_images.py [--input images] [--output output] [--size 1200]
                             [--workers 4] [--formats webp,jpeg] [--dry-run]
                              [--in-place] [--no-branding] [--logo ../logo/logoy.jpg]
                              [--template product_template.jpg] [--title 'PRODUCT NAME']  # legacy, not displayed
                             [--website www.kimsafety.co.ke]
                             [--email sales@kimsafety.co.ke] [--phone '+254 715 135 141']
"""

import argparse
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from rembg import new_session, remove

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

WHITE = (255, 255, 255, 255)
NAVY = (15, 40, 71)            # deep KIM SAFETY blue (#0F2847)
ORANGE = (245, 124, 0)         # brand orange (#F57C00)
RED = (239, 68, 68)            # limited accent (#EF4444)
INPUT_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

WEBSITE = "www.kimsafety.co.ke"
EMAIL = "sales@kimsafety.co.ke"
PHONE = "+254 715 135 141"

_session = None
_session_lock = Lock()


def get_session() -> "new_session":
    """Lazily create one shared u2net session (thread-safe inference)."""
    global _session
    if _session is None:
        with _session_lock:
            if _session is None:
                _session = new_session("u2net", model_dir=MODEL_DIR)
    return _session


def load_image(path: str) -> Image.Image:
    with Image.open(path) as im:
        im.load()
        if getattr(im, "is_animated", False):
            im.seek(0)
        im = ImageOps.exif_transpose(im)
        if im.mode in ("P", "L", "CMYK"):
            im = im.convert("RGBA")
        elif im.mode != "RGBA":
            im = im.convert("RGBA")
        return im.copy()


def remove_background(img: Image.Image) -> Image.Image:
    """Remove background with rembg; fall back to border flood-fill if it fails."""
    cutout = None
    try:
        cutout = remove(img.convert("RGB"), session=get_session())
        if cutout is None or cutout.mode != "RGBA":
            cutout = None
        elif mask_coverage(cutout) < 0.01:
            cutout = None
    except Exception:
        cutout = None

    if cutout is not None:
        return cutout

    return fallback_cutout(img)


def mask_coverage(img: Image.Image) -> float:
    alpha = np.asarray(img.getchannel("A"))
    return float((alpha > 8).sum()) / max(alpha.size, 1)


def fallback_cutout(img: Image.Image) -> Image.Image:
    """Fallback: remove near-white/near-border backgrounds via flood fill."""
    arr = np.asarray(img.convert("RGB"), dtype=np.int16)
    h, w, _ = arr.shape

    # Pixels that differ from the corner color are "foreground"
    corner = arr[0, 0]
    diff = np.abs(arr - corner).sum(axis=2)
    fg_mask = diff > 60

    # Flood fill from all border pixels to label connected background
    visited = np.zeros((h, w), dtype=bool)
    stack = [(0, c) for c in range(w)] + [(h - 1, c) for c in range(w)]
    stack += [(r, 0) for r in range(h)] + [(r, w - 1) for r in range(h)]
    while stack:
        r, c = stack.pop()
        if not (0 <= r < h and 0 <= c < w) or visited[r, c] or fg_mask[r, c]:
            continue
        visited[r, c] = True
        stack.extend([(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)])

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    # Feather edges to avoid harsh borders
    from PIL import ImageFilter as _F

    alpha_img = Image.fromarray(alpha, "L").filter(_F.MaxFilter(3)).filter(_F.GaussianBlur(1.5))
    result = img.copy()
    result.putalpha(alpha_img)
    return result


def crop_and_center(cutout: Image.Image, size: int = 1200, fill_ratio: float = 0.95) -> Image.Image:
    """Crop to the product bounding box (with padding), center it and paste
    onto a pure white canvas sized `size` x `size`."""
    bbox = cutout.getchannel("A").getbbox()
    if bbox is None:
        bbox = (0, 0, cutout.width, cutout.height)

    left, top, right, bottom = bbox
    pad_x = max(1, int((right - left) * 0.04))
    pad_y = max(1, int((bottom - top) * 0.04))
    crop = cutout.crop(
        (
            max(0, left - pad_x),
            max(0, top - pad_y),
            min(cutout.width, right + pad_x),
            min(cutout.height, bottom + pad_y),
        )
    )

    target = int(size * fill_ratio)
    scale = target / max(crop.width, crop.height)
    if scale < 1:
        crop = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))),
                           Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), WHITE)
    x = (size - crop.width) // 2
    y = (size - crop.height) // 2
    canvas.paste(crop, (x, y), crop)
    return canvas


def resolve_script_path(p: str) -> str:
    """Resolve a path relative to this script's directory."""
    if not p:
        return p
    if os.path.isabs(p):
        return p
    return os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), p))


def find_font(bold: bool = False, px: int = 30) -> ImageFont.FreeTypeFont | None:
    """Pick a usable TTF font (Windows + Debian fallbacks)."""
    name = "arialbd.ttf" if bold else "arial.ttf"
    segoe = "segoeuib.ttf" if bold else "segoeui.ttf"
    dejavu = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    candidates = [
        os.path.join("C:/Windows/Fonts", name),
        os.path.join("C:/Windows/Fonts", segoe),
        f"/usr/share/fonts/truetype/dejavu/{dejavu}",
        f"/usr/share/fonts/TTF/{dejavu}",
        f"/usr/lib/fonts/{dejavu}",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, px)
            except Exception:
                continue
    return None


def crop_product(cutout: Image.Image) -> Image.Image:
    """Crop a cutout to its product bounding box (with a small padding).
    Unlike ``crop_and_center`` this does NOT paste it onto a canvas, so the
    ad layout can place the product with its natural aspect ratio."""
    bbox = cutout.getchannel("A").getbbox()
    if bbox is None:
        return cutout
    left, top, right, bottom = bbox
    pad_x = max(1, int((right - left) * 0.04))
    pad_y = max(1, int((bottom - top) * 0.04))
    return cutout.crop(
        (
            max(0, left - pad_x),
            max(0, top - pad_y),
            min(cutout.width, right + pad_x),
            min(cutout.height, bottom + pad_y),
        )
    )


def _draw_tracked_text(
    d: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: int = 0,
) -> None:
    """Draw text with manual letter-spacing (PIL has no built-in tracking)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += int(d.textlength(ch, font=font)) + tracking


def _soft_shadow(product: Image.Image, blur: int, alpha: float = 0.22) -> Image.Image:
    """Build a blurred navy drop-shadow from the product's alpha silhouette."""
    shadow = Image.new("RGBA", product.size, NAVY + (0,))
    shadow.putalpha(product.getchannel("A").point(lambda a: int(a * alpha)))
    return shadow.filter(ImageFilter.GaussianBlur(blur))


def clean_title(stem: str) -> str:
    """Derive an ad title from a filename stem (drop gallery ' (2)' suffixes)."""
    s = re.sub(r"\s*\(\d+\)\s*$", "", stem)
    return " ".join(s.split()).upper()


def _wrap_text(d: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    """Greedy word-wrap to fit `max_width` pixels."""
    lines: list[str] = []
    cur = ""
    for word in text.split():
        test = f"{cur} {word}".strip()
        if d.textlength(test, font=font) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [text]


def template_layout(
    img: Image.Image,
    template_path: str | None,
    size: int = 1200,
) -> Image.Image | None:
    """Place the product cutout on the product_template.jpg background.

    The template fills the whole canvas (no drawn header/footer/CTA); the
    product keeps its natural aspect ratio, is centered and gets a soft
    shadow. Returns None if the template cannot be loaded/used, in which
    case the caller falls back to the normal ad layout.
    """
    if not template_path or not os.path.exists(template_path):
        return None
    S = int(size)
    try:
        with Image.open(template_path) as tpl:
            tpl = ImageOps.exif_transpose(tpl).convert("RGBA")
        canvas = tpl.resize((S, S), Image.LANCZOS)
    except Exception:
        return None

    img = img.convert("RGBA")
    pw, ph = img.size

    max_w = int(S * 0.80)
    max_h = int(S * 0.66)
    scale = min(max_w / max(pw, 1), max_h / max(ph, 1))

    nw = max(1, int(pw * scale))
    nh = max(1, int(ph * scale))
    product = img.resize((nw, nh), Image.LANCZOS)

    px = (S - nw) // 2
    py = (S - nh) // 2

    shadow = _soft_shadow(
        product,
        blur=max(6, int(S * 0.014)),
        alpha=0.16,
    )
    canvas.alpha_composite(shadow, (px, py + int(S * 0.012)))
    canvas.alpha_composite(product, (px, py))
    return canvas.convert("RGBA")


def ad_layout(
    img: Image.Image,
    size: int = 1200,
    logo_path: str | None = None,
    website: str = WEBSITE,
    email: str = EMAIL,
    phone: str = PHONE,
    title: str = "",
) -> Image.Image:
    """Create a clean 1:1 KIM SAFETY product advertisement.

    Design rules:
      * White/light background
      * KIM SAFETY logo at the top
      * Product is the hero and occupies most of the canvas
      * No product title, feature lists, or paragraphs
      * Minimal blue/orange accents
      * Bottom CTA: ORDER NOW + phone/WhatsApp + website
      * The product pixels are never color/brightness/contrast filtered
    """
    S = int(size)
    img = img.convert("RGBA")

    canvas = Image.new("RGBA", (S, S), WHITE)
    d = ImageDraw.Draw(canvas)

    # ---- Layout zones ----
    header_h = int(S * 0.14)
    footer_y = int(S * 0.84)
    footer_h = S - footer_y

    # ================= HEADER / LOGO =================
    if logo_path and os.path.exists(logo_path):
        try:
            with Image.open(logo_path) as logo_src:
                logo = ImageOps.exif_transpose(logo_src).convert("RGBA")

            # Keep the logo compact and centered.
            max_logo_w = int(S * 0.30)
            max_logo_h = int(S * 0.105)
            scale = min(
                max_logo_w / max(logo.width, 1),
                max_logo_h / max(logo.height, 1),
            )
            logo_w = max(1, int(logo.width * scale))
            logo_h = max(1, int(logo.height * scale))
            logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

            canvas.alpha_composite(
                logo,
                ((S - logo_w) // 2, int((header_h - logo_h) * 0.42)),
            )
        except Exception:
            pass

    # Minimal brand divider: thin blue line with a short orange center.
    divider_y = int(S * 0.125)
    d.line(
        [(int(S * 0.07), divider_y), (int(S * 0.93), divider_y)],
        fill=(222, 230, 239, 255),
        width=max(2, int(S * 0.0018)),
    )
    accent_w = int(S * 0.11)
    accent_h = max(3, int(S * 0.004))
    accent_x = (S - accent_w) // 2
    d.rectangle(
        [accent_x, divider_y - accent_h // 2,
         accent_x + accent_w, divider_y + accent_h // 2],
        fill=ORANGE,
    )

    # ================= SUBTLE BACKGROUND GRAPHICS =================
    # Very faint safety/technical ring. Decorative only; never competes with product.
    ring_box = [
        int(S * 0.12), int(S * 0.22),
        int(S * 0.88), int(S * 0.84),
    ]
    d.ellipse(
        ring_box,
        outline=(232, 239, 247, 210),
        width=max(3, int(S * 0.006)),
    )

    # Small orange/blue accent strokes.
    d.arc(
        [int(S * 0.12), int(S * 0.34), int(S * 0.30), int(S * 0.52)],
        150, 235,
        fill=ORANGE,
        width=max(4, int(S * 0.006)),
    )
    d.ellipse(
        [int(S * 0.75), int(S * 0.20), int(S * 0.80), int(S * 0.25)],
        fill=(222, 232, 244, 210),
    )

    # ================= PRODUCT HERO =================
    # Product is intentionally much larger than the old template.
    # Different aspect ratios are handled automatically.
    pw, ph = img.size

    available_top = int(S * 0.155)
    available_bottom = footer_y - int(S * 0.015)
    available_h = available_bottom - available_top

    # Wide products (boots, masks, kits) can use more width.
    # Tall products (coveralls, coats) use more height.
    max_w = int(S * 0.80)
    max_h = int(S * 0.66)

    scale = min(
        max_w / max(pw, 1),
        max_h / max(ph, 1),
    )

    nw = max(1, int(pw * scale))
    nh = max(1, int(ph * scale))
    product = img.resize((nw, nh), Image.LANCZOS)

    px = (S - nw) // 2
    py = available_top + max(0, (available_h - nh) // 2)

    # Soft neutral/navy grounding shadow, deliberately subtle.
    shadow = _soft_shadow(
        product,
        blur=max(6, int(S * 0.014)),
        alpha=0.16,
    )
    canvas.alpha_composite(
        shadow,
        (px, py + int(S * 0.012)),
    )
    canvas.alpha_composite(product, (px, py))

    # ================= SALES FOOTER =================
    # Compact footer leaves more space for the product.
    d.rectangle(
        [0, footer_y, S, S],
        fill=NAVY,
    )

    # Orange top edge.
    d.rectangle(
        [0, footer_y, S, footer_y + int(S * 0.006)],
        fill=ORANGE,
    )

    # CTA button.
    btn_x = int(S * 0.065)
    btn_y = footer_y + int(S * 0.045)
    btn_w = int(S * 0.34)
    btn_h = int(S * 0.075)

    d.rounded_rectangle(
        [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
        radius=max(8, int(S * 0.012)),
        fill=ORANGE,
    )

    font_cta = find_font(True, int(S * 0.026))
    if font_cta:
        d.text(
            (btn_x + btn_w / 2, btn_y + btn_h / 2),
            "ORDER NOW",
            font=font_cta,
            fill=WHITE,
            anchor="mm",
        )

    # Contact block — deliberately large and easy to read.
    contact_x = int(S * 0.46)
    contact_center_y = footer_y + int(S * 0.073)

    font_phone = find_font(True, int(S * 0.022))
    font_meta = find_font(False, int(S * 0.014))

    if font_phone:
        d.text(
            (contact_x, contact_center_y - int(S * 0.018)),
            f"CALL / WHATSAPP  {phone}",
            font=font_phone,
            fill=WHITE,
            anchor="lm",
        )

    if font_meta:
        d.text(
            (contact_x, contact_center_y + int(S * 0.026)),
            website,
            font=font_meta,
            fill=(190, 207, 226, 255),
            anchor="lm",
        )

    return canvas.convert("RGBA")


def save_outputs(img: Image.Image, stem: str, out_dir: str, formats: list[str], quality: int) -> dict:
    """Save processed image in the requested formats; returns byte sizes."""
    sizes = {}
    rgb = img.convert("RGB")
    for fmt in formats:
        path = os.path.join(out_dir, f"{stem}.{fmt}")
        if fmt == "webp":
            rgb.save(path, "WEBP", quality=quality, method=6)
        else:
            rgb.save(path, "JPEG", quality=quality, subsampling=0, optimize=True)
        sizes[fmt] = os.path.getsize(path)
    return sizes


def process_one(args: dict) -> dict:
    src, out_orig, out_proc, size, formats, quality = (
        args["src"],
        args["out_orig"],
        args["out_proc"],
        args["size"],
        args["formats"],
        args["quality"],
    )
    stem = os.path.splitext(os.path.basename(src))[0]
    start = time.perf_counter()

    try:
        original = load_image(src)
        cutout = remove_background(original)

        if args.get("no_branding"):
            processed = crop_and_center(cutout, size)
        else:
            processed = template_layout(
                crop_product(cutout),
                args.get("template"),
                size,
            ) or ad_layout(
                crop_product(cutout),
                size,
                args.get("logo"),
                website=args.get("website") or WEBSITE,
                email=args.get("email") or EMAIL,
                phone=args.get("phone") or PHONE,
                title="",  # intentionally no product-title block in the clean sales layout
            )

        if args.get("in_place"):
            # Keep a safety copy of the original, then write the processed
            # image back over the source so the site picks it up directly.
            os.makedirs(out_orig, exist_ok=True)
            original.convert("RGB").save(
                os.path.join(out_orig, os.path.basename(src)), quality=quality, optimize=True
            )
            ext = os.path.splitext(src)[1].lower()
            rgb = processed.convert("RGB")
            if ext in (".jpg", ".jpeg"):
                rgb.save(src, "JPEG", quality=quality, subsampling=0, optimize=True)
            elif ext == ".png":
                rgb.save(src, "PNG", optimize=True)
            elif ext == ".webp":
                rgb.save(src, "WEBP", quality=quality, method=6)
            else:
                rgb.save(src, quality=quality, optimize=True)
            sizes = {"in_place": os.path.getsize(src)}
        else:
            orig_ext = os.path.splitext(src)[1].lower()
            original.convert("RGB").save(
                os.path.join(out_orig, f"{stem}{orig_ext}"), quality=quality, optimize=True
            )
            sizes = save_outputs(processed, stem, out_proc, formats, quality)

        return {
            "source": os.path.basename(src),
            "status": "ok",
            "seconds": round(time.perf_counter() - start, 2),
            "original_size": os.path.getsize(src),
            "processed_bytes": sizes,
            "outputs": [os.path.basename(src)] if args.get("in_place") else [f"{stem}.{fmt}" for fmt in formats],
        }
    except Exception as e:
        return {
            "source": os.path.basename(src),
            "status": "error",
            "error": f"{type(e).__name__}: {e}",
            "seconds": round(time.perf_counter() - start, 2),
        }


def collect_images(input_dir: str) -> list[str]:
    found = []
    for root, _, files in os.walk(input_dir):
        for name in sorted(files):
            if os.path.splitext(name)[1].lower() in INPUT_EXTS:
                found.append(os.path.join(root, name))
    return found


def main() -> None:
    ap = argparse.ArgumentParser(description="Product image processing service")
    ap.add_argument("--input", default="images", help="input directory (default: images)")
    ap.add_argument("--output", default="output", help="output directory (default: output)")
    ap.add_argument("--size", type=int, default=1200, help="canvas size in px (default: 1200)")
    ap.add_argument("--quality", type=int, default=92, help="compression quality (default: 92)")
    ap.add_argument("--workers", type=int, default=4, help="parallel workers (default: 4)")
    ap.add_argument("--formats", default="webp,jpeg", help="comma-separated formats (default: webp,jpeg)")
    ap.add_argument("--dry-run", action="store_true", help="list files without processing")
    ap.add_argument("--files", nargs="*", help="process only these filenames")
    ap.add_argument("--in-place", action="store_true", help="write processed images back over the source files (originals backed up to <output>/original)")
    ap.add_argument("--no-branding", action="store_true", help="skip the ad layout (plain white square image only)")
    ap.add_argument("--logo", default="../logo/logoy.jpg", help="path to the KimSafety logo (relative to this script)")
    ap.add_argument("--template", default="product_template.jpg", help="background template image used in place of the drawn ad layout (relative to this script)")
    ap.add_argument("--title", default=None, help="legacy option; title is intentionally not displayed in the clean ad")
    ap.add_argument("--website", default=WEBSITE, help="website text shown in the ad footer")
    ap.add_argument("--email", default=EMAIL, help="email shown in the ad footer")
    ap.add_argument("--phone", default=PHONE, help="phone shown in the ad footer")
    ap.add_argument("--contact", default=None, help="legacy combined 'email · phone' line; overrides --email/--phone when given")
    args = ap.parse_args()

    # Legacy --contact support: split 'email · phone' into separate fields.
    email, phone = args.email, args.phone
    if args.contact:
        parts = [p.strip() for p in args.contact.split("·")]
        if parts and parts[0]:
            email = parts[0]
        if len(parts) > 1 and parts[1]:
            phone = parts[1]

    formats = [f.strip().lower() for f in args.formats.split(",") if f.strip()]
    for fmt in formats:
        if fmt not in ("webp", "jpeg"):
            ap.error(f"unsupported format: {fmt}")

    logo_path = resolve_script_path(args.logo) if not args.no_branding else None
    template_path = resolve_script_path(args.template) if not args.no_branding else None
    if template_path and not os.path.exists(template_path):
        template_path = None

    images = collect_images(args.input)
    if args.files:
        images = [p for p in images if os.path.basename(p) in args.files]
    if not images:
        print("No images found.")
        sys.exit(1)

    print(f"Found {len(images)} images")

    if args.dry_run:
        for p in images:
            print(p)
        return

    out_orig = os.path.join(args.output, "original")
    out_proc = os.path.join(args.output, "processed")
    os.makedirs(out_orig, exist_ok=True)
    os.makedirs(out_proc, exist_ok=True)

    jobs = [
        {
            "src": p,
            "out_orig": out_orig,
            "out_proc": out_proc,
            "size": args.size,
            "formats": formats,
            "quality": args.quality,
            "in_place": args.in_place,
            "no_branding": args.no_branding,
            "logo": logo_path,
            "template": template_path,
            "title": args.title,
            "website": args.website,
            "email": email,
            "phone": phone,
        }
        for p in images
    ]

    results = []
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process_one, job): job["src"] for job in jobs}
        for i, fut in enumerate(as_completed(futures), 1):
            res = fut.result()
            results.append(res)
            tag = "OK " if res["status"] == "ok" else "ERR"
            extra = "" if res["status"] == "ok" else f" -> {res.get('error', '')}"
            print(f"[{i}/{len(jobs)}] [{tag}] {res['source']}{extra}")

    ok = [r for r in results if r["status"] == "ok"]
    failed = [r for r in results if r["status"] != "ok"]

    report = {
        "config": {
            "input": args.input,
            "output": args.output,
            "size": args.size,
            "quality": args.quality,
            "formats": formats,
        },
        "total": len(results),
        "ok": len(ok),
        "failed": len(failed),
        "elapsed_seconds": round(time.perf_counter() - t0, 2),
        "results": results,
    }
    report_path = os.path.join(args.output, "processing_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    total_bytes = sum(v for r in ok for v in r["processed_bytes"].values())
    print(f"\nDone: {len(ok)} ok, {len(failed)} failed, {report['elapsed_seconds']}s")
    print(f"Processed images: {os.path.abspath(out_proc)}")
    print(f"Original images:  {os.path.abspath(out_orig)}")
    print(f"Report:           {os.path.abspath(report_path)}")
    if total_bytes:
        print(f"Output size: {total_bytes / 1024 / 1024:.1f} MB")
    if failed:
        print("\nFailed files:")
        for r in failed:
            print(f"  {r['source']}: {r.get('error')}")


if __name__ == "__main__":
    main()
