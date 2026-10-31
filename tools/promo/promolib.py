"""Helper gambar untuk video promo Tahura Boots.

Semua warna & font diambil dari aplikasi aslinya (src/app/globals.css,
public/fonts, src/components/brand.tsx) supaya video terlihat satu keluarga
dengan produknya.
"""

from __future__ import annotations

import math
import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Palet (globals.css) ────────────────────────────────────────────────────
INK = "#0f0d0b"
INK2 = "#17130f"
INK3 = "#221b15"
LINE = "#33291f"
LINE_SOFT = "#4a3b2d"
PAPER = "#f4eee2"
PARCH = "#e6dac4"
MUTE = "#a39a8b"
BRASS = "#c8a266"
BRASS_L = "#e3c995"
MOSS = "#55613f"
OXBLOOD = "#6d2126"
CLAY = "#a8674c"
SAND = "#cdb691"
CRM = "#f5f0e7"
CRM_LINE = "#e2d9c9"

# tools/promo/promolib.py → root repo
SITE = Path(__file__).resolve().parents[2]
FONT_DIR = Path(os.environ.get("PROMO_FONTS", SITE / "tools/promo/fonts"))
IMG_DIR = SITE / "public/images"

FONT_FILES = {
    ("inter", 300): "inter-latin-400.ttf",
    ("inter", 400): "inter-latin-400.ttf",
    ("inter", 500): "inter-latin-500.ttf",
    ("inter", 600): "inter-latin-600.ttf",
    ("inter", 700): "inter-latin-700.ttf",
    ("display", 300): "fraunces-latin-300.ttf",
    ("display", 400): "fraunces-latin-400.ttf",
    ("display", 600): "fraunces-latin-600.ttf",
    ("display-i", 400): "fraunces-italic-latin-400.ttf",
}


_DISPLAY_FALLBACK = {300: 300, 400: 400, 500: 400, 600: 600, 700: 600}


@lru_cache(maxsize=128)
def fnt(size: int, weight: int = 400, family: str = "inter") -> ImageFont.FreeTypeFont:
    if family in ("display", "display-i"):
        weight = _DISPLAY_FALLBACK.get(weight, 400)
    else:
        weight = min((300, 400, 500, 600, 700), key=lambda w: abs(w - weight))
    return ImageFont.truetype(str(FONT_DIR / FONT_FILES[(family, weight)]), size)


# ── Easing ────────────────────────────────────────────────────────────────
def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if x < lo else hi if x > hi else x


def ease_out(x: float) -> float:
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x: float) -> float:
    x = clamp(x)
    return 4 * x**3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_expo(x: float) -> float:
    x = clamp(x)
    return 1 if x >= 1 else 1 - 2 ** (-10 * x)


def ramp(t: float, start: float, dur: float) -> float:
    """0 → 1 selama [start, start+dur], dijepit."""
    if dur <= 0:
        return 1.0 if t >= start else 0.0
    return clamp((t - start) / dur)


def lerp(a: float, b: float, x: float) -> float:
    return a + (b - a) * x


# ── Teks ──────────────────────────────────────────────────────────────────
def text_width(value: str, font: ImageFont.FreeTypeFont, tracking: float = 0.0) -> float:
    if not tracking:
        return font.getlength(value)
    return sum(font.getlength(c) for c in value) + tracking * max(len(value) - 1, 0)


def draw_text(
    canvas: Image.Image,
    xy: tuple[float, float],
    value: str,
    font: ImageFont.FreeTypeFont,
    fill: str,
    *,
    tracking: float = 0.0,
    anchor: str = "la",
    alpha: int = 255,
) -> float:
    """Teks dengan letter-spacing (PIL belum mendukung tracking native).

    Digambar di lapisan transparan lalu di-composite, supaya alpha benar-benar
    membaur di atas foto/latar bertekstur (draw.text langsung di RGBA akan
    menimpa piksel, bukan mencampur).

    Mengembalikan lebar teks.
    """
    x, y = xy
    width = text_width(value, font, tracking)
    if anchor[0] == "m":
        x -= width / 2
    elif anchor[0] == "r":
        x -= width
    if anchor[1] == "m":
        y -= font.size * 0.72
    elif anchor[1] == "s":
        y -= font.size * 1.0

    pad = int(font.size * 0.55) + 4
    w = int(width) + pad * 2 + 4
    h = int(font.size * 1.7) + pad * 2
    layer = Image.new("RGBA", (max(w, 4), max(h, 4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    color = _rgba(fill, alpha)
    if tracking:
        cursor = pad
        for ch in value:
            d.text((cursor, pad), ch, font=font, fill=color, anchor="la")
            cursor += font.getlength(ch) + tracking
    else:
        d.text((pad, pad), value, font=font, fill=color, anchor="la")

    paste_alpha(canvas, layer, (int(round(x)) - pad, int(round(y)) - pad))
    return width


def _rgba(color: str, alpha: int) -> tuple[int, int, int, int] | str:
    if alpha >= 255:
        return color
    color = color.lstrip("#")
    return (int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16), alpha)


# ── Bentuk ────────────────────────────────────────────────────────────────
def rounded(size: tuple[int, int], radius: int, fill: str, *, border: str | None = None, border_w: int = 1) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=fill,
                        outline=border, width=border_w if border else 0)
    return layer


def paste_alpha(base: Image.Image, layer: Image.Image, xy: tuple[int, int], alpha: float = 1.0) -> None:
    if alpha <= 0:
        return
    if alpha < 1:
        layer = layer.copy()
        a = layer.getchannel("A").point(lambda v: int(v * alpha))
        layer.putalpha(a)
    base.alpha_composite(layer, (int(xy[0]), int(xy[1])))


def drop_shadow(base: Image.Image, box: tuple[int, int, int, int], radius: int,
                color: str = "#000000", alpha: int = 110, blur: int = 34, dy: int = 18) -> None:
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    pad = int(blur) * 2
    w, h = x1 - x0 + pad * 2, y1 - y0 + pad * 2
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([pad, pad + dy, pad + (x1 - x0), pad + (y1 - y0) + dy],
                        radius=int(radius), fill=_rgba(color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer, (x0 - pad, y0 - pad))


def radial_glow(size: int, color: str, peak: int = 150, power: float = 2.2) -> Image.Image:
    g = Image.radial_gradient("L").resize((size, size), Image.BICUBIC)
    g = Image.eval(g, lambda v: int(peak * (1 - v / 255) ** power))
    layer = Image.new("RGBA", (size, size), _rgba(color, 255))
    layer.putalpha(g)
    return layer


def linear_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    w, h = size
    top_rgb = tuple(int(top.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    bottom_rgb = tuple(int(bottom.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    ramp_arr = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    arr = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        arr[:, :, c] = top_rgb[c] + (bottom_rgb[c] - top_rgb[c]) * ramp_arr
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


# ── Gambar ────────────────────────────────────────────────────────────────
@lru_cache(maxsize=48)
def source(path: str) -> Image.Image:
    return Image.open(path).convert("RGB")


@lru_cache(maxsize=256)
def cover(path: str, w: int, h: int, radius: int = 0, zoom: float = 1.0,
          offset: tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    """Crop-fill sebuah foto ke ukuran w×h dengan sudut membulat."""
    img = source(path)
    ratio = max(w / img.width, h / img.height) * zoom
    nw, nh = max(1, int(img.width * ratio)), max(1, int(img.height * ratio))
    img = img.resize((nw, nh), Image.LANCZOS)
    ox = int((nw - w) * offset[0])
    oy = int((nh - h) * offset[1])
    img = img.crop((ox, oy, ox + w, oy + h)).convert("RGBA")
    if radius:
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
        img.putalpha(mask)
    return img


# ── Crest (src/components/brand.tsx) ──────────────────────────────────────
def _shield_points(s: float, ox: float, oy: float) -> list[tuple[float, float]]:
    pts = [(24, 2), (44, 8)]
    pts += [(44, 30 - i * 0.0) for i in range(1)]
    for i in range(1, 26):
        t = i / 25
        # kurva kanan: dari (44,30) ke (24,54)
        x = 44 - 20 * (t ** 1.55)
        y = 30 + 24 * (t ** 1.35)
        pts.append((x, y))
    for i in range(1, 26):
        t = 1 - i / 25
        x = 44 - 20 * (t ** 1.55)
        y = 30 + 24 * (t ** 1.35)
        pts.append((2 * 24 - x, y))
    pts.append((4, 8))
    return [(ox + px * s, oy + py * s) for px, py in pts]


def draw_arrow(
    canvas: Image.Image,
    x: float,
    y: float,
    length: float = 16,
    color: str = PAPER,
    *,
    alpha: int = 255,
    diagonal: bool = False,
) -> None:
    """Panah garis (kanan atau diagonal kanan-atas) — tidak bergantung glyph font."""
    layer = Image.new("RGBA", (int(length) + 12, int(length) + 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col = _rgba(color, alpha)
    x0, y0 = 2, length if not diagonal else length - 2
    x1, y1 = length + 2, 2 if diagonal else length
    d.line([(x0, y0), (x1, y1)], fill=col, width=2)
    if diagonal:
        d.line([(x1, y1), (x1 - 7, y1)], fill=col, width=2)
        d.line([(x1, y1), (x1, y1 + 7)], fill=col, width=2)
    else:
        d.line([(x1, y1), (x1 - 7, y1 - 6)], fill=col, width=2)
        d.line([(x1, y1), (x1 - 7, y1 + 6)], fill=col, width=2)
    paste_alpha(canvas, layer, (int(x), int(y)))


def draw_crest(canvas: Image.Image, xy: tuple[float, float], height: float,
               color: str, alpha: int = 255, progress: float = 1.0) -> None:
    """Crest digambar sebagai lapisan sendiri supaya bisa di-fade."""
    s = height / 56
    w = int(48 * s) + 8
    h = int(56 * s) + 8
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col = _rgba(color, alpha)
    pts = _shield_points(s, 4, 4)
    d.polygon(pts, outline=col, width=max(2, int(1.4 * s)))
    inner = _shield_points(s * 0.86, 4 + 48 * s * 0.07, 4 + 56 * s * 0.06)
    d.polygon(inner, outline=_rgba(color, int(alpha * 0.45)), width=max(1, int(0.7 * s)))
    lw = max(2, int(1.2 * s))
    d.line([(4 + 15 * s, 4 + 18 * s), (4 + 33 * s, 4 + 18 * s)], fill=col, width=lw)
    d.line([(4 + 15 * s, 4 + 38 * s), (4 + 33 * s, 4 + 38 * s)], fill=col, width=lw)
    for xoff, y0, y1 in ((19.5, 18, 38), (24, 14.5, 42), (28.5, 18, 38)):
        d.line([(4 + xoff * s, 4 + y0 * s), (4 + xoff * s, 4 + y1 * s)], fill=col, width=lw)
    if progress < 1:
        cut = int(h * clamp(progress))
        layer = layer.crop((0, 0, w, max(1, cut))).resize((w, h)) if progress < 0.02 else layer
        a = layer.getchannel("A").point(lambda v: int(v * clamp(progress)))
        layer.putalpha(a)
    paste_alpha(canvas, layer, xy)


# ── Grain & vignette ──────────────────────────────────────────────────────
_rng = np.random.default_rng(7)


def add_grain(img: Image.Image, amount: float = 4.0, seed: int = 0) -> Image.Image:
    if amount <= 0:
        return img
    arr = np.asarray(img).astype(np.int16)
    noise = _rng.normal(0, amount, (arr.shape[0], arr.shape[1], 1)).astype(np.int16)
    arr[:, :, :3] = np.clip(arr[:, :, :3] + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), img.mode)


@lru_cache(maxsize=4)
def _vignette(size: tuple[int, int], strength: int) -> Image.Image:
    w, h = size
    g = Image.radial_gradient("L").resize((w, h), Image.BICUBIC)
    g = Image.eval(g, lambda v: int(strength * (v / 255) ** 2.1))
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    layer.putalpha(g)
    return layer


def add_vignette(img: Image.Image, strength: int = 120) -> Image.Image:
    return Image.alpha_composite(img, _vignette(img.size, strength))


def ink_background(size: tuple[int, int], glow: bool = True) -> Image.Image:
    w, h = size
    base = linear_gradient(size, "#131009", "#0b0a08")
    if glow:
        g = radial_glow(int(h * 1.5), BRASS, peak=26, power=2.6)
        base.alpha_composite(g, (int(w * 0.62) - g.width // 2, int(h * 0.30) - g.height // 2))
        g2 = radial_glow(int(h * 1.1), OXBLOOD, peak=30, power=2.4)
        base.alpha_composite(g2, (int(w * 0.12) - g2.width // 2, int(h * 0.85) - g2.height // 2))
    return base


# ── Komponen UI kecil ─────────────────────────────────────────────────────
def chip(canvas: Image.Image, xy: tuple[int, int], label: str, *, size: int = 22,
         filled: bool = False, color: str = BRASS, fg: str | None = None,
         pad_x: int = 18, pad_y: int = 11, tracking: float = 3.0, alpha: float = 1.0,
         radius: int = 6) -> tuple[int, int]:
    font = fnt(size, 600)
    tw = text_width(label, font, tracking)
    w = int(tw + pad_x * 2)
    h = int(size * 1.4 + pad_y * 2)
    bg = _rgba(color, int(255 * alpha)) if filled else _rgba(color, int(28 * alpha))
    layer = rounded((w, h), radius, bg, border=None if filled else _rgba(color, int(150 * alpha)), border_w=2)
    paste_alpha(canvas, layer, xy)
    text_col = fg or (INK if filled else color)
    draw_text(canvas, (xy[0] + pad_x, xy[1] + pad_y + size * 0.10), label, font,
              text_col, tracking=tracking, alpha=int(255 * alpha))
    return (xy[0] + w, xy[1] + h)


def pill_button(canvas: Image.Image, xy: tuple[int, int], w: int, h: int, label: str,
                *, fill: str = BRASS, fg: str = INK, size: int = 26, tracking: float = 4.0,
                radius: int = 8, alpha: float = 1.0, arrow: bool = False) -> None:
    layer = rounded((w, h), radius, _rgba(fill, int(255 * alpha)))
    paste_alpha(canvas, layer, xy)
    font = fnt(size, 600)
    tw = text_width(label, font, tracking)
    tx = xy[0] + (w - tw) / 2
    draw_text(canvas, (tx, xy[1] + (h - size) / 2 - size * 0.10), label, font, fg,
              tracking=tracking, alpha=int(255 * alpha))
    if arrow:
        draw_text(canvas, (xy[0] + w - 42, xy[1] + (h - size) / 2 - size * 0.10), "→",
                  font, fg, alpha=int(255 * alpha))


def eyebrow(canvas: Image.Image, xy: tuple[float, float], label: str, *,
            color: str = BRASS, size: int = 20, tracking: float = 6.0,
            alpha: float = 1.0, rule: bool = True, rule_w: int = 46) -> None:
    x, y = xy
    if rule:
        layer = Image.new("RGBA", (rule_w, 2), _rgba(color, int(200 * alpha)))
        paste_alpha(canvas, layer, (x, y + size * 0.55))
        x += rule_w + 16
    draw_text(canvas, (x, y), label.upper(), fnt(size, 600), color, tracking=tracking, alpha=int(255 * alpha))


def caption_bar(canvas: Image.Image, xy: tuple[float, float], index: str, text_value: str,
                *, size: int = 24, alpha: float = 1.0) -> None:
    x, y = xy
    draw_text(canvas, (x, y), index, fnt(size, 600), BRASS, tracking=4, alpha=int(255 * alpha))
    draw_text(canvas, (x + 52, y), text_value.upper(), fnt(size, 500), PAPER, tracking=3.5,
              alpha=int(200 * alpha))
