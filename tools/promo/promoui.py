"""Mockup layar aplikasi (storefront + CRM) untuk video promo.

Dibangun manual mengikuti komponen aslinya (warna, font, radius, teks) karena
sandbox tidak punya browser untuk screenshot.
"""

from __future__ import annotations

from PIL import Image, ImageDraw

from promolib import (
    BRASS, BRASS_L, CLAY, CRM, CRM_LINE, INK, INK2, INK3, LINE, LINE_SOFT, MOSS,
    MUTE, OXBLOOD, PAPER, PARCH, SAND, SITE,
    chip, cover, draw_arrow, draw_crest, draw_text, drop_shadow, fnt, paste_alpha, rounded,
    text_width,
)


def clip(value: str, font, max_w: float) -> str:
    """Potong teks dengan elipsis supaya tidak menabrak kolom sebelah."""
    if text_width(value, font) <= max_w:
        return value
    out = value
    while out and text_width(out + "…", font) > max_w:
        out = out[:-1]
    return out.rstrip() + "…"

IMG = str(SITE / "public/images")

PRODUCTS = [
    ("Bandung Toe-Cap", "OLIVE GROVE · TOCHIGI VACHETTA", "Rp 3.450.000", "IN STOCK", f"{IMG}/boot-olive.jpg", "ready", True),
    ("Ciwidey Western", "TOBACCO TAN · JAVAN COWHIDE", "Rp 4.150.000", "2 PAIRS LEFT", f"{IMG}/catalog/ciwidey-western.jpg", "ready", True),
    ("Cibaduyut Show Western", "BLACK · HAND EMBROIDERED", "Rp 4.450.000", "6–8 WEEK BUILD", f"{IMG}/catalog/cibaduyut-western.jpg", "mto", False),
    ("Antapani Derby", "GREY · OILED SUEDE", "Rp 2.750.000", "3 PAIRS LEFT", f"{IMG}/catalog/antapani-derby.jpg", "ready", False),
    ("Maribaya Mountain", "COCOA · WAXED FLESH", "Rp 3.850.000", "3 PAIRS LEFT", f"{IMG}/catalog/maribaya-mountain.jpg", "ready", False),
    ("Setiabudi Service", "OLIVE · SERVICE BOOT", "Rp 3.650.000", "5 PAIRS LEFT", f"{IMG}/catalog/setiabudi-service.jpg", "ready", False),
    ("Ujungberung Mustard", "MUSTARD · SUEDE", "Rp 2.350.000", "6–8 WEEK BUILD", f"{IMG}/catalog/ujungberung-suede.jpg", "mto", False),
    ("Riau Canvas Tall", "BROWN · CANVAS SHAFT", "Rp 3.150.000", "2 PAIRS LEFT", f"{IMG}/catalog/riau-canvas.jpg", "ready", False),
]

STATUS_DOT = {"ready": MOSS, "mto": BRASS, "sold": CLAY}
STATUS_LABEL = {"ready": "READY TO SHIP", "mto": "MADE TO ORDER", "sold": "SOLD OUT"}


# ── Bingkai perangkat ─────────────────────────────────────────────────────
def phone(canvas: Image.Image, xy: tuple[int, int], screen: Image.Image, *, width: int = 420,
          shadow: bool = True) -> tuple[int, int, int, int]:
    bezel = 12
    sw, sh = screen.size
    w, h = sw + bezel * 2, sh + bezel * 2
    radius = int(width * 0.115)
    if shadow:
        drop_shadow(canvas, (xy[0], xy[1], xy[0] + w, xy[1] + h), radius, alpha=150, blur=48, dy=26)
    frame = rounded((w, h), radius, "#070605", border="#3a332c", border_w=2)
    paste_alpha(canvas, frame, xy)
    # tombol samping
    draw = ImageDraw.Draw(canvas)
    for by, bh in ((110, 62), (190, 62)):
        draw.rounded_rectangle([xy[0] + w - 3, xy[1] + by, xy[0] + w + 3, xy[1] + by + bh],
                               radius=3, fill="#2c2620")
    mask = rounded((sw, sh), max(10, radius - bezel), "#000").getchannel("A")
    scr = screen.copy()
    scr.putalpha(mask)
    paste_alpha(canvas, scr, (xy[0] + bezel, xy[1] + bezel))
    return (xy[0], xy[1], xy[0] + w, xy[1] + h)


def browser(canvas: Image.Image, xy: tuple[int, int], content: Image.Image, url: str, *,
            shadow: bool = True) -> tuple[int, int, int, int]:
    cw, ch = content.size
    bar = 46
    radius = 14
    box = (xy[0], xy[1], xy[0] + cw, xy[1] + ch + bar)
    if shadow:
        drop_shadow(canvas, box, radius, alpha=160, blur=56, dy=30)
    shell = rounded((cw, ch + bar), radius, "#1b1712", border="#3a332c", border_w=2)
    paste_alpha(canvas, shell, xy)
    d = ImageDraw.Draw(canvas)
    for i, col in enumerate(("#5a4b45", "#5a5a45", "#455a48")):
        cx = xy[0] + 26 + i * 22
        d.ellipse([cx - 6, xy[1] + bar / 2 - 6, cx + 6, xy[1] + bar / 2 + 6], fill=col)
    pill_w = min(cw - 220, 560)
    paste_alpha(canvas, rounded((pill_w, 26), 13, "#0f0d0b", border="#33291f"), (xy[0] + 96, xy[1] + 10))
    draw_text(canvas, (xy[0] + 114, xy[1] + 15), url, fnt(15, 400), MUTE)
    mask = rounded((cw, ch), 0, "#000").getchannel("A")
    body = content.copy()
    body.putalpha(mask)
    paste_alpha(canvas, body, (xy[0], xy[1] + bar))
    return box


def status_bar(canvas: Image.Image, w: int, color: str = PAPER) -> None:
    draw_text(canvas, (26, 16), "11:06", fnt(19, 600), color)
    x = w - 30
    # baterai
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([x - 30, 20, x, 34], radius=3, outline=color, width=2)
    draw.rectangle([x - 27, 23, x - 8, 31], fill=color)
    draw.rectangle([x + 2, 24, x + 4, 30], fill=color)
    # wifi + sinyal
    for i in range(4):
        bx = x - 48 - i * 9
        hgt = 4 + i * 3
        draw.rectangle([bx, 34 - hgt, bx + 5, 34], fill=color)
    draw.arc([x - 86, 12, x - 56, 34], start=200, end=340, fill=color, width=2)
    draw.arc([x - 80, 17, x - 62, 32], start=200, end=340, fill=color, width=2)


# ── Storefront: katalog ───────────────────────────────────────────────────
def storefront_catalog(w: int = 420, height: int = 900, scroll: float = 0.0,
                       flash: float = 0.0) -> Image.Image:
    content_h = 1560
    img = Image.new("RGBA", (w, content_h), INK)
    d = ImageDraw.Draw(img)
    status_bar(img, w)

    # header situs
    draw_crest(img, (18, 58), 34, BRASS)
    draw_text(img, (66, 58), "TAHURA", fnt(23, 400, "display"), PAPER, tracking=3.2)
    draw_text(img, (66, 88), "BOOTS COMPANY", fnt(9, 500), MUTE, tracking=4.2)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([w - 62, 62, w - 18, 106], radius=4, outline="#4a4136", width=2)
    for i in range(3):
        d.line([(w - 54, 76 + i * 8), (w - 26, 76 + i * 8)], fill=PAPER, width=2)
    d.line([(0, 124), (w, 124)], fill=LINE, width=1)

    # judul koleksi
    y = 148
    draw_text(img, (18, y), "20 OF 20 STYLES", fnt(12, 500), MUTE, tracking=3.6)
    y += 30
    draw_text(img, (18, y), "Pairs on the shelf", fnt(30, 400, "display"), PAPER)
    y += 42
    draw_text(img, (18, y), "and on the bench.", fnt(30, 400, "display-i"), BRASS_L)
    y += 56
    # chips filter
    cx = 18
    for label in ("ALL 20", "READY 14", "MADE TO ORDER 4", "ARCHIVE"):
        x2, _ = chip(img, (cx, y), label, size=11, filled=(cx == 18), tracking=2.2, pad_x=12, pad_y=9)
        cx = x2 + 8
    y += 52

    # grid 2 kolom persegi
    pad, gap = 18, 12
    col_w = (w - pad * 2 - gap) // 2
    for i, (name, meta, price, stock, path, kind, feat) in enumerate(PRODUCTS):
        col, row = i % 2, i // 2
        x = pad + col * (col_w + gap)
        yy = y + row * (col_w + 104)
        tile = cover(path, col_w, col_w, radius=2, zoom=1.0)
        paste_alpha(img, tile, (x, yy))
        # chip status
        cw = text_width(STATUS_LABEL[kind], fnt(9, 600), 1.6) + 20
        paste_alpha(img, rounded((int(cw), 22), 2, (15, 13, 11, 165)), (x + 8, yy + 8))
        d.ellipse([x + 15, yy + 17, x + 20, yy + 22], fill=STATUS_DOT[kind])
        draw_text(img, (x + 26, yy + 14), STATUS_LABEL[kind], fnt(9, 600), PAPER, tracking=1.6)
        # teks kartu
        ty = yy + col_w + 12
        draw_text(img, (x, ty), clip(name, fnt(16, 400, "display"), col_w), fnt(16, 400, "display"), PAPER)
        draw_text(img, (x, ty + 24), clip(meta, fnt(8, 500), col_w), fnt(8, 500), MUTE, tracking=1.2)
        draw_text(img, (x, ty + 42), price, fnt(13, 500), "#d9d2c4")
        draw_text(img, (x, ty + 60), stock, fnt(8, 500), MUTE, tracking=1.2)

    top = int(scroll)
    out = img.crop((0, top, w, top + height)).convert("RGBA")
    # scrim bawah — menandakan grid masih bisa digulir
    scrim_h = 84
    scrim = Image.new("RGBA", (w, scrim_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for i in range(scrim_h):
        sd.line([(0, i), (w, i)], fill=(15, 13, 11, int(235 * (i / scrim_h) ** 1.6)))
    out.alpha_composite(scrim, (0, height - scrim_h))
    if flash > 0:
        overlay = Image.new("RGBA", out.size, (200, 162, 102, int(40 * flash)))
        out = Image.alpha_composite(out, overlay)
    return out


# ── Storefront: detail produk ─────────────────────────────────────────────
def storefront_detail(w: int = 420, height: int = 900) -> Image.Image:
    img = Image.new("RGBA", (w, height), INK)
    photo_h = int(w * 1.05)
    paste_alpha(img, cover(f"{IMG}/boot-olive.jpg", w, photo_h, radius=0, zoom=1.02), (0, 0))
    grad = Image.new("RGBA", (w, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(photo_h):
        a = int(230 * (i / photo_h) ** 2.2)
        gd.line([(0, i), (w, i)], fill=(15, 13, 11, a))
    img = Image.alpha_composite(img, grad)
    status_bar(img, w)

    # tombol tutup + chip
    d = ImageDraw.Draw(img)
    d.ellipse([w - 52, 52, w - 20, 84], fill=(15, 13, 11, 170), outline=(244, 238, 226, 90))
    d.line([(w - 43, 61), (w - 29, 75)], fill=PAPER, width=2)
    d.line([(w - 29, 61), (w - 43, 75)], fill=PAPER, width=2)
    y = photo_h - 96
    draw_text(img, (20, y), "BANDUNG TOE-CAP", fnt(10, 600), BRASS_L, tracking=3.2)
    draw_text(img, (20, y + 20), "Olive Grove", fnt(34, 400, "display"), PAPER)
    draw_text(img, (20, y + 66), "TOCHIGI VACHETTA · GOODYEAR WELT", fnt(9, 500), MUTE, tracking=1.8)

    y = photo_h + 18
    draw_text(img, (20, y), "Rp 3.450.000", fnt(24, 500, "display"), PAPER)
    x2, _ = chip(img, (w - 150, y - 4), "IN STOCK", size=9, color=MOSS, tracking=1.8, pad_x=10, pad_y=8)
    y += 46
    draw_text(img, (20, y), "SELECT SIZE · EU", fnt(9, 600), MUTE, tracking=2.4)
    y += 22
    sizes = ["39", "40", "41", "42", "43", "44", "45"]
    for i, s in enumerate(sizes):
        bx = 20 + i * 44
        active = i == 3
        paste_alpha(img, rounded((38, 38), 4, BRASS if active else (0, 0, 0, 0),
                                 border=None if active else "#4a4136", border_w=2), (bx, y))
        draw_text(img, (bx + 12, y + 9), s, fnt(14, 600), INK if active else PAPER)
    y += 56
    # tombol whatsapp
    paste_alpha(img, rounded((w - 40, 50), 6, "#1d3a2a", border="#3f6b4e", border_w=2), (20, y))
    d = ImageDraw.Draw(img)
    d.ellipse([36, y + 20, 46, y + 30], fill="#63c07f")
    draw_text(img, (58, y + 15), "WHATSAPP THE BENCH", fnt(11, 600), PAPER, tracking=2.6)
    draw_arrow(img, w - 54, y + 14, 13, PAPER, diagonal=True)
    y += 62
    paste_alpha(img, rounded((w - 40, 44), 6, (0, 0, 0, 0), border=LINE_SOFT, border_w=2), (20, y))
    draw_text(img, (38, y + 13), "JOIN THE WAITLIST", fnt(10, 600), MUTE, tracking=2.6)
    y += 60
    draw_text(img, (20, y), "In stock at the Bandung studio · ships in 48 hours",
              fnt(10, 400), MUTE)
    y += 34
    d.line([(20, y), (w - 20, y)], fill="#2a241d", width=1)
    y += 20
    draw_text(img, (20, y), "THE DETAILS", fnt(9, 600), MUTE, tracking=2.4)
    y += 24
    specs = [("Upper", "Tochigi vachetta, 30-day vegetable tan"),
             ("Welt", "Goodyear hand-welted, braided thread"),
             ("Sole", "Single leather, resoleable for life"),
             ("Last", "House last, D width")]
    for key, value in specs:
        draw_text(img, (20, y), key.upper(), fnt(8, 600), "#8b8173", tracking=1.6)
        draw_text(img, (96, y - 2), clip(value, fnt(11, 400), w - 116), fnt(11, 400), "#d9d2c4")
        y += 26
    return img


# ── CRM: dashboard desktop ────────────────────────────────────────────────
def crm_dashboard(w: int = 1500, h: int = 880, t: float = 1.0, highlight: int = -1) -> Image.Image:
    img = Image.new("RGBA", (w, h), CRM)
    d = ImageDraw.Draw(img)
    side = 250

    # sidebar
    d.rectangle([0, 0, side, h], fill=INK)
    draw_crest(img, (26, 26), 40, BRASS)
    draw_text(img, (78, 26), "TAHURA", fnt(20, 400, "display"), PAPER, tracking=3)
    draw_text(img, (78, 54), "OWNER CONSOLE", fnt(8, 500), "#7a6f60", tracking=3)

    nav = [("Overview", 0), ("Orders", 7), ("Leads", 5), ("Inventory", 2)]
    y = 110
    for i, (label, badge) in enumerate(nav):
        active = i == 0
        if active:
            paste_alpha(img, rounded((side - 24, 42), 8, (244, 238, 226, 22)), (12, y))
        nav_icon(img, i, 26, y + 13, BRASS if active else "#6b6155", size=17)
        draw_text(img, (56, y + 11), label, fnt(14, 500 if active else 400),
                  PAPER if active else "#9c9184")
        if badge:
            bx = side - 48
            paste_alpha(img, rounded((24, 20), 10, (200, 162, 102, 46) if active else (244, 238, 226, 18)), (bx, y + 11))
            draw_text(img, (bx + 7, y + 14), str(badge), fnt(10, 600),
                      BRASS if active else "#9c9184")
        y += 46

    draw_text(img, (26, h - 96), "VIEW STOREFRONT", fnt(9, 500), "#7a6f60", tracking=2.6)
    d.line([(0, h - 56), (side, h - 56)], fill="#2b241d", width=1)
    draw_text(img, (26, h - 40), "Studio owner · Bandung", fnt(10, 400), "#7a6f60")

    # header
    d.rectangle([side, 0, w, h], fill=CRM)
    draw_text(img, (side + 40, 34), "OWNER CONSOLE", fnt(10, 600), BRASS, tracking=3.4)
    draw_text(img, (side + 40, 56), "Overview", fnt(30, 400, "display"), "#221b15")
    draw_text(img, (side + 40, 96), "Stok, pesanan dan pipeline dari database yang sama dengan storefront.",
              fnt(12, 400), "#7a7062")

    # KPI
    kpis = [("REVENUE IN THE LEDGER", "Rp 58.250.000", "+8.3% WoW", True),
            ("ORDERS IN MOTION", "7", "2 pending payment", False),
            ("PAIRS ON THE SHELF", "46", "3 sold out", True),
            ("OPEN ENQUIRIES", "5", "12% pipeline conversion", True)]
    cw = (w - side - 80 - 36) // 4
    for i, (label, value, sub, pos) in enumerate(kpis):
        x = side + 40 + i * (cw + 12)
        appear = max(0.0, min(1.0, t * 2.6 - i * 0.18))
        if appear <= 0:
            continue
        yy = 132 + int((1 - appear) * 18)
        paste_alpha(img, rounded((cw, 108), 12, "#ffffff", border=CRM_LINE, border_w=1), (x, yy), appear)
        draw_text(img, (x + 18, yy + 18), label, fnt(9, 600), "#8b8173", tracking=1.6, alpha=int(255 * appear))
        draw_text(img, (x + 18, yy + 40), value, fnt(24, 400, "display"), "#221b15", alpha=int(255 * appear))
        dot = MOSS if pos else CLAY
        d = ImageDraw.Draw(img)
        d.ellipse([x + 18, yy + 82, x + 24, yy + 88], fill=dot)
        draw_text(img, (x + 32, yy + 78), sub, fnt(10, 400), "#8b8173", alpha=int(255 * appear))

    # chart
    cy = 262
    chart_w = int((w - side - 80) * 0.62)
    paste_alpha(img, rounded((chart_w, 320), 12, "#ffffff", border=CRM_LINE), (side + 40, cy))
    draw_text(img, (side + 62, cy + 20), "Revenue by week", fnt(14, 600), "#221b15")
    draw_text(img, (side + 62, cy + 42), "Paid, in production, shipped and delivered · last eight weeks",
              fnt(10, 400), "#8b8173")
    paste_alpha(img, rounded((150, 26), 13, "#f4eee2"), (side + 40 + chart_w - 172, cy + 18))
    draw_text(img, (side + 40 + chart_w - 156, cy + 25), "Avg. order Rp 4,15 jt", fnt(10, 600), "#8a6a3c")

    bars = [0.28, 0.46, 0.34, 0.58, 0.49, 0.72, 0.61, 0.88]
    labels = ["05 Sep", "12 Sep", "19 Sep", "26 Sep", "03 Oct", "10 Oct", "17 Oct", "24 Oct"]
    bx0 = side + 62
    bw = (chart_w - 84) // len(bars)
    base = cy + 288
    max_h = 150
    for i, v in enumerate(bars):
        grow = max(0.0, min(1.0, (t - 0.25 - i * 0.07) * 3.2))
        hh = int(max_h * v * grow)
        x = bx0 + i * bw
        col_a, col_b = (("#6d2126", "#a8674c") if i == len(bars) - 1 else ("#b3925c", "#e3c995"))
        if hh > 4:
            for k in range(hh):
                f = k / max(hh - 1, 1)
                c1 = tuple(int(col_a[j:j + 2], 16) for j in (1, 3, 5))
                c2 = tuple(int(col_b[j:j + 2], 16) for j in (1, 3, 5))
                col = tuple(int(c1[m] + (c2[m] - c1[m]) * f) for m in range(3))
                d.line([(x + 6, base - k), (x + bw - 18, base - k)], fill=col)
        draw_text(img, (x + 4, base + 10), labels[i], fnt(9, 500), "#a19683")

    # lead pipeline
    px = side + 40 + chart_w + 16
    pw = w - px - 40
    paste_alpha(img, rounded((pw, 320), 12, "#ffffff", border=CRM_LINE), (px, cy))
    draw_text(img, (px + 22, cy + 20), "Lead pipeline", fnt(14, 600), "#221b15")
    stages = [("New", 2, BRASS), ("In conversation", 2, "#6d8da3"), ("Quoted", 2, "#9a6fa1"), ("Converted", 1, MOSS)]
    yy = cy + 56
    for label, count, color in stages:
        draw_text(img, (px + 22, yy), label, fnt(10, 500), "#5f5548")
        draw_text(img, (px + pw - 34, yy), str(count), fnt(10, 600), "#221b15")
        paste_alpha(img, rounded((pw - 44, 6), 3, "#f1ebdf"), (px + 22, yy + 18))
        paste_alpha(img, rounded((int((pw - 44) * (count / 8)), 6), 3, color), (px + 22, yy + 18))
        yy += 44
    paste_alpha(img, rounded((pw - 44, 62), 8, "#faf6ee"), (px + 22, yy + 6))
    draw_text(img, (px + 36, yy + 18), "OPEN PIPELINE VALUE", fnt(8, 600), "#8a6a3c", tracking=1.4)
    draw_text(img, (px + 36, yy + 34), "Rp 21.900.000", fnt(18, 400, "display"), "#221b15")

    # tabel order
    ty = 604
    paste_alpha(img, rounded((w - side - 80, 240), 12, "#ffffff", border=CRM_LINE), (side + 40, ty))
    draw_text(img, (side + 62, ty + 18), "Recent orders", fnt(13, 600), "#221b15")
    draw_text(img, (side + 62, ty + 38), "Newest at the top", fnt(9, 400), "#8b8173")
    cols = ["ORDER", "CUSTOMER", "CITY", "STATUS", "TOTAL"]
    xs = [side + 62, side + 200, side + 460, side + 700, w - 220]
    for i, c in enumerate(cols):
        draw_text(img, (xs[i], ty + 70), c, fnt(8, 600), "#a19683", tracking=1.6)
    rows = [("TB-261030-1015", "Arya Wibisono", "Bandung", "DELIVERED", "Rp 6.900.000"),
            ("TB-261030-1014", "Hana Yoshida", "Tokyo", "SHIPPED", "Rp 4.150.000"),
            ("TB-261030-1013", "Lucas Meyer", "Berlin", "PAID", "Rp 4.850.000"),
            ("TB-261030-1012", "Putri Anjani", "Jakarta", "IN PRODUCTION", "Rp 3.450.000")]
    ry = ty + 96
    for i, (num, name, city, st, total) in enumerate(rows):
        if highlight == i:
            paste_alpha(img, rounded((w - side - 104, 30), 6, "#faf6ee"), (side + 52, ry - 6))
        draw_text(img, (xs[0], ry), num, fnt(10, 500), "#3c332a")
        draw_text(img, (xs[1], ry), name, fnt(10, 400), "#5f5548")
        draw_text(img, (xs[2], ry), city, fnt(10, 400), "#8b8173")
        pill_col = {"DELIVERED": "#e6e4dd", "SHIPPED": "#dce9ef", "PAID": "#e2ecdc",
                    "IN PRODUCTION": "#e8e1f0"}[st]
        tw = text_width(st, fnt(8, 600), 1.2) + 20
        paste_alpha(img, rounded((int(tw), 20), 10, pill_col), (xs[3], ry - 4))
        draw_text(img, (xs[3] + 10, ry + 1), st, fnt(8, 600), "#3c332a", tracking=1.2)
        draw_text(img, (xs[4], ry), total, fnt(10, 500), "#221b15")
        ry += 34
    return img


def nav_icon(img: Image.Image, kind: int, x: int, y: int, color: str,
             size: int = 20, weight: int = 2) -> None:
    """Ikon navigasi vektor (4 jenis) — pengganti glyph unicode yang jadi tofu."""
    d = ImageDraw.Draw(img)
    s = size / 20.0
    w = max(1, int(round(weight * s)))

    def px(v):
        return x + v * s

    def py(v):
        return y + v * s

    if kind == 0:  # overview — empat kotak
        for dx, dy in ((0, 0), (11, 0), (0, 11), (11, 11)):
            d.rectangle([px(dx), py(dy), px(dx + 8), py(dy + 8)], outline=color, width=w)
    elif kind == 1:  # orders — tiga baris
        for dy in (2, 9, 16):
            d.line([(px(0), py(dy)), (px(19), py(dy))], fill=color, width=w + 1)
    elif kind == 2:  # leads — orang
        d.ellipse([px(6), py(0), px(14), py(8)], outline=color, width=w)
        d.arc([px(0), py(9), px(20), py(27)], start=180, end=360, fill=color, width=w)
    else:  # stock — kotak
        d.rectangle([px(1), py(2), px(19), py(18)], outline=color, width=w)
        d.line([(px(1), py(8)), (px(19), py(8))], fill=color, width=w)
        d.line([(px(10), py(8)), (px(10), py(18))], fill=color, width=w)


def _tab_icon(img: Image.Image, kind: int, x: int, y: int, color: str) -> None:
    nav_icon(img, kind, x, y, color, size=20, weight=2)


# ── CRM: layar ponsel ─────────────────────────────────────────────────────
def crm_phone(w: int = 420, height: int = 900, active: int = 1, t: float = 1.0,
              pressed: float = 0.0) -> Image.Image:
    img = Image.new("RGBA", (w, height), CRM)
    status_bar(img, w, "#221b15")
    d = ImageDraw.Draw(img)

    # top bar
    d.rectangle([0, 44, w, 108], fill="#efe8da")
    draw_crest(img, (16, 60), 28, "#7a5a2e")
    draw_text(img, (50, 62), "TAHURA", fnt(15, 400, "display"), "#221b15", tracking=1.6)
    labels = ["Overview", "Orders", "Leads", "Inventory"]
    lab = labels[active]
    tw = text_width(lab.upper(), fnt(9, 600), 1.4) + 16
    paste_alpha(img, rounded((int(tw), 20), 10, "#e0d5c0"), (140, 66))
    draw_text(img, (140 + 8, 71), lab.upper(), fnt(9, 600), "#7a5a2e", tracking=1.4)
    d.rounded_rectangle([w - 74, 62, w - 18, 104], radius=4, outline="#c9bda9", width=2)
    draw_text(img, (w - 64, 74), "MENU", fnt(9, 600), "#5f5548", tracking=1.6)

    # header halaman
    draw_text(img, (18, 128), "MANAGE", fnt(9, 600), "#a8865a", tracking=2.6)
    draw_text(img, (18, 148), labels[active], fnt(26, 400, "display"), "#221b15")
    subtitle = {0: "Last eight weeks · live ledger",
                1: "Newest at the top · 7 open",
                2: "Newest at the top · 7 open",
                3: "Stok per ukuran · 20 styles"}[active]
    draw_text(img, (18, 184), subtitle, fnt(10, 400), "#7a7062")

    # KPI kecil
    if active == 2:
        kpis = [("OPEN LEADS", "7"), ("QUOTED", "2"), ("CONVERTED", "1")]
    elif active == 3:
        kpis = [("ON SHELF", "46"), ("LOW", "5"), ("SOLD OUT", "3")]
    else:
        kpis = [("REVENUE", "Rp 58,2 jt"), ("IN MOTION", "7"), ("ON SHELF", "46")]
    for i, (k, v) in enumerate(kpis):
        x = 18 + i * ((w - 36 - 16) // 3 + 8)
        cw = (w - 36 - 16) // 3
        paste_alpha(img, rounded((cw, 62), 8, "#ffffff", border=CRM_LINE), (x, 210))
        draw_text(img, (x + 10, 220), k, fnt(7, 600), "#8b8173", tracking=1.2)
        draw_text(img, (x + 10, 236), v, fnt(15, 400, "display"), "#221b15")

    # daftar isi layar
    if active == 3:
        rows = [("Bandung Toe-Cap", "EU 39–45 · 14 on the shelf", "IN STOCK", "#e2ecdc"),
                ("Ciwidey Western", "EU 41–44 · 2 pairs left", "LOW", "#f6e7c8"),
                ("Antapani Derby", "EU 40–43 · 3 pairs left", "LOW", "#f6e7c8"),
                ("Cibaduyut Show Western", "Made to order · 6–8 weeks", "MTO", "#dce9ef"),
                ("Ujungberung Mustard", "Made to order · 6–8 weeks", "MTO", "#dce9ef")]
    elif active == 2:
        rows = [("Dita Prameswari", "Instagram DM · Braga Monkey", "NEW", "#f6e7c8"),
                ("Yoga Saputra", "WhatsApp · custom size 46", "NEW", "#f6e7c8"),
                ("Mei Lin", "Email · wholesale, 20 pairs", "IN CONVERSATION", "#dce9ef"),
                ("Arif Hidayat", "WhatsApp · wide fit request", "QUOTED", "#e8e1f0"),
                ("Sari Kusuma", "Instagram DM · resole", "CONVERTED", "#e2ecdc")]
    else:
        rows = [("Arya Wibisono", "TB-261030-1015 · Rp 6.900.000", "DELIVERED", "#e6e4dd"),
                ("Hana Yoshida", "TB-261030-1014 · Rp 4.150.000", "SHIPPED", "#dce9ef"),
                ("Lucas Meyer", "TB-261030-1013 · Rp 4.850.000", "PAID", "#e2ecdc"),
                ("Putri Anjani", "TB-261030-1012 · Rp 3.450.000", "IN PRODUCTION", "#e8e1f0"),
                ("Rendra Aditya", "TB-261030-1011 · Rp 3.750.000", "PENDING", "#f6e7c8")]
    y = 292
    for i, (name, meta, st, col) in enumerate(rows):
        paste_alpha(img, rounded((w - 36, 74), 8, "#ffffff", border=CRM_LINE), (18, y))
        d = ImageDraw.Draw(img)
        d.ellipse([32, y + 22, 60, y + 50], fill="#e8dfcf")
        draw_text(img, (39, y + 28), name[:1], fnt(11, 600), "#6b5a42")
        draw_text(img, (70, y + 16), name, fnt(11, 600), "#221b15")
        draw_text(img, (70, y + 36), clip(meta, fnt(9, 400), w - 130), fnt(9, 400), "#7a7062")
        tw = text_width(st, fnt(7, 600), 1.0) + 14
        paste_alpha(img, rounded((int(tw), 18), 9, col), (w - 36 - tw, y + 46))
        draw_text(img, (w - 36 - tw + 7, y + 50), st, fnt(7, 600), "#3c332a", tracking=1.0)
        y += 84

    # tab bar bawah
    d.rectangle([0, height - 76, w, height], fill="#ffffff")
    d.line([(0, height - 76), (w, height - 76)], fill=CRM_LINE, width=1)
    tabs = ["Overview", "Orders", "Leads", "Stock"]
    for i, label in enumerate(tabs):
        tw4 = w // 4
        cx = i * tw4 + tw4 // 2
        is_active = i == active
        col = "#221b15" if is_active else "#8b8173"
        if is_active and pressed > 0:
            paste_alpha(img, rounded((tw4 - 8, 64), 8, (244, 238, 226, int(200 * pressed))), (i * tw4 + 4, height - 72))
        if is_active:
            paste_alpha(img, rounded((34, 3), 2, "#7a5a2e"), (cx - 17, height - 72))
        _tab_icon(img, i, cx - 10, height - 62, col)
        draw_text(img, (cx - text_width(label, fnt(9, 500)) / 2, height - 36),
                  label, fnt(9, 600 if is_active else 500), col)
    return img
