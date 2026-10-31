"""Video promo vertikal 9:16 (1080×1920) untuk TikTok / Reels / Shorts.

Komposisinya disusun ulang untuk layar tegak: teks besar di atas, mockup di
bawah, satu adegan produk full-bleed, dan area aman TikTok (bawah ±300 px,
kanan ±120 px) tidak dipakai untuk informasi penting.

Jalankan dari root repo:
  python tools/promo/make_fonts.py                 → TTF dari public/fonts/*.woff2
  python tools/promo/promo_portrait.py stills 2 8  → PNG pratinjau di promo-out/
  python tools/promo/promo_portrait.py render      → promo-out/tahura-demo-9x16.mp4
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

import promoui as ui
from promoaudio import build_audio
from promolib import (
    BRASS, BRASS_L, INK, INK2, MUTE, PAPER, SAND, SITE,
    add_grain, add_vignette, chip, clamp, cover, draw_arrow, draw_crest,
    draw_text, ease_in_out, ease_out, eyebrow, fnt, ink_background, lerp,
    paste_alpha, ramp, rounded, text_width,
)

W, H = 1080, 1920
FPS = 30
OUT_DIR = Path(os.environ.get("PROMO_OUT", SITE / "promo-out"))
IMG = str(SITE / "public/images")

# Area teks aman: TikTok menutup ±300 px bawah dan ±120 px kanan.
MARGIN = 84

SCENES = [
    ("hook", 3.4),
    ("catalog", 5.4),
    ("product", 5.0),
    ("crm", 5.2),
    ("crm_mobile", 5.2),
    ("features", 4.6),
    ("outro", 4.8),
]
OVERLAP = 0.34

STARTS: list[float] = []
_acc = 0.0
for _name, _dur in SCENES:
    STARTS.append(_acc)
    _acc += _dur
TOTAL = _acc


# ── Helper ────────────────────────────────────────────────────────────────
def crisp(img: Image.Image, factor: float = 1.15) -> Image.Image:
    """Perbesar layar UI dengan Lanczos + unsharp supaya teks tetap tajam."""
    size = (int(img.width * factor), int(img.height * factor))
    up = img.resize(size, Image.LANCZOS)
    return up.filter(ImageFilter.UnsharpMask(radius=1.1, percent=62, threshold=2))


def vertical_scrim(w: int, h: int, top: int, mid: int, bottom: int,
                   mid_at: float = 0.45) -> Image.Image:
    """Lapisan gelap vertikal: kuat di tepi atas/bawah, transparan di tengah."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(h):
        p = y / max(1, h - 1)
        a = lerp(top, mid, p / mid_at) if p < mid_at else lerp(mid, bottom, (p - mid_at) / (1 - mid_at))
        d.line([(0, y), (w, y)], fill=(9, 8, 7, int(a)))
    return layer


def edge_fade(img: Image.Image, width: int = 80, alpha: int = 255) -> Image.Image:
    """Pudarkan tepi kiri/kanan gambar (dipakai saat meng-crop layar lebar)."""
    w, h = img.size
    mask = Image.new("L", (w, h), alpha)
    d = ImageDraw.Draw(mask)
    for x in range(width):
        v = int(alpha * (x / width) ** 1.5)
        d.line([(x, 0), (x, h)], fill=v)
        d.line([(w - 1 - x, 0), (w - 1 - x, h)], fill=v)
    out = img.convert("RGBA")
    base = out.getchannel("A")
    out.putalpha(Image.composite(base, Image.new("L", (w, h), 0), mask))
    return out


def headline(img: Image.Image, x: float, y: float, lines: list[tuple[str, str, str]],
             size: int, *, alpha: float = 1.0, leading: float = 1.10) -> float:
    """Tumpuk beberapa baris judul; tiap baris (teks, family, warna).

    Mengembalikan y akhir supaya elemen berikutnya bisa menyusul.
    """
    for i, (value, family, color) in enumerate(lines):
        draw_text(img, (x, y + i * size * leading), value, fnt(size, 400, family), color,
                  alpha=int(255 * alpha))
    return y + len(lines) * size * leading


def push_in(t: float, start: float, dur: float, distance: float = 28) -> float:
    """Nilai 0→distance yang memudar naik (dipakai untuk animasi masuk)."""
    a = ease_out(ramp(t, start, dur))
    return (1 - a) * distance


# ── S1 · hook ─────────────────────────────────────────────────────────────
def s_hook(t: float, dur: float) -> Image.Image:
    img = Image.new("RGBA", (W, H), INK)
    zoom = 1.06 + 0.05 * clamp(t / dur)
    photo = cover(f"{IMG}/boot-olive.jpg", W, H, zoom=zoom, offset=(0.5, 0.44))
    img.alpha_composite(photo, (0, 0))
    img = Image.alpha_composite(img, vertical_scrim(W, H, 170, 30, 245, mid_at=0.42))

    p = ease_out(ramp(t, 0.15, 0.9))
    draw_crest(img, (W // 2 - 31, 150), 62, BRASS, alpha=int(255 * p), progress=p)
    word = "TAHURA"
    ww = text_width(word, fnt(34, 400, "display"), 16)
    draw_text(img, (W // 2 - ww / 2, 236), word, fnt(34, 400, "display"), PAPER,
              tracking=16, alpha=int(255 * p))
    sub = "BOOTS COMPANY · BANDUNG"
    sw = text_width(sub, fnt(17, 500), 7)
    draw_text(img, (W // 2 - sw / 2, 288), sub, fnt(17, 500), MUTE, tracking=7,
              alpha=int(190 * p))

    a = ease_out(ramp(t, 0.45, 1.0))
    y = 1060 + (1 - a) * 30
    headline(img, MARGIN, y, [("Boots built", "display", PAPER),
                              ("to outlive", "display", PAPER),
                              ("the trend.", "display-i", BRASS_L)], 96, alpha=a)

    a2 = ease_out(ramp(t, 0.9, 0.9))
    draw_text(img, (MARGIN, 1440), "Hand-welted in Bandung · seven pairs a week",
              fnt(26, 400), "#c9c0b2", alpha=int(235 * a2))

    a3 = ease_out(ramp(t, 1.3, 0.8))
    if a3 > 0:
        chip(img, (MARGIN, 1512), "LIVE DEMO · 20 STYLES", size=19, tracking=3.4,
             pad_x=20, pad_y=13, alpha=a3)
    return img


# ── S2 · katalog di ponsel ────────────────────────────────────────────────
def s_catalog(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    eyebrow(img, (MARGIN, 250), "The catalog", size=21, tracking=6.4,
            alpha=ramp(t, 0.15, 0.7))

    a = ease_out(ramp(t, 0.25, 0.9))
    headline(img, MARGIN, 300 + (1 - a) * 26,
             [("Twenty styles,", "display", PAPER),
              ("four in sight.", "display-i", BRASS_L)], 74, alpha=a)

    a2 = ease_out(ramp(t, 0.55, 0.8))
    draw_text(img, (MARGIN, 500), "Grid dua kolom · foto studio asli", fnt(25, 400), MUTE,
              alpha=int(225 * a2))

    scroll = ease_in_out(ramp(t, 0.7, 2.6)) * 250
    screen = ui.storefront_catalog(420, 900, scroll=scroll)
    up = crisp(screen, 1.08)
    frame_w = up.width + 24
    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(ph, ((W - frame_w) // 2, 534), up, width=up.width)
    paste_alpha(img, ph, (0, 0), ease_out(ramp(t, 0.35, 0.9)))

    a3 = ease_out(ramp(t, 1.6, 0.8))
    if a3 > 0:
        line = "20 produk · 12 foto arsip · 8 model ready to ship"
        lw = text_width(line, fnt(20, 500), 2.4)
        draw_text(img, (W // 2 - lw / 2, 1580), line, fnt(20, 500), "#8d8375",
                  tracking=2.4, alpha=int(210 * a3))
    return img


# ── S3 · produk full-bleed ────────────────────────────────────────────────
def s_product(t: float, dur: float) -> Image.Image:
    img = Image.new("RGBA", (W, H), INK)
    zoom = 1.06 + 0.04 * clamp(t / dur)
    photo = cover(f"{IMG}/boot-olive.jpg", W, 1200, zoom=zoom, offset=(0.5, 0.42))
    img.alpha_composite(photo, (0, 0))
    # panel gelap mulai dari bawah sepatu supaya teks punya alas bersih
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    start, full = 900, 1210
    for y in range(start, H):
        off = (y - start) / (full - start)
        a = int(min(252, 252 * min(1.0, off) ** 0.55))
        pd.line([(0, y), (W, y)], fill=(9, 8, 7, a))
    pd2 = ImageDraw.Draw(panel)
    for y in range(0, 300):
        pd2.line([(0, y), (W, y)], fill=(9, 8, 7, int(150 * (1 - y / 300) ** 1.4)))
    img = Image.alpha_composite(img, panel)

    a = ease_out(ramp(t, 0.15, 0.9))
    draw_text(img, (MARGIN, 966 + (1 - a) * 18), "BANDUNG TOE-CAP", fnt(21, 600), BRASS_L,
              tracking=4.2, alpha=int(255 * a))
    headline(img, MARGIN, 1008 + (1 - a) * 18, [("Olive Grove", "display", PAPER)], 84, alpha=a)
    draw_text(img, (MARGIN, 1112), "TOCHIGI VACHETTA · GOODYEAR WELT", fnt(19, 500), MUTE,
              tracking=2.2, alpha=int(225 * a))

    a2 = ease_out(ramp(t, 0.4, 0.9))
    draw_text(img, (MARGIN, 1162 + (1 - a2) * 16), "Rp 3.450.000", fnt(50, 400, "display"), PAPER,
              alpha=int(255 * a2))
    chip(img, (W - MARGIN - 158, 1170), "IN STOCK", size=18, color=BRASS_L, tracking=2.6,
         pad_x=16, pad_y=12, alpha=a2)

    a3 = ease_out(ramp(t, 0.65, 0.9))
    if a3 > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.line([(MARGIN, 1256), (W - MARGIN, 1256)], fill=(74, 59, 45, 235), width=1)
        img = Image.alpha_composite(img, layer)
        draw_text(img, (MARGIN, 1282), "SELECT SIZE · EU", fnt(19, 600), MUTE, tracking=2.8,
                  alpha=int(255 * a3))
        for i, size in enumerate(("39", "40", "41", "42", "43", "44", "45")):
            bw = 58
            bx = MARGIN + i * (bw + 12)
            active = size == "42"
            box = rounded((bw, bw), 4, BRASS_L if active else (0, 0, 0, 0),
                          border=None if active else (74, 59, 45, 235), border_w=2)
            paste_alpha(img, box, (bx, 1322), a3)
            draw_text(img, (bx + 16, 1336), size, fnt(24, 600), INK if active else PAPER,
                      alpha=int(255 * a3))

    a4 = ease_out(ramp(t, 0.95, 0.9))
    if a4 > 0:
        bx, by, bw, bh = MARGIN, 1420, W - MARGIN * 2, 100
        paste_alpha(img, rounded((bw, bh), 4, BRASS), (bx, by), a4)
        draw_text(img, (bx + 34, by + 32), "WHATSAPP THE BENCH", fnt(25, 600), INK,
                  tracking=3.2, alpha=int(255 * a4))
        draw_arrow(img, bx + bw - 58, by + 36, 20, INK, alpha=int(255 * a4))
        draw_text(img, (bx + MARGIN, by + 116), "Tanpa checkout palsu — pesan langsung ke bengkel.",
                  fnt(22, 400), "#b4ab9d", alpha=int(225 * a4))

    # strip spesifikasi mengisi bagian bawah (di atas area UI TikTok)
    a5 = ease_out(ramp(t, 1.35, 0.9))
    if a5 > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.line([(MARGIN, 1596), (W - MARGIN, 1596)], fill=(74, 59, 45, 200), width=1)
        img = Image.alpha_composite(img, layer)
        specs = [("UPPER", "Tochigi vachetta"), ("WELT", "Goodyear, 270°"),
                 ("SOLE", "Resoleable"), ("BUILD", "6 weeks")]
        col_w = (W - MARGIN * 2) // len(specs)
        for i, (key, value) in enumerate(specs):
            sx = MARGIN + i * col_w
            draw_text(img, (sx, 1620), key, fnt(16, 600), "#8a8172", tracking=2.6,
                      alpha=int(230 * a5))
            draw_text(img, (sx, 1648), value, fnt(20, 400), "#d9d2c4", alpha=int(240 * a5))
    return img


# ── S4 · CRM desktop ──────────────────────────────────────────────────────
def s_crm(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    eyebrow(img, (MARGIN, 300), "The owner console", size=21, tracking=6.4,
            alpha=ramp(t, 0.15, 0.7))

    a = ease_out(ramp(t, 0.25, 0.9))
    headline(img, MARGIN, 350 + (1 - a) * 26,
             [("Stok, pesanan,", "display", PAPER),
              ("satu database.", "display-i", BRASS_L)], 70, alpha=a)
    draw_text(img, (MARGIN, 540), "CRM dan storefront membaca tabel yang sama.", fnt(24, 400), MUTE,
              alpha=int(225 * ease_out(ramp(t, 0.5, 0.8))))

    # dashboard digeser perlahan supaya tabel pesanan ikut terlihat
    # Sidebar (250 px) dibuang seluruhnya, dan kameranya hanya zoom-in pelan
    # (bukan geser horizontal) supaya teks tidak pernah terpotong di tengah kata.
    content = ui.crm_dashboard(1500, 880, t=min(t / 2.0, 1.0), highlight=-1)
    side = 250
    zoom = 1.0 + 0.03 * ease_in_out(ramp(t, 0.9, 3.4))
    full_w = 1500 - side
    cw_crop = int(full_w / zoom)
    ch_crop = int(880 / zoom)
    crop = content.crop((side, 0, side + cw_crop, ch_crop))
    card = crop.resize((1000, int(1000 * ch_crop / cw_crop)), Image.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=2))
    card = edge_fade(card, width=64)

    win = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.browser(win, ((W - 1000) // 2, 584), card,
               "tahuraboots-demo-v1.vercel.app/crm · owner console")
    paste_alpha(img, win, (0, 0), ease_out(ramp(t, 0.45, 1.0)))

    a2 = ease_out(ramp(t, 1.5, 0.9))
    if a2 > 0:
        stats = [("7", "IN MOTION"), ("46", "ON SHELF"), ("5", "LEADS")]
        bw, gap = 292, 18
        x0 = (W - (bw * 3 + gap * 2)) // 2
        for i, (value, label) in enumerate(stats):
            bx = x0 + i * (bw + gap)
            paste_alpha(img, rounded((bw, 112), 6, (23, 19, 15, 235),
                                     border=(74, 59, 45, 220), border_w=1), (bx, 1370), a2)
            draw_text(img, (bx + 24, 1388), value, fnt(38, 400, "display"), PAPER,
                      alpha=int(255 * a2))
            draw_text(img, (bx + 24, 1444), label, fnt(16, 600), MUTE, tracking=2.6,
                      alpha=int(210 * a2))
    return img


# ── S5 · CRM di ponsel ────────────────────────────────────────────────────
def s_crm_mobile(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    eyebrow(img, (MARGIN, 290), "CRM di ponsel", size=21, tracking=6.4,
            alpha=ramp(t, 0.15, 0.7))

    a = ease_out(ramp(t, 0.25, 0.9))
    headline(img, MARGIN, 340 + (1 - a) * 26,
             [("One tap,", "display", PAPER),
              ("not a drawer.", "display-i", BRASS_L)], 76, alpha=a)

    marks = (0.15, 1.15, 2.35, 3.55)
    active = max((i for i, m in enumerate(marks) if t >= m), default=0)
    press = max(0.0, 1 - abs(t - marks[active] - 0.09) / 0.32) if active else 0.0
    screen = ui.crm_phone(420, 900, active=active, t=t, pressed=press)
    up = crisp(screen, 1.02)
    frame_w = up.width + 24
    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(ph, ((W - frame_w) // 2, 642), up, width=up.width)
    paste_alpha(img, ph, (0, 0), ease_out(ramp(t, 0.4, 0.9)))

    a2 = ease_out(ramp(t, 1.2, 0.9))
    if a2 > 0:
        labels = ["TAB BAR BAWAH", "TARGET 44PX", "AMAN DARI NOTCH"]
        widths = [text_width(l, fnt(17, 600), 2.4) + 34 for l in labels]
        total = sum(widths) + 14 * (len(labels) - 1)
        x = (W - total) / 2
        for label, cw in zip(labels, widths):
            chip(img, (int(x), 566), label, size=17, tracking=2.4, pad_x=17, pad_y=11, alpha=a2)
            x += cw + 14
    return img


# ── S6 · fitur owner ──────────────────────────────────────────────────────
def _icon(kind: str, img: Image.Image, xy: tuple[int, int], size: int, color: str,
          alpha: float = 1.0) -> None:
    layer = Image.new("RGBA", (size + 8, size + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y, s = 4, 4, size
    col = color if alpha >= 1 else (*[int(c) for c in _rgb(color)], int(255 * alpha))
    w = 3
    if kind == "stock":
        d.rectangle([x, y, x + s, y + s], outline=col, width=w)
        d.line([(x, y + s * 0.36), (x + s, y + s * 0.36)], fill=col, width=w)
        d.line([(x + s * 0.36, y), (x + s * 0.36, y + s)], fill=col, width=w)
    elif kind == "bulk":
        for k in range(3):
            yy = y + 6 + k * (s - 16) / 2
            d.line([(x, yy), (x + s, yy)], fill=col, width=w)
    elif kind == "csv":
        d.rectangle([x, y, x + s * 0.72, y + s], outline=col, width=w)
        for k in range(2):
            yy = y + s * 0.28 + k * s * 0.26
            d.line([(x + 7, yy), (x + s * 0.72 - 7, yy)], fill=col, width=2)
        d.line([(x + s * 0.72, y + s * 0.5), (x + s, y + s * 0.5)], fill=col, width=w)
        d.line([(x + s - 7, y + s * 0.5 - 6), (x + s, y + s * 0.5)], fill=col, width=w)
        d.line([(x + s - 7, y + s * 0.5 + 6), (x + s, y + s * 0.5)], fill=col, width=w)
    else:  # touch
        d.rounded_rectangle([x + s * 0.24, y, x + s * 0.76, y + s * 0.64], radius=8,
                            outline=col, width=w)
        d.line([(x + s * 0.5, y + s * 0.64), (x + s * 0.5, y + s)], fill=col, width=w)
    paste_alpha(img, layer, xy, alpha)


def _rgb(color: str) -> tuple[int, int, int]:
    c = color.lstrip("#")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def _mini(kind: str, img: Image.Image, x: int, y: int, w: int, h: int, alpha: float) -> None:
    """Diagram kecil di bawah teks kartu supaya kartu tidak terasa kosong."""
    layer = Image.new("RGBA", (w + 8, h + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    line = (200, 162, 102, int(150 * alpha))
    soft = (244, 238, 226, int(40 * alpha))
    bright = (200, 162, 102, int(235 * alpha))
    if kind == "stock":  # rak: 5 slot, satu kosong
        for i in range(5):
            bx = 2 + i * (w / 5)
            bw = w / 5 - 10
            if i == 3:
                d.rounded_rectangle([bx, 8, bx + bw, 30], radius=3, outline=line, width=2)
            else:
                d.rounded_rectangle([bx, 8, bx + bw, 30], radius=3, fill=soft)
        d.line([(0, h - 8), (w, h - 8)], fill=line, width=2)
    elif kind == "bulk":  # tiga baris + centang
        for i in range(3):
            yy = 6 + i * 17
            d.rounded_rectangle([0, yy, w - 40, yy + 10], radius=5, fill=soft)
            d.line([(w - 26, yy + 3), (w - 21, yy + 8)], fill=bright, width=2)
            d.line([(w - 21, yy + 8), (w - 10, yy - 4)], fill=bright, width=2)
    elif kind == "csv":  # file + panah keluar
        d.rectangle([0, 2, 44, h - 10], outline=line, width=2)
        for i in range(3):
            d.line([(9, 14 + i * 12), (36, 14 + i * 12)], fill=soft, width=5)
        d.line([(56, h / 2 - 4), (w, h / 2 - 4)], fill=bright, width=2)
        d.line([(w - 10, h / 2 - 11), (w, h / 2 - 4)], fill=bright, width=2)
        d.line([(w - 10, h / 2 + 3), (w, h / 2 - 4)], fill=bright, width=2)
    else:  # thumb zone: siluet ponsel + jangkauan jempol
        pw, ph_ = 54, h - 6
        px = w / 2 - pw / 2
        d.rounded_rectangle([px, 0, px + pw, ph_], radius=9, outline=line, width=2)
        d.arc([px + 2, ph_ * 0.30, px + pw + 34, ph_ + 22], start=196, end=344,
              fill=bright, width=2)
        d.ellipse([px + pw - 16, ph_ * 0.62, px + pw - 4, ph_ * 0.62 + 12],
                  outline=bright, width=2)
    paste_alpha(img, layer, (int(x), int(y)), alpha)


def s_features(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    eyebrow(img, (MARGIN, 330), "Built for the owner", size=21, tracking=6.4,
            alpha=ramp(t, 0.15, 0.7))

    a = ease_out(ramp(t, 0.25, 0.9))
    headline(img, MARGIN, 380 + (1 - a) * 26,
             [("The parts that", "display", PAPER),
              ("actually save time.", "display-i", BRASS_L)], 64, alpha=a)

    cards = [
        ("stock", "Stok otomatis", "Pesanan memotong shelf, pembatalan mengembalikannya."),
        ("bulk", "Aksi massal", "Ubah status banyak pesanan sekali jalan."),
        ("csv", "Ekspor CSV", "Pesanan, lead, dan katalog keluar rapi."),
        ("touch", "Ramah jempol", "Tombol 44px dan tab bar bawah."),
    ]
    cw, ch, gap = 440, 340, 26
    x0 = (W - (cw * 2 + gap)) // 2
    for i, (icon, title, body) in enumerate(cards):
        a2 = ease_out(ramp(t, 0.5 + i * 0.13, 0.8))
        if a2 <= 0:
            continue
        col, row = i % 2, i // 2
        x = x0 + col * (cw + gap)
        y = 620 + row * (ch + gap) + (1 - a2) * 30
        paste_alpha(img, rounded((cw, ch), 14, "#16120e", border=(74, 59, 45, 230)), (x, y), a2)
        paste_alpha(img, rounded((cw, 3), 2, BRASS), (x, y), a2)
        _icon(icon, img, (x + 30, y + 34), 44, BRASS_L, a2)
        draw_text(img, (x + 30, y + 104), title, fnt(30, 500), PAPER, alpha=int(255 * a2))
        words, line, lines = body.split(), "", []
        for word in words:
            probe = f"{line} {word}".strip()
            if text_width(probe, fnt(19, 400)) > cw - 60:
                lines.append(line)
                line = word
            else:
                line = probe
        lines.append(line)
        for j, part in enumerate(lines):
            draw_text(img, (x + 30, y + 152 + j * 30), part, fnt(19, 400), "#b4ab9d",
                      alpha=int(225 * a2))
        _mini(icon, img, x + 30, y + 232, cw - 60, 62, a2)

    # pita marquee di bawah kartu (menutup ruang kosong, mengikuti storefront)
    ma = ease_out(ramp(t, 1.2, 0.9))
    if ma > 0:
        band_y, band_h = 1420, 96
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.rectangle([0, band_y, W, band_y + band_h], fill=(23, 19, 15, int(235 * ma)))
        d.line([(0, band_y), (W, band_y)], fill=(200, 162, 102, int(70 * ma)), width=1)
        d.line([(0, band_y + band_h), (W, band_y + band_h)],
               fill=(200, 162, 102, int(70 * ma)), width=1)
        img = Image.alpha_composite(img, layer)

        words = "HAND-WELTED   ·   TOCHIGI VACHETTA   ·   MADE TO ORDER   ·   BANDUNG"
        wfont = fnt(23, 500)
        tw_w = text_width(words + "   ·   ", wfont, 6)
        offset = (t * 130) % tw_w
        strip = Image.new("RGBA", (W, band_h), (0, 0, 0, 0))
        x0 = -offset
        while x0 < W:
            draw_text(strip, (x0, (band_h - 23) / 2 - 2), words, wfont, BRASS_L, tracking=6)
            x0 += tw_w
        grad = Image.new("L", (W, 1), 255)
        gd = ImageDraw.Draw(grad)
        for i in range(140):
            v = int(255 * (i / 140))
            gd.point((i, 0), fill=v)
            gd.point((W - 1 - i, 0), fill=v)
        grad = grad.resize((W, band_h), Image.NEAREST)
        strip.putalpha(Image.composite(strip.getchannel("A"), Image.new("L", (W, band_h), 0), grad)
                       .point(lambda v: int(v * ma)))
        img.alpha_composite(strip, (0, band_y))
    return img


# ── S7 · outro ────────────────────────────────────────────────────────────
def s_outro(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    fade = 1 - ramp(t, dur - 0.8, 0.8)

    p = ease_out(ramp(t, 0.1, 0.8))
    draw_crest(img, (W // 2 - 40, 420), 80, BRASS, alpha=int(255 * p * fade), progress=p)

    a = ease_out(ramp(t, 0.3, 0.9))
    tw = text_width("TAHURA", fnt(86, 400, "display"), 18)
    draw_text(img, (W // 2 - tw / 2, 552), "TAHURA", fnt(86, 400, "display"), PAPER,
              tracking=18, alpha=int(255 * a * fade))
    sub = "BOOTS COMPANY · BANDUNG"
    sw = text_width(sub, fnt(19, 500), 7)
    draw_text(img, (W // 2 - sw / 2, 666), sub, fnt(19, 500), MUTE, tracking=7,
              alpha=int(205 * a * fade))

    a2 = ease_out(ramp(t, 0.6, 0.9))
    tagline = "Boots built to outlive the trend."
    tw2 = text_width(tagline, fnt(42, 400, "display-i"))
    draw_text(img, (W // 2 - tw2 / 2, 730), tagline, fnt(42, 400, "display-i"), BRASS_L,
              alpha=int(255 * a2 * fade))

    a3 = ease_out(ramp(t, 1.0, 0.8))
    if a3 > 0:
        pw, ph_ = 852, 100
        px, py = (W - pw) // 2, 826
        paste_alpha(img, rounded((pw, ph_), 50, (23, 19, 15, 238),
                                 border=(200, 162, 102, 160), border_w=2), (px, py), a3)
        draw_text(img, (px + 38, py + 26), "LIVE DEMO", fnt(17, 600), BRASS, tracking=3.4,
                  alpha=int(255 * a3))
        paste_alpha(img, Image.new("RGBA", (1, 44), (74, 59, 45, 225)), (px + 168, py + 28), a3)
        draw_text(img, (px + 196, py + 26), "tahuraboots-demo-v1.vercel.app",
                  fnt(30, 400, "display"), PAPER, alpha=int(255 * a3))

    a4 = ease_out(ramp(t, 1.35, 0.8))
    if a4 > 0:
        items = ["20 styles", "Owner CRM", "Mobile-first"]
        widths = [text_width(i, fnt(17, 500), 2.4) + 34 for i in items]
        total = sum(widths) + 14 * (len(items) - 1)
        cx = (W - total) / 2
        for item, cw in zip(items, widths):
            chip(img, (int(cx), 972), item.upper(), size=17, tracking=2.4, pad_x=17, pad_y=11,
                 color=SAND, alpha=a4)
            cx += cw + 14

    a5 = ease_out(ramp(t, 1.6, 0.9))
    if a5 > 0:
        thumbs = [f"{IMG}/boot-olive.jpg", f"{IMG}/catalog/ciwidey-western.jpg",
                  f"{IMG}/catalog/cibaduyut-western.jpg"]
        size, gap = 214, 22
        total_w = len(thumbs) * size + (len(thumbs) - 1) * gap
        tx0 = (W - total_w) // 2
        for i, path in enumerate(thumbs):
            ta = ease_out(ramp(t, 1.6 + i * 0.08, 0.7))
            if ta <= 0:
                continue
            paste_alpha(img, cover(path, size, size, radius=4),
                        (tx0 + i * (size + gap), 1100 + (1 - ta) * 16), ta)
            paste_alpha(img, rounded((size, 2), 0, (200, 162, 102, 130)),
                        (tx0 + i * (size + gap), 1110 + size), ta)

    a6 = ease_out(ramp(t, 2.2, 0.8))
    if a6 > 0:
        cta = "LINK DI BIO"
        cw2 = text_width(cta, fnt(28, 600), 7)
        draw_text(img, (W // 2 - cw2 / 2, 1424), cta, fnt(30, 600), BRASS, tracking=7,
                  alpha=int(240 * a6 * fade))
        foot = "Demo publik · data contoh · dibuat untuk Tahura Boots Company"
        fw = text_width(foot, fnt(19, 400), 1.2)
        draw_text(img, (W // 2 - fw / 2, 1484), foot, fnt(19, 400), "#7d7365", tracking=1.2,
                  alpha=int(200 * a6 * fade))

    if fade < 1:
        img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade)))))
    return img


SCENE_FN = {
    "hook": s_hook,
    "catalog": s_catalog,
    "product": s_product,
    "crm": s_crm,
    "crm_mobile": s_crm_mobile,
    "features": s_features,
    "outro": s_outro,
}


# ── Timeline ──────────────────────────────────────────────────────────────
def scene_index(t: float) -> tuple[int, float]:
    for i in range(len(SCENES) - 1, -1, -1):
        if t >= STARTS[i]:
            return i, t - STARTS[i]
    return 0, max(t, 0.0)


def render_frame(t: float) -> Image.Image:
    idx, local = scene_index(t)
    name, dur = SCENES[idx]
    img = SCENE_FN[name](local, dur).convert("RGBA")

    # Transisi lewat hitam sekejap; crossfade langsung antara dua layar UI
    # terbaca seperti double exposure.
    if idx > 0 and local < OVERLAP:
        prev_name, prev_dur = SCENES[idx - 1]
        prev = SCENE_FN[prev_name](min(prev_dur, prev_dur - OVERLAP + local), prev_dur).convert("RGBA")
        p = local / OVERLAP
        if p < 0.5:
            dark = ease_in_out(p / 0.5)
            img = Image.alpha_composite(prev, Image.new("RGBA", (W, H), (0, 0, 0, int(246 * dark))))
        else:
            dark = ease_in_out((1 - p) / 0.5)
            img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (0, 0, 0, int(246 * dark))))

    img = add_vignette(img, 104)
    img = add_grain(img, 3.2)

    # penanda progres di tepi atas (bawah tertutup UI TikTok)
    progress = clamp(t / TOTAL)
    if progress > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.rectangle([0, 0, int(W * progress), 3], fill=(200, 162, 102, 150))
        d.line([(0, 4), (W, 4)], fill=(200, 162, 102, 30), width=1)
        img = Image.alpha_composite(img, layer)
    return img.convert("RGB")


# ── CLI ───────────────────────────────────────────────────────────────────
def ffmpeg_bin() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def cmd_stills(times: list[float]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for value in times:
        img = render_frame(value)
        target = OUT_DIR / f"vertical-{value:05.2f}.png"
        img.save(target)
        print("→", target, img.size)


def cmd_render() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    video = OUT_DIR / "_vertical.mp4"
    audio = OUT_DIR / "_vertical.wav"
    final = OUT_DIR / "tahura-demo-9x16.mp4"
    frames = int(TOTAL * FPS)

    print(f"Render vertikal {frames} frame · {TOTAL:.1f}s · {W}x{H} @ {FPS}fps")
    build_audio(audio, TOTAL + 0.6, STARTS, beat=1.6)
    print("Audio siap")

    cmd = [ffmpeg_bin(), "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "23",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
           "-movflags", "+faststart", str(video)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(frames):
        proc.stdin.write(render_frame(i / FPS).tobytes())
        if i % 90 == 0:
            print(f"  frame {i}/{frames}", flush=True)
    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit("ffmpeg gagal saat encode video")

    subprocess.run([ffmpeg_bin(), "-y", "-hide_banner", "-loglevel", "error",
                    "-i", str(video), "-i", str(audio),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest",
                    "-movflags", "+faststart", str(final)], check=True)
    print("Selesai:", final, f"{final.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "stills":
        cmd_stills([float(x) for x in sys.argv[2:]])
    else:
        cmd_render()
