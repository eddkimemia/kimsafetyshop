"""Product image processing service.

Automatically processes every product image:
  1. Remove background -> pure white (#FFFFFF) background
  2. Crop to the product and center it
  3. Resize to 1200x1200 pixels
  4. Optimize brightness, contrast and sharpness
  5. Brand it: small KimSafety logo badge (bottom-left) +
     website / contact / email text (bottom-right)
  6. Compress to high-quality WebP + JPEG
  7. Save both the original and the processed image

Usage:
    python process_images.py [--input images] [--output output] [--size 1200]
                             [--workers 4] [--formats webp,jpeg] [--dry-run]
                             [--in-place] [--no-branding] [--logo ../logo/logoy.jpg]
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from rembg import new_session, remove

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

WHITE = (255, 255, 255, 255)
NAVY = (15, 40, 71)
INK = (51, 65, 85)
PANEL_LINE = (226, 232, 240)
INPUT_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

WEBSITE = "www.kimsafety.co.ke"
CONTACT = "sales@kimsafety.co.ke · +254 715 135 141"

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


def optimize_cutout(img: Image.Image) -> Image.Image:
    """Auto-optimize brightness, contrast and sharpness of the foreground only,
    so the white background stays pure #FFFFFF."""
    rgb = img.convert("RGB")
    alpha = img.getchannel("A")
    arr = np.asarray(rgb, dtype=np.float32)

    # --- Brightness: pull the mean foreground luminance toward a target ---
    a_arr = np.asarray(alpha, dtype=np.float32)[..., None] / 255.0
    fg_weight = (a_arr > 0.05).astype(np.float32)
    denom = fg_weight.sum()
    if denom > 0:
        mean = (arr * fg_weight).sum() / (denom * 255.0)
        factor = np.clip(0.45 / max(mean, 1e-4), 0.9, 1.25)
        arr *= factor
    rgb = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

    # --- Contrast: gentle auto-contrast + slight enhancement ---
    rgb = ImageOps.autocontrast(rgb, cutoff=1)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.12)

    # --- Sharpness ---
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=3))

    result = rgb.convert("RGBA")
    result.putalpha(alpha)
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


def brand_image(
    img: Image.Image,
    logo_path: str | None,
    website: str = WEBSITE,
    contact: str = CONTACT,
) -> Image.Image:
    """Overlay a KimSafety logo badge (bottom-left) and website + contact
    lines (bottom-right). Both sit on white rounded panels so they stay
    legible over any product."""
    img = img.convert("RGBA")
    w, h = img.size
    margin = int(w * 0.02)          # 24 px @ 1200
    panel_h = int(w * 0.083)        # ~100 px @ 1200
    radius = int(w * 0.014)         # ~17 px @ 1200
    panel_y = h - margin - panel_h

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # ---- Bottom-left: logo badge ----
    if logo_path and os.path.exists(logo_path):
        logo_w = int(w * 0.24)      # ~288 px @ 1200
        logo_h = int(logo_w / 3.34)
        panel_w = logo_w + int(w * 0.04)
        panel_x = margin
        d.rounded_rectangle(
            (panel_x, panel_y, panel_x + panel_w, panel_y + panel_h),
            radius=radius,
            fill=(255, 255, 255, 250),
            outline=PANEL_LINE,
            width=max(1, int(w * 0.0016)),
        )
        try:
            with Image.open(logo_path) as logo:
                logo = ImageOps.exif_transpose(logo).convert("RGBA")
            logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
            overlay.paste(
                logo,
                (panel_x + int(w * 0.02), panel_y + (panel_h - logo_h) // 2),
                logo,
            )
        except Exception:
            pass

    # ---- Bottom-right: website + contact/email ----
    font_bold = find_font(True, int(w * 0.025))   # 30 px @ 1200
    font_reg = find_font(False, int(w * 0.0175))  # 21 px @ 1200
    if font_bold and font_reg:
        pad_x = int(w * 0.02)
        line_gap = int(w * 0.007)
        line1_w = d.textlength(website, font=font_bold)
        line2_w = d.textlength(contact, font=font_reg)
        text_w = max(line1_w, line2_w)
        panel_w = text_w + pad_x * 2
        panel_x = w - margin - panel_w
        d.rounded_rectangle(
            (panel_x, panel_y, panel_x + panel_w, panel_y + panel_h),
            radius=radius,
            fill=(255, 255, 255, 250),
            outline=PANEL_LINE,
            width=max(1, int(w * 0.0016)),
        )
        d.text(
            (panel_x + pad_x, panel_y + int(w * 0.018)),
            website,
            font=font_bold,
            fill=NAVY,
        )
        d.text(
            (panel_x + pad_x, panel_y + int(w * 0.018) + font_bold.size + line_gap),
            contact,
            font=font_reg,
            fill=INK,
        )

    return Image.alpha_composite(img, overlay)


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
        cutout = optimize_cutout(cutout)
        processed = crop_and_center(cutout, size)

        if not args.get("no_branding"):
            processed = brand_image(processed, args.get("logo"))

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
    ap.add_argument("--no-branding", action="store_true", help="skip logo badge and contact text")
    ap.add_argument("--logo", default="../logo/logoy.jpg", help="path to the KimSafety logo (relative to this script)")
    ap.add_argument("--website", default=WEBSITE, help="website text shown on branded images")
    ap.add_argument("--contact", default=CONTACT, help="contact/email text shown on branded images")
    args = ap.parse_args()

    formats = [f.strip().lower() for f in args.formats.split(",") if f.strip()]
    for fmt in formats:
        if fmt not in ("webp", "jpeg"):
            ap.error(f"unsupported format: {fmt}")

    logo_path = resolve_script_path(args.logo) if not args.no_branding else None

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
