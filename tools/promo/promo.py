"""Video promo Tahura Boots — adegan, timeline, audio, encode.

Jalankan dari root repo:
  python tools/promo/make_fonts.py                 → TTF dari public/fonts/*.woff2
  python tools/promo/promo.py stills 6.5 13 22     → PNG pratinjau di promo-out/
  python tools/promo/promo.py render               → promo-out/tahura-demo.mp4
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import promoui as ui
from promolib import (
    BRASS, BRASS_L, CLAY, CRM, INK, INK2, INK3, LINE, LINE_SOFT, MOSS, MUTE,
    OXBLOOD, PAPER, PARCH, SAND, SITE,
    add_grain, add_vignette, caption_bar, chip, clamp, cover, draw_arrow,
    draw_crest,
    draw_text, drop_shadow, ease_in_out, ease_out, ease_out_expo, eyebrow, fnt,
    ink_background, lerp, linear_gradient, paste_alpha, radial_glow, ramp,
    rounded, text_width,
)

W, H = 1920, 1080
FPS = 30
OUT_DIR = Path(os.environ.get("PROMO_OUT", SITE / "promo-out"))
IMG = str(SITE / "public/images")

SCENES = [
    ("brand", 4.4),
    ("storefront", 5.6),
    ("catalog", 6.0),
    ("detail", 5.2),
    ("crm", 8.4),
    ("crm_mobile", 5.6),
    ("features", 5.4),
    ("outro", 6.2),
]
OVERLAP = 0.5


def scene_starts() -> list[float]:
    starts, acc = [], 0.0
    for _, dur in SCENES:
        starts.append(acc)
        acc += dur
    return starts


STARTS = scene_starts()
TOTAL = STARTS[-1] + SCENES[-1][1]


# ── S1 · brand ────────────────────────────────────────────────────────────
def s_brand(t: float, _dur: float) -> Image.Image:
    img = ink_background((W, H))
    cx, cy = W // 2, 430

    p = ease_out(ramp(t, 0.15, 1.15))
    draw_crest(img, (cx - 38, cy - 190 + (1 - p) * 16), 96, BRASS, alpha=int(255 * p), progress=p)

    track = lerp(58, 16, ease_out(ramp(t, 0.55, 1.5)))
    a = ramp(t, 0.5, 0.9)
    tw = text_width("TAHURA", fnt(104, 400, "display"), track)
    draw_text(img, (cx - tw / 2, cy - 46), "TAHURA", fnt(104, 400, "display"), PAPER,
              tracking=track, alpha=int(255 * a))

    rw = int(300 * ease_out(ramp(t, 1.15, 0.9)))
    if rw > 2:
        paste_alpha(img, Image.new("RGBA", (rw, 2), (200, 162, 102, 210)), (cx - rw // 2, cy + 96))

    a2 = ramp(t, 1.35, 0.9)
    if a2 > 0:
        sub = "BOOTS COMPANY"
        sw = text_width(sub, fnt(20, 500), 12)
        draw_text(img, (cx - sw / 2, cy + 126), sub, fnt(20, 500), MUTE, tracking=12, alpha=int(230 * a2))

    a3 = ramp(t, 2.0, 0.9)
    if a3 > 0:
        line = "HAND-WELTED IN BANDUNG · SINCE 2013"
        lw = text_width(line, fnt(15, 500), 5)
        draw_text(img, (cx - lw / 2, cy + 196), line, fnt(15, 500), BRASS, tracking=5, alpha=int(190 * a3))

    # garis bingkai tipis
    a4 = ramp(t, 0.3, 1.4)
    if a4 > 0:
        inset = int(lerp(150, 88, ease_out(a4)))
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rectangle([inset, inset, W - inset, H - inset],
                                        outline=(200, 162, 102, int(46 * a4)), width=1)
        img = Image.alpha_composite(img, layer)
    return img


# ── S2 · storefront hero ──────────────────────────────────────────────────
def s_storefront(t: float, _dur: float) -> Image.Image:
    img = ink_background((W, H))

    x = 132
    eyebrow(img, (x, 196), "The storefront", alpha=ramp(t, 0.1, 0.8))

    lines = [("Boots built", "display", PAPER),
             ("to outlive", "display", PAPER),
             ("the trend.", "display-i", BRASS_L)]
    for i, (line, fam, col) in enumerate(lines):
        a = ease_out(ramp(t, 0.25 + i * 0.13, 0.85))
        if a <= 0:
            continue
        dy = (1 - a) * 46
        draw_text(img, (x, 262 + i * 86 + dy), line, fnt(82, 400, fam), col, alpha=int(255 * a))

    a = ease_out(ramp(t, 0.85, 0.8))
    if a > 0:
        body = ("Hand-welted leather boots from a small studio on Jl. Ters Kopo.\n"
                "Six weeks at the bench, seven pairs a week.")
        for i, part in enumerate(body.split("\n")):
            draw_text(img, (x, 552 + i * 34 + (1 - a) * 18), part, fnt(21, 400), "#c9c1b3", alpha=int(235 * a))

    # dua CTA seperti di hero aslinya
    for i, (label, filled) in enumerate([("EXPLORE THE COLLECTION", True), ("BUILD YOUR PAIR", False)]):
        a = ease_out(ramp(t, 1.0 + i * 0.12, 0.7))
        if a <= 0:
            continue
        bw, bh = 296, 58
        bx = x + i * (bw + 18)
        if filled:
            paste_alpha(img, rounded((bw, bh), 3, BRASS), (bx, 632), a)
            draw_text(img, (bx + 26, 650), label, fnt(12, 600), INK, tracking=2.6, alpha=int(255 * a))
            draw_arrow(img, bx + bw - 44, 648, 15, INK, alpha=int(255 * a))
        else:
            paste_alpha(img, rounded((bw, bh), 3, (0, 0, 0, 0), border=(244, 238, 226, 90), border_w=2), (bx, 632), a)
            draw_text(img, (bx + 26, 650), label, fnt(12, 600), PAPER, tracking=2.6, alpha=int(255 * a))
            draw_arrow(img, bx + bw - 44, 648, 15, BRASS, alpha=int(255 * a), diagonal=True)

    stats = [("1,294", "pairs logged"), ("13.2K", "collectors"), ("40+", "countries"), ("2013", "est. Bandung")]
    for i, (value, label) in enumerate(stats):
        a = ease_out(ramp(t, 1.25 + i * 0.1, 0.7))
        if a <= 0:
            continue
        sx = x + i * 168
        draw_text(img, (sx, 742 + (1 - a) * 14), value, fnt(38, 400, "display"), PAPER, alpha=int(255 * a))
        draw_text(img, (sx, 788 + (1 - a) * 14), label.upper(), fnt(12, 500), MUTE, tracking=3, alpha=int(200 * a))

    paste_alpha(img, Image.new("RGBA", (700, 1), (74, 59, 45, 220)), (x, 720))

    # foto 4:5 dengan zoom halus
    pw, ph = 604, 755
    px, py = 1152, 148
    zoom = lerp(1.06, 1.0, ease_out(ramp(t, 0.0, 2.4)))
    a = ease_out(ramp(t, 0.15, 1.0))
    ph_img = cover(f"{IMG}/boot-olive.jpg", pw, ph, zoom=zoom)
    drop_shadow(img, (px, py, px + pw, py + ph), 4, alpha=170, blur=60, dy=34)
    frame = Image.new("RGBA", (pw + 28, ph + 28), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rectangle([0, 0, pw + 27, ph + 27], outline=(200, 162, 102, 90), width=2)
    paste_alpha(img, frame, (px - 14, py - 14), a)
    paste_alpha(img, ph_img, (px, py), a)

    # chip & kartu harga
    ca = ease_out(ramp(t, 1.0, 0.7))
    if ca > 0:
        chip(img, (px + 24, py + 24), "READY TO SHIP", size=13, color=MOSS, tracking=2.4,
             pad_x=14, pad_y=9, alpha=ca)
        card = rounded((330, 92), 6, (15, 13, 11, 225), border=(200, 162, 102, 120), border_w=1)
        paste_alpha(img, card, (px + 24, py + ph - 116), ca)
        draw_text(img, (px + 48, py + ph - 100), "BANDUNG TOE-CAP", fnt(12, 600), BRASS_L, tracking=2.4, alpha=int(255 * ca))
        draw_text(img, (px + 48, py + ph - 76), "Rp 3.450.000", fnt(26, 400, "display"), PAPER, alpha=int(255 * ca))
    return img


# ── S3 · katalog ──────────────────────────────────────────────────────────
def s_catalog(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    scroll = ease_in_out(ramp(t, 0.9, dur - 1.6)) * 430
    screen = ui.storefront_catalog(420, 900, scroll=scroll)
    px, py = 148, 92
    a = ease_out(ramp(t, 0.1, 0.9))
    phone_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(phone_img, (px, py), screen)
    paste_alpha(img, phone_img, (0, 0), a)

    x = 760
    eyebrow(img, (x, 176), "The catalog", alpha=ramp(t, 0.35, 0.8))
    for i, (line, fam, col) in enumerate([("Twenty styles,", "display", PAPER),
                                         ("four in sight.", "display-i", BRASS_L)]):
        a2 = ease_out(ramp(t, 0.5 + i * 0.12, 0.8))
        if a2 > 0:
            draw_text(img, (x, 228 + i * 72 + (1 - a2) * 24), line, fnt(66, 400, fam), col, alpha=int(255 * a2))

    bullets = [
        ("01", "Grid dua kolom di ponsel", "4–5 produk terlihat tanpa menggulir jauh."),
        ("02", "Foto arsip studio asli", "Dua belas foto 1160×1160 dari arsip Instagram."),
        ("03", "Filter yang benar-benar jalan", "Ready, made to order, arsip — plus pencarian."),
    ]
    for i, (num, title, sub) in enumerate(bullets):
        a3 = ease_out(ramp(t, 0.9 + i * 0.18, 0.75))
        if a3 <= 0:
            continue
        by = 420 + i * 118 + (1 - a3) * 20
        draw_text(img, (x, by), num, fnt(15, 600), BRASS, tracking=3, alpha=int(220 * a3))
        draw_text(img, (x + 52, by - 2), title, fnt(25, 500), PAPER, alpha=int(255 * a3))
        draw_text(img, (x + 52, by + 32), sub, fnt(17, 400), MUTE, alpha=int(215 * a3))
    return img


# ── S4 · detail produk ────────────────────────────────────────────────────
def s_detail(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    screen = ui.storefront_detail(420, 900)
    px, py = 200, 92
    phone_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(phone_img, (px, py), screen)
    a = ease_out(ramp(t, 0.1, 0.9))
    paste_alpha(img, phone_img, (0, 0), a)

    x = 812
    eyebrow(img, (x, 190), "Product detail", alpha=ramp(t, 0.3, 0.8))
    for i, (line, fam, col) in enumerate([("Honest detail,", "display", PAPER),
                                         ("no fake checkout.", "display-i", BRASS_L)]):
        a2 = ease_out(ramp(t, 0.45 + i * 0.12, 0.8))
        if a2 > 0:
            draw_text(img, (x, 242 + i * 70 + (1 - a2) * 22), line, fnt(62, 400, fam), col, alpha=int(255 * a2))

    notes = [
        ("Ukuran EU 39–45", "Stok per ukuran, bukan angka karangan."),
        ("Lanjut via WhatsApp", "Pesan otomatis berisi model, warna dan ukuran."),
        ("Waitlist kalau habis", "Email masuk ke tabel subscriber, bukan hilang."),
    ]
    for i, (title, sub) in enumerate(notes):
        a3 = ease_out(ramp(t, 0.85 + i * 0.22, 0.7))
        if a3 <= 0:
            continue
        ny = 460 + i * 108 + (1 - a3) * 16
        rule = int(34 * a3)
        paste_alpha(img, Image.new("RGBA", (rule, 2), (200, 162, 102, 210)), (x, ny + 14), a3)
        draw_text(img, (x + 54, ny), title, fnt(26, 500), PAPER, alpha=int(255 * a3))
        draw_text(img, (x + 54, ny + 34), sub, fnt(17, 400), MUTE, alpha=int(215 * a3))
    return img


# ── S5 · CRM desktop ──────────────────────────────────────────────────────
def s_crm(t: float, dur: float) -> Image.Image:
    img = Image.new("RGBA", (W, H), "#e9e2d5")
    g = radial_glow(1500, BRASS, peak=42)
    img.alpha_composite(g, (W // 2 - 750, -300))
    img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (15, 13, 11, 26)))

    content = ui.crm_dashboard(1500, 880, t=min(t / 2.2, 1.0), highlight=-1)
    win = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.browser(win, (206, 62), content, "tahuraboots-demo-v1.vercel.app/crm")
    a = ease_out(ramp(t, 0.05, 0.85))
    paste_alpha(img, win, (0, 0), a)

    # caption bawah
    a2 = ramp(t, 1.2, 0.8)
    if a2 > 0:
        paste_alpha(img, rounded((980, 46), 23, (15, 13, 11, 205)), (W // 2 - 490, 1014), a2)
        label = "CRM · STOK, PESANAN, PIPELINE — SATU DATABASE DENGAN STOREFRONT"
        lw = text_width(label, fnt(14, 600), 3.2)
        draw_text(img, (W // 2 - lw / 2, 1029), label, fnt(14, 600), PAPER, tracking=3.2, alpha=int(220 * a2))
    return img


# ── S6 · CRM di ponsel ────────────────────────────────────────────────────
def s_crm_mobile(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    # tab berganti di ritme yang enak dibaca (bukan tiap 1,25 s)
    marks = (0.0, 1.05, 2.45, 3.85)
    active = max(i for i, m in enumerate(marks) if t >= m)
    press = max(0.0, 1 - abs((t - marks[active]) - 0.1) / 0.34) if active else 0.0
    screen = ui.crm_phone(420, 900, active=active, t=t, pressed=press)

    # ponsel kedua di belakang untuk kedalaman
    back = ui.crm_phone(420, 900, active=max(0, active - 1), t=t)
    ph_back = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(ph_back, (150, 150), back)
    paste_alpha(img, ph_back, (0, 0), 0.35)

    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ui.phone(ph, (470, 92), screen)
    paste_alpha(img, ph, (0, 0), ease_out(ramp(t, 0.05, 0.9)))

    x = 1010
    eyebrow(img, (x, 236), "CRM di ponsel", alpha=ramp(t, 0.3, 0.8))
    for i, (line, fam, col) in enumerate([("One tap,", "display", PAPER),
                                         ("not a drawer.", "display-i", BRASS_L)]):
        a2 = ease_out(ramp(t, 0.45 + i * 0.12, 0.8))
        if a2 > 0:
            draw_text(img, (x, 288 + i * 72 + (1 - a2) * 22), line, fnt(64, 400, fam), col, alpha=int(255 * a2))

    bullets = [
        ("Tab bar bawah", "Overview, Orders, Leads, Stock — selalu terlihat."),
        ("Target 44px", "Satu aturan CSS, seluruh tombol CRM aman disentuh."),
        ("Aman dari notch", "safe-area + gesture bar Android."),
    ]
    for i, (title, sub) in enumerate(bullets):
        a3 = ease_out(ramp(t, 0.8 + i * 0.2, 0.7))
        if a3 <= 0:
            continue
        by = 470 + i * 108 + (1 - a3) * 18
        d = ImageDraw.Draw(img)
        d.ellipse([x, by + 8, x + 10, by + 18], fill=BRASS)
        draw_text(img, (x + 30, by), title, fnt(26, 500), PAPER, alpha=int(255 * a3))
        draw_text(img, (x + 30, by + 34), sub, fnt(17, 400), MUTE, alpha=int(215 * a3))
    return img


# ── S7 · fitur ────────────────────────────────────────────────────────────
def _icon(kind: str, img: Image.Image, xy: tuple[int, int], size: int, color: str) -> None:
    d = ImageDraw.Draw(img)
    x, y = xy
    if kind == "stock":
        d.rounded_rectangle([x, y, x + size, y + size], radius=3, outline=color, width=2)
        d.line([(x, y + size * 0.4), (x + size, y + size * 0.4)], fill=color, width=2)
        d.line([(x + size * 0.5, y + size * 0.4), (x + size * 0.5, y + size)], fill=color, width=2)
    elif kind == "bulk":
        for i in range(3):
            d.rectangle([x, y + i * size * 0.36, x + size, y + i * size * 0.36 + size * 0.2],
                        outline=color, width=2)
    elif kind == "csv":
        d.rectangle([x, y, x + size * 0.72, y + size], outline=color, width=2)
        for i in range(3):
            d.line([(x + size * 0.1, y + size * (0.28 + i * 0.22)), (x + size * 0.62, y + size * (0.28 + i * 0.22))],
                   fill=color, width=2)
        d.line([(x + size * 0.62, y + size * 0.52), (x + size, y + size * 0.52)], fill=color, width=2)
        d.line([(x + size * 0.86, y + size * 0.4), (x + size * 1.0, y + size * 0.52)], fill=color, width=2)
        d.line([(x + size * 0.86, y + size * 0.64), (x + size * 1.0, y + size * 0.52)], fill=color, width=2)
    elif kind == "touch":
        d.rounded_rectangle([x + size * 0.18, y + size * 0.12, x + size * 0.78, y + size * 0.9],
                            radius=6, outline=color, width=2)
        d.ellipse([x + size * 0.38, y + size * 0.22, x + size * 0.58, y + size * 0.4], outline=color, width=2)
        d.line([(x + size * 0.9, y + size * 0.3), (x + size * 0.9, y + size * 0.72)], fill=color, width=2)
        d.line([(x + size * 0.9, y + size * 0.3), (x + size, y + size * 0.3)], fill=color, width=2)


def s_features(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))

    # grid latar tipis
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for gx in range(0, W, 96):
        d.line([(gx, 0), (gx, H)], fill=(200, 162, 102, 9))
    for gy in range(0, H, 96):
        d.line([(0, gy), (W, gy)], fill=(200, 162, 102, 9))
    img = Image.alpha_composite(img, layer)

    eyebrow(img, (132, 150), "Built for the owner", alpha=ramp(t, 0.15, 0.7))
    a = ease_out(ramp(t, 0.25, 0.85))
    draw_text(img, (132, 194), "The parts that actually save time.", fnt(58, 400, "display"), PAPER,
              alpha=int(255 * a))

    cards = [
        ("stock", "Stok otomatis", "Pesanan memotong shelf; pembatalan mengembalikannya. Tidak ada stok hantu."),
        ("bulk", "Aksi massal", "Ubah status banyak pesanan sekali jalan, dengan konfirmasi."),
        ("csv", "Ekspor CSV", "Pesanan, lead dan katalog keluar rapi untuk pembukuan."),
        ("touch", "Ramah jempol", "Tombol 44px, tab bar bawah, aman dari gesture bar."),
    ]
    cw, ch = 396, 300
    for i, (icon, title, body) in enumerate(cards):
        a2 = ease_out(ramp(t, 0.45 + i * 0.16, 0.8))
        if a2 <= 0:
            continue
        x = 132 + i * (cw + 24)
        y = 348 + (1 - a2) * 36
        drop_shadow(img, (x, y, x + cw, y + ch), 16, alpha=int(120 * a2), blur=40, dy=20)
        paste_alpha(img, rounded((cw, ch), 16, "#16120e", border=(74, 59, 45, 230)), (x, y), a2)
        paste_alpha(img, rounded((cw, 3), 2, BRASS), (x, y), a2)
        _icon(icon, img, (x + 32, y + 40), 46, BRASS_L)
        draw_text(img, (x + 32, y + 112), title, fnt(28, 500), PAPER, alpha=int(255 * a2))
        # body dibungkus manual
        words, line, lines = body.split(), "", []
        for word in words:
            probe = f"{line} {word}".strip()
            if text_width(probe, fnt(16, 400)) > cw - 64:
                lines.append(line)
                line = word
            else:
                line = probe
        lines.append(line)
        for j, part in enumerate(lines):
            draw_text(img, (x + 32, y + 166 + j * 27), part, fnt(16, 400), "#b4ab9d", alpha=int(220 * a2))

    # pita marquee bawah (mengikuti marquee di storefront)
    ma = ease_out(ramp(t, 1.15, 0.9))
    if ma > 0:
        band_y, band_h = 772, 104
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.rectangle([0, band_y, W, band_y + band_h], fill=(23, 19, 15, int(235 * ma)))
        d.line([(0, band_y), (W, band_y)], fill=(200, 162, 102, int(70 * ma)), width=1)
        d.line([(0, band_y + band_h), (W, band_y + band_h)], fill=(200, 162, 102, int(70 * ma)), width=1)
        img = Image.alpha_composite(img, layer)

        words = "HAND-WELTED   ·   TOCHIGI VACHETTA   ·   MADE TO ORDER   ·   SHIPS WORLDWIDE   ·   RESOLE FOR LIFE   ·   BANDUNG"
        wfont = fnt(25, 500)
        tw = text_width(words + "   ·   ", wfont, 6)
        offset = (t * 150) % tw
        strip = Image.new("RGBA", (W, band_h), (0, 0, 0, 0))
        x0 = -offset
        while x0 < W:
            draw_text(strip, (x0, (band_h - 25) / 2 - 2), words, wfont, BRASS_L, tracking=6)
            x0 += tw
        mask = Image.new("L", (W, band_h), 0)
        ImageDraw.Draw(mask).rectangle([0, 0, W, band_h], fill=255)
        # pudar di kedua ujung
        fade_w = 160
        grad = Image.new("L", (W, 1), 255)
        gd = ImageDraw.Draw(grad)
        for i in range(fade_w):
            v = int(255 * (i / fade_w))
            gd.point((i, 0), fill=v)
            gd.point((W - 1 - i, 0), fill=v)
        grad = grad.resize((W, band_h), Image.NEAREST)
        mask = Image.composite(mask, Image.new("L", (W, band_h), 0), grad)
        strip.putalpha(Image.composite(strip.getchannel("A"), Image.new("L", (W, band_h), 0), grad).point(
            lambda v: int(v * ma)))
        img.alpha_composite(strip, (0, band_y))
    return img


# ── S8 · penutup ──────────────────────────────────────────────────────────
def s_outro(t: float, dur: float) -> Image.Image:
    img = ink_background((W, H))
    fade = 1 - ramp(t, dur - 0.9, 0.9)

    p = ease_out(ramp(t, 0.1, 0.8))
    draw_crest(img, (W // 2 - 30, 150), 76, BRASS, alpha=int(255 * p * fade), progress=p)

    a = ease_out(ramp(t, 0.3, 0.9))
    tw = text_width("TAHURA", fnt(64, 400, "display"), 14)
    draw_text(img, (W // 2 - tw / 2, 256), "TAHURA", fnt(64, 400, "display"), PAPER,
              tracking=14, alpha=int(255 * a * fade))
    sub = "BOOTS COMPANY · BANDUNG"
    sw = text_width(sub, fnt(15, 500), 8)
    draw_text(img, (W // 2 - sw / 2, 340), sub, fnt(15, 500), MUTE, tracking=8, alpha=int(210 * a * fade))

    a2 = ease_out(ramp(t, 0.7, 0.9))
    tw2 = text_width("Boots built to outlive the trend.", fnt(44, 400, "display-i"))
    draw_text(img, (W // 2 - tw2 / 2, 396), "Boots built to outlive the trend.",
              fnt(44, 400, "display-i"), BRASS_L, alpha=int(255 * a2 * fade))

    a3 = ease_out(ramp(t, 1.2, 0.8))
    if a3 > 0:
        pill_w, pill_h = 760, 84
        px, py = W // 2 - pill_w // 2, 500
        paste_alpha(img, rounded((pill_w, pill_h), 42, (23, 19, 15, 235),
                                 border=(200, 162, 102, 150), border_w=2), (px, py), a3)
        label = "LIVE DEMO"
        draw_text(img, (px + 34, py + 22), label, fnt(12, 600), BRASS, tracking=3, alpha=int(255 * a3))
        paste_alpha(img, Image.new("RGBA", (1, 40), (74, 59, 45, 220)), (px + 132, py + 22), a3)
        url = "tahuraboots-demo-v1.vercel.app"
        draw_text(img, (px + 156, py + 24), url, fnt(30, 400, "display"), PAPER, alpha=int(255 * a3))

    a4 = ease_out(ramp(t, 1.7, 0.8))
    if a4 > 0:
        items = ["20 styles", "Owner CRM", "Mobile-first", "Next.js 16 · Drizzle · Postgres"]
        widths = [text_width(i, fnt(15, 500), 2) for i in items]
        total = sum(widths) + 26 * (len(items) - 1) + 2 * len(items) * 22
        cx = W // 2 - total / 2
        for item, iw in zip(items, widths):
            chip(img, (int(cx), 636), item.upper(), size=13, tracking=2, pad_x=18, pad_y=10,
                 color=SAND, alpha=a4)
            cx += iw + 36 + 18

    a5 = ease_out(ramp(t, 2.2, 0.9))
    if a5 > 0:
        thumbs = [
            f"{IMG}/boot-olive.jpg", f"{IMG}/catalog/ciwidey-western.jpg",
            f"{IMG}/catalog/cibaduyut-western.jpg", f"{IMG}/boot-croc.jpg",
        ]
        size, gap = 132, 18
        total_w = len(thumbs) * size + (len(thumbs) - 1) * gap
        tx0 = W // 2 - total_w // 2
        for i, path in enumerate(thumbs):
            ta = ease_out(ramp(t, 2.2 + i * 0.09, 0.7))
            if ta <= 0:
                continue
            tile = cover(path, size, size, radius=3)
            paste_alpha(img, tile, (tx0 + i * (size + gap), 742 + (1 - ta) * 14), ta)
            paste_alpha(img, rounded((size, 1), 0, (200, 162, 102, 120)),
                        (tx0 + i * (size + gap), 742 + size + 8), ta)

    a6 = ease_out(ramp(t, 2.7, 0.9))
    if a6 > 0:
        foot = "Dibangun untuk Tahura Boots Company · demo publik, data contoh"
        fw = text_width(foot, fnt(14, 400), 1.5)
        draw_text(img, (W // 2 - fw / 2, 926), foot, fnt(14, 400), "#7d7365", tracking=1.5,
                  alpha=int(200 * a6))

    if fade < 1:
        img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - fade)))))
    return img


SCENE_FN = {
    "brand": s_brand,
    "storefront": s_storefront,
    "catalog": s_catalog,
    "detail": s_detail,
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

    # Crossfade di AWAL adegan: adegan sebelumnya menyelesaikan animasinya
    # sementara adegan baru naik dari 0. (Kalau di akhir adegan, adegan
    # berikutnya sempat tampil lalu "reset" ke 0 saat batas adegan.)
    if idx > 0 and local < OVERLAP:
        prev_name, prev_dur = SCENES[idx - 1]
        prev = SCENE_FN[prev_name](min(prev_dur, prev_dur - OVERLAP + local), prev_dur).convert("RGBA")
        # Semua transisi lewat hitam sekejap (0,5 dtk: 0,25 turun + 0,25 naik).
        # Crossfade langsung antara dua layar UI terbaca seperti double
        # exposure — teks dua adegan saling menumpuk.
        p = local / OVERLAP
        if p < 0.5:
            dark = ease_in_out(p / 0.5)
            img = Image.alpha_composite(
                prev, Image.new("RGBA", (W, H), (0, 0, 0, int(246 * dark))))
        else:
            dark = ease_in_out((1 - p) / 0.5)
            img = Image.alpha_composite(
                img, Image.new("RGBA", (W, H), (0, 0, 0, int(246 * dark))))

    img = add_vignette(img, 118)
    img = add_grain(img, 3.2)

    # penanda progres sangat tipis di dasar frame
    progress = clamp(t / TOTAL)
    if progress > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.rectangle([0, H - 3, int(W * progress), H - 1], fill=(200, 162, 102, 120))
        d.line([(0, H - 4), (W, H - 4)], fill=(200, 162, 102, 28), width=1)
        img = Image.alpha_composite(img, layer)
    return img.convert("RGB")


# ── Audio ─────────────────────────────────────────────────────────────────
def build_audio(path: Path, duration: float, sr: int = 48000) -> None:
    n = int(duration * sr)
    t = np.arange(n) / sr
    rng = np.random.default_rng(11)

    def tone(freq: float, detune: float = 0.0, amp: float = 1.0, lfo: float = 0.0) -> np.ndarray:
        sig = np.sin(2 * np.pi * (freq + detune) * t)
        sig += 0.35 * np.sin(2 * np.pi * (freq * 2 + detune) * t)
        sig += 0.15 * np.sin(2 * np.pi * (freq * 3 + detune) * t)
        if lfo:
            sig *= 1 + 0.18 * np.sin(2 * np.pi * lfo * t + freq)
        return sig * amp

    # Pad Dm: D2 A2 F3 C4 (dengan detune halus biar hangat)
    pad = (tone(73.42, 0.0, 0.30) + tone(73.42, 0.35, 0.22) +
           tone(110.0, -0.2, 0.22) + tone(174.61, 0.15, 0.16) +
           tone(261.63, -0.3, 0.10))
    # gerbang lambat supaya terasa "bernapas"
    pad *= 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.055 * t - 1.2))

    # bass pulse tiap 2 detik
    beat = 2.0
    pulse = np.zeros(n)
    for start in np.arange(1.2, duration, beat):
        i0 = int(start * sr)
        length = int(0.9 * sr)
        if i0 + length >= n:
            length = n - i0
        env = np.exp(-np.linspace(0, 6, length))
        pulse[i0:i0 + length] += np.sin(2 * np.pi * 55 * np.arange(length) / sr) * env * 0.5

    # noise "air" + whoosh di tiap transisi adegan
    air = rng.normal(0, 1, n)
    kernel = np.ones(220) / 220
    air = np.convolve(air, kernel, mode="same") * 0.10

    whoosh = np.zeros(n)
    for start in STARTS[1:]:
        i0 = int((start - 0.55) * sr)
        length = int(1.3 * sr)
        if i0 < 0:
            continue
        length = min(length, n - i0)
        env = np.hanning(length) ** 2
        noise = rng.normal(0, 1, length)
        noise = np.convolve(noise, np.ones(28) / 28, mode="same")
        whoosh[i0:i0 + length] += noise * env * 0.09

    mix = pad * 0.55 + pulse * 0.42 + air + whoosh

    # lowpass satu-pole di domain frekuensi (setara, tapi tanpa loop Python)
    spec = np.fft.rfft(mix)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    spec /= np.sqrt(1 + (freqs / 1650.0) ** 2)
    mix = np.fft.irfft(spec, n)

    # fade in/out (setelah filter supaya tepi tetap bersih)
    fade = int(1.2 * sr)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-int(1.6 * sr):] *= np.linspace(1, 0, int(1.6 * sr))

    mix = np.tanh(mix * 1.25) * 0.72
    left = mix
    right = np.roll(mix, 240) * 0.98
    stereo = np.stack([left, right], axis=1)
    peak = np.max(np.abs(stereo)) or 1.0
    stereo = stereo / peak * 0.82
    pcm = (stereo * 32767).astype(np.int16)

    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


# ── CLI ───────────────────────────────────────────────────────────────────
def ffmpeg_bin() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def cmd_stills(times: list[float]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for value in times:
        img = render_frame(value)
        target = OUT_DIR / f"still-{value:05.2f}.png"
        img.save(target)
        print("→", target, img.size)


def cmd_render() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    video = OUT_DIR / "_video.mp4"
    audio = OUT_DIR / "_audio.wav"
    final = OUT_DIR / "tahura-demo.mp4"
    frames = int(TOTAL * FPS)

    print(f"Render {frames} frame · {TOTAL:.1f}s · {W}x{H} @ {FPS}fps")
    build_audio(audio, TOTAL + 0.6)
    print("Audio siap")

    cmd = [ffmpeg_bin(), "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "24",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
           "-movflags", "+faststart", str(video)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(frames):
        proc.stdin.write(render_frame(i / FPS).tobytes())
        if i % 60 == 0:
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
