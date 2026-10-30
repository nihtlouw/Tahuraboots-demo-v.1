#!/usr/bin/env python3
"""Bangun contact sheet, katalog Markdown, dan galeri HTML dari catalog.json.

Semua data (foto + analisis) bersumber dari documentation/instagram/catalog.json.
Berkas gambar adalah potongan asli grid Instagram @tahurabootsco yang diambil
dari tangkapan layar pengguna, satu berkas per postingan.

Jalankan:  python3 documentation/instagram/build.py
Butuh:     pillow
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "catalog.json").read_text())
ITEMS = DATA["items"]
STATS = DATA["stats"]

# kode ubin IG -> slug produk storefront, dipakai di tabel "Yang sudah dipakai".
USED_IN_STORE = [
    ("TB-14", "ciwidey-western", "Western Line"),
    ("TB-19", "cibaduyut-show-western", "Western Line"),
    ("TB-05", "maribaya-mountain", "Field Series"),
    ("TB-23", "tangkuban-mountain", "Field Series"),
    ("TB-22", "gedebage-logger", "Field Series"),
    ("TB-07", "riau-canvas-tall", "Atelier Series"),
    ("TB-09", "pasteur-gaucho", "Atelier Series"),
    ("TB-17", "asia-afrika-strap", "Atelier Series"),
    ("TB-20", "setiabudi-service", "Core Line"),
    ("TB-11", "antapani-derby", "Core Line"),
    ("TB-15", "ujungberung-mustard", "Core Line"),
    ("TB-04", "cibeunying-chukka", "Core Line"),
]

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def build_contact_sheet() -> Path:
    cols, rows = 6, 4
    card_w, img_h, label_h = 300, 400, 52
    pad = 16
    w = cols * card_w + (cols + 1) * pad
    h = rows * (img_h + label_h) + (rows + 1) * pad
    sheet = Image.new("RGB", (w, h), (18, 15, 12))
    draw = ImageDraw.Draw(sheet)
    f_code = ImageFont.truetype(FONT_BOLD, 15)
    f_name = ImageFont.truetype(FONT, 12)

    for i, item in enumerate(ITEMS):
        r, c = divmod(i, cols)
        x = pad + c * (card_w + pad)
        y = pad + r * (img_h + label_h + pad)
        photo = Image.open(ROOT / item["file"]).convert("RGB")
        photo.thumbnail((card_w, img_h), Image.LANCZOS)
        ox = x + (card_w - photo.width) // 2
        oy = y + (img_h - photo.height) // 2
        sheet.paste(photo, (ox, oy))
        draw.rectangle([x, y, x + card_w - 1, y + img_h - 1], outline=(58, 48, 36))
        draw.text((x + 2, y + img_h + 10), item["code"], font=f_code, fill=(200, 162, 102))
        name = item["name"]
        while draw.textlength(name, font=f_name) > card_w - 4 and len(name) > 4:
            name = name[:-2]
        draw.text((x + 2, y + img_h + 30), name, font=f_name, fill=(214, 205, 190))

    out = ROOT / "contact-sheet.jpg"
    sheet.save(out, quality=88, optimize=True)
    return out


def distribution(key: str) -> list[tuple[str, int]]:
    counts = Counter(item[key] for item in ITEMS)
    return counts.most_common()


def build_markdown() -> Path:
    lines: list[str] = []
    a = lines.append

    a("# Katalog 24 postingan Instagram @tahurabootsco")
    a("")
    a("Analisis per foto dari grid profil Instagram, satu entri per postingan.")
    a("Foto di `tiles/` adalah **foto asli akun tersebut**, dipotong satu per satu")
    a("dari tangkapan layar grid profil (bukan hasil generate).")
    a("")
    a("> **Batas metode.** Sandbox ini tidak bisa membuka instagram.com (koneksi")
    a("> ditolak), jadi foto tidak bisa diunduh langsung dari server Instagram dan")
    a("> caption tiap postingan tidak bisa dipasangkan otomatis. Yang tersedia di")
    a("> sini: potongan asli resolusi grid (381 x 507 px) + pembacaan visual detail.")
    a("> Untuk file resolusi penuh dan caption asli per postingan, lihat bagian")
    a("> *Yang perlu kamu tambahkan* di akhir dokumen.")
    a("")
    a("> **Cakupan.** Dua tangkapan layar menampilkan 4 baris grid masing-masing")
    a("> (12 + 12 ubin). Tab bar Instagram bersifat *sticky*, jadi tidak bisa")
    a("> dipastikan kedua tangkapan layar bersambung tanpa celah. Kalau ada baris")
    a("> yang terlewat di antaranya, total pasang sepatu akan lebih besar dari 25.")
    a("> Tidak ada foto kembar di 24 ubin ini (sudah dicek dengan perceptual hash).")
    a("")
    a("## Ringkasan")
    a("")
    a(f"- Postingan dianalisis: **{STATS['posts']}**")
    a(f"- Foto studio (sepasang sepatu): **{STATS['studioPairs']}**")
    a(f"- Foto lifestyle berisi 2 pasang: **{STATS['lifestylePairs']}** pasang")
    a(f"- **Total pasang sepatu: {STATS['totalPairs']}**")
    a(f"- **Total sepatu (kiri + kanan): {STATS['totalShoes']}**")
    a("")
    a("### Sebaran keluarga model")
    a("")
    a("| Keluarga | Jumlah | Kode |")
    a("|---|---|---|")
    for name, n in distribution("family"):
        codes = ", ".join(i["code"] for i in ITEMS if i["family"] == name)
        a(f"| {name} | {n} | {codes} |")
    a("")
    a("### Sebaran warna")
    a("")
    a("Dihitung dari penilaian visual tiap foto; satu item bisa masuk lebih dari")
    a("satu keluarga kalau memang dua warna (mis. two-tone).")
    a("")
    a("| Keluarga warna | Jumlah | Kode |")
    a("|---|---|---|")
    families = {
        "Cokelat / cognac": ["TB-01", "TB-04", "TB-07", "TB-09", "TB-12", "TB-13", "TB-14", "TB-22"],
        "Taupe / abu": ["TB-02", "TB-10", "TB-11", "TB-16", "TB-21"],
        "Hitam": ["TB-03", "TB-06", "TB-18", "TB-19", "TB-24"],
        "Olive / hijau": ["TB-08", "TB-20", "TB-21"],
        "Burgundy / oxblood": ["TB-13", "TB-17", "TB-23"],
        "Tan / kuning": ["TB-05", "TB-14", "TB-15"],
    }
    for name, codes in families.items():
        a(f"| {name} | {len(codes)} | {', '.join(codes)} |")
    a("")
    a("---")
    a("")
    a("## Analisis satu per satu")
    a("")

    for item in ITEMS:
        a(f"### {item['code']} — {item['name']}")
        a("")
        a(f"[![{item['code']}]({item['file']})]({item['file']})")
        a("")
        a(f"- **Keluarga:** {item['family']}")
        a(f"- **Arketipe:** {item['archetype']}")
        a(f"- **Tinggi shaft:** {item['height']}")
        a(f"- **Bahan (visual):** {item['leather']}")
        a(f"- **Warna:** {item['colour']}")
        a(f"- **Sol:** {item['sole']}")
        a(f"- **Konstruksi (terlihat):** {item['construction']}")
        a(f"- **Detail:** {'; '.join(item['detail'])}")
        if item.get("notForSale"):
            a("- **Status:** konten lifestyle, tidak dijual")
        else:
            a(f"- **Estimasi harga katalog (demo):** Rp {item['priceIdr']:,}".replace(",", "."))
        a(f"- **Tag:** {', '.join(item['tags'])}")
        a(f"- **Catatan komersial:** {item['use']}")
        a("")

    a("---")
    a("")
    a("## Yang sudah dipakai di storefront")
    a("")
    a("Dua belas ubin di bawah ini sudah masuk katalog toko sebagai produk")
    a("`seedCatalogExtras` (`src/db/seed.ts`) dengan foto hasil")
    a("`scripts/ig-photos.py` — bagian atas gambar dipotong tepat di bawah ikon")
    a("carousel, jadi tidak ada piksel yang dikarang.")
    a("")
    a("| Kode | Produk (slug) | Koleksi |")
    a("|---|---|---|")
    for code, slug, collection in USED_IN_STORE:
        a(f"| {code} | `{slug}` | {collection} |")
    a("")
    a("Sisa 12 ubin masih arsip: belum ada foto produk yang layak untuk kartu")
    a("toko, dan beberapa duplikat siluet dengan model yang sudah ada.")
    a("")
    a("---")
    a("")
    a("## Kamus spesifikasi resmi (dari caption akun)")
    a("")
    a("Istilah di bawah ini diambil **verbatim** dari caption postingan terbaru")
    a("`@tahurabootsco` yang bisa dibaca lewat cermin publik. Pakai istilah ini")
    a("saat menulis deskripsi produk supaya konsisten dengan bahasa studio.")
    a("")
    a("**Konstruksi yang dipakai:**")
    a("")
    a("- *Flat Hand welt 270 degree*; *Flat welt with chain stitch 270 degree*")
    a("- *Norwegian split storm welt 360 degree* (chain stitch)")
    a("- *Norwegian construction with traditional method, chain stitch, two tone thread*")
    a("")
    a("**Sol dan tumit:**")
    a("")
    a("- Vibram 700 (full sole), Vibram Komando 1100, Vibram half sole *Explosion*")
    a("- Dr. Sole Supergrip II (half/full), Dr. Sole black cord, Dr. Sole redbrown cork")
    a("- *Brazilian vegetable leather midsole*")
    a("- Gaya tumit: *Cuban heels*, *Woodsman heels*")
    a("")
    a("**Bahan:**")
    a("")
    a("- Horsebutt dari Maryam Tannery Italia (olive, black, natural hand-dyed burgundy)")
    a("- Javan cowhide: rough out tan, rough out camel, olive pull-up, black teacore pull-up")
    a("- *Full lining lambskin*")
    a("")
    a("**Kode model yang muncul di caption:** BDK 026, CWB 026, CWB custom design,")
    a("Gaharu 3.0 9 inch, GAHARU JP.26, Benjamina 3, Merkusi, Captoelari.")
    a("")
    a("**Kontak resmi di caption:** WA 0822-4436-3343, tahurabootscompany@gmail.com,")
    a("bio: *Bandung boots maker — DM for more information — we ship worldwide*.")
    a("")
    a("### Contoh caption asli (utuh)")
    a("")
    a("```")
    a("[MTO RESULT]. Ready to shipp.")
    a("— Merkusi —")
    a("• Olive javan pullup cowhide")
    a("• Full lining lambskin.")
    a("• Norwegian split stormwelt with chain stitch construction 360 degree")
    a("• Vegetable brazilian leather midsole.")
    a("• Black full sole komando 1100 @vibram")
    a("```")
    a("")
    a("Pola caption mereka selalu: status (MTO/ready) → nama model → bahan →")
    a("lining → konstruksi → midsole → sol → kontak. Katalog di atas dibuat")
    a("mengikuti urutan itu agar mudah dipakai ulang.")
    a("")
    a("---")
    a("")
    a("## Yang perlu kamu tambahkan")
    a("")
    a("Kalau mau katalog ini jadi materi jualan penuh, tiga hal ini masih kurang")
    a("dan tidak bisa diambil dari sandbox:")
    a("")
    a("1. **Foto resolusi penuh** (1080 px+). Potongan grid di sini 381 px, cukup")
    a("   untuk referensi dan thumbnail, tapi belum layak jadi foto produk utama.")
    a("   Buka tiap postingan di app → titik tiga → *Save*, atau minta ekspor data")
    a("   Instagram (Settings → Your activity → Download your information).")
    a("2. **Caption dan tanggal per postingan.** Tempel ke `catalog.json` di field")
    a("   baru (`caption`, `postedAt`, `permalink`) - skrip `build.py` akan ikut")
    a("   menampilkannya di Markdown dan galeri.")
    a("3. **Harga resmi + status stok.** Angka `priceIdr` di sini adalah estimasi")
    a("   demo berdasarkan band harga seed katalog, bukan harga studio.")
    a("")

    out = ROOT / "CATALOG.md"
    out.write_text("\n".join(lines))
    return out


def build_gallery(embed: bool = False) -> Path:
    """embed=True menukar setiap `file` dengan data URI agar HTML mandiri."""
    import base64

    def source(item: dict) -> str:
        if not embed:
            return item["file"]
        raw = (ROOT / item["file"]).read_bytes()
        return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")

    payload = json.dumps(
        [
            {
                "code": i["code"],
                "name": i["name"],
                "arch": i["archetype"],
                "family": i["family"],
                "file": source(i),
                "colour": i["colour"],
                "height": i["height"],
                "leather": i["leather"],
                "sole": i["sole"],
                "construction": i["construction"],
                "detail": i["detail"],
                "tags": i["tags"],
                "use": i["use"],
                "price": i.get("priceIdr", 0),
                "notForSale": i.get("notForSale", False),
            }
            for i in ITEMS
        ],
        ensure_ascii=False,
    )

    html = f"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Katalog IG @tahurabootsco — 24 postingan</title>
<style>
  :root {{
    --ink: #14110e; --ink-2: #1d1915; --line: #3a3026; --paper: #f5f0e7;
    --muted: #a79a86; --brass: #c8a266;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; background: var(--ink); color: var(--paper);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }}
  header {{ padding: 48px 24px 24px; max-width: 1200px; margin: 0 auto; }}
  .kicker {{ font-size: .62rem; letter-spacing: .28em; text-transform: uppercase; color: var(--brass); }}
  h1 {{ font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(1.9rem, 5vw, 3rem); margin: 12px 0 8px; }}
  p.lede {{ color: var(--muted); max-width: 62ch; line-height: 1.7; font-size: .92rem; }}
  .stats {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }}
  .stat {{ border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; background: var(--ink-2); }}
  .stat b {{ display: block; font-size: 1.35rem; color: var(--brass); font-family: Georgia, serif; }}
  .stat span {{ font-size: .62rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }}
  .filters {{ display: flex; flex-wrap: wrap; gap: 8px; padding: 0 24px 24px; max-width: 1200px; margin: 0 auto; }}
  .filters button {{
    min-height: 44px; padding: 0 16px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--line); background: transparent; color: var(--paper);
    font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
  }}
  .filters button[aria-pressed="true"] {{ background: var(--brass); border-color: var(--brass); color: var(--ink); font-weight: 700; }}
  main {{ display: grid; gap: 18px; padding: 0 24px 72px; max-width: 1200px; margin: 0 auto; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }}
  article {{ border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: var(--ink-2); display: flex; flex-direction: column; }}
  article img {{ width: 100%; aspect-ratio: 3 / 4; object-fit: cover; display: block; background: #0c0a08; }}
  .body {{ padding: 16px 16px 18px; }}
  .code {{ font-size: .6rem; letter-spacing: .22em; color: var(--brass); }}
  h2 {{ font-family: Georgia, serif; font-weight: 400; font-size: 1.08rem; margin: 6px 0 10px; line-height: 1.3; }}
  dl {{ margin: 0; display: grid; grid-template-columns: 82px 1fr; gap: 6px 10px; font-size: .74rem; line-height: 1.55; }}
  dt {{ color: var(--muted); }}
  dd {{ margin: 0; }}
  .price {{ margin-top: 12px; font-size: .8rem; color: var(--brass); }}
  .tags {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }}
  .tags span {{ font-size: .58rem; border: 1px solid var(--line); border-radius: 999px; padding: 4px 9px; color: var(--muted); }}
  footer {{ border-top: 1px solid var(--line); padding: 24px; text-align: center; color: var(--muted); font-size: .72rem; }}
</style>
</head>
<body>
<header>
  <p class="kicker">Analisis grid Instagram</p>
  <h1>@tahurabootsco — 24 postingan</h1>
  <p class="lede">Setiap ubin grid dipotong satu per satu dari tangkapan layar profil, lalu dianalisis
  dari sisi arketipe, bahan, sol, dan konstruksi. Semua foto di bawah adalah foto asli akun tersebut.</p>
  <div class="stats">
    <div class="stat"><b>{STATS["posts"]}</b><span>postingan</span></div>
    <div class="stat"><b>{STATS["totalPairs"]}</b><span>pasang sepatu</span></div>
    <div class="stat"><b>{STATS["totalShoes"]}</b><span>sepatu</span></div>
    <div class="stat"><b>{len({i["family"] for i in ITEMS})}</b><span>keluarga model</span></div>
  </div>
</header>
<div class="filters" id="filters"></div>
<main id="grid"></main>
<footer>Foto: Instagram @tahurabootsco · Katalog &amp; analisis: documentation/instagram/</footer>
<script>
const items = {payload};
const grid = document.getElementById("grid");
const filters = document.getElementById("filters");
const archs = ["Semua", ...Array.from(new Set(items.map(i => i.family)))];
let active = "Semua";

function rupiah(n) {{
  if (!n) return "Konten lifestyle";
  return "Rp " + n.toLocaleString("id-ID");
}}

function render() {{
  grid.innerHTML = items
    .filter(i => active === "Semua" || i.family === active)
    .map(i => `
      <article>
        <img src="${{i.file}}" alt="${{i.code}} — ${{i.name}}" loading="lazy" />
        <div class="body">
          <p class="code">${{i.code}} · ${{i.family}}</p>
          <h2>${{i.name}}</h2>
          <dl>
            <dt>Warna</dt><dd>${{i.colour}}</dd>
            <dt>Tinggi</dt><dd>${{i.height}}</dd>
            <dt>Bahan</dt><dd>${{i.leather}}</dd>
            <dt>Sol</dt><dd>${{i.sole}}</dd>
            <dt>Konstruksi</dt><dd>${{i.construction}}</dd>
          </dl>
          <p class="price">${{rupiah(i.price)}}</p>
          <div class="tags">${{i.tags.map(t => `<span>#${{t}}</span>`).join("")}}</div>
        </div>
      </article>`)
    .join("");
}}

filters.innerHTML = archs
  .map(a => `<button type="button" aria-pressed="${{a === active}}" data-arch="${{a}}">${{a}}</button>`)
  .join("");
filters.addEventListener("click", (event) => {{
  const btn = event.target.closest("button[data-arch]");
  if (!btn) return;
  active = btn.dataset.arch;
  filters.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  render();
}});

render();
</script>
</body>
</html>
"""
    out = ROOT / ("katalog-standalone.html" if embed else "gallery.html")
    out.write_text(html)
    return out


if __name__ == "__main__":
    for path in (build_contact_sheet(), build_markdown(), build_gallery(), build_gallery(embed=True)):
        print("tulis", path.relative_to(ROOT.parent.parent), f"({path.stat().st_size // 1024} KB)")
