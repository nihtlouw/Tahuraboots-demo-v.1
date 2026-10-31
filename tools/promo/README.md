# Video promo Tahura Boots

Video demo yang memakai brand, foto, harga, dan struktur layar asli proyek ini —
storefront customer lalu CRM owner. Dua format:

| Berkas hasil | Ukuran | Durasi | Untuk |
| --- | --- | --- | --- |
| `tahura-demo.mp4` | 1920×1080 | 46,8 dtk | website, YouTube, presentasi |
| `tahura-demo-9x16.mp4` | 1080×1920 | 33,6 dtk | TikTok, Reels, Shorts |

Script di folder ini merender video dari nol dengan Pillow + numpy + ffmpeg
(tidak ada browser, tidak ada layanan desain eksternal).

## Menjalankan

Butuh Python 3.11+ dan ffmpeg (bisa dari paket `imageio-ffmpeg`).

```bash
python -m venv .venv && . .venv/bin/activate
pip install pillow numpy imageio-ffmpeg fonttools brotli

# 1. woff2 variabel → TTF per weight (Pillow tidak baca woff2)
python tools/promo/make_fonts.py

# 2. pratinjau beberapa frame (PNG) untuk cek layout
python tools/promo/promo.py stills 2.2 13.5 26 38

# 3. render penuh → promo-out/tahura-demo.mp4 (±7 menit di CPU 2 core)
python tools/promo/promo.py render

# 4. versi vertikal 9:16 untuk TikTok/Reels → promo-out/tahura-demo-9x16.mp4
python tools/promo/promo_portrait.py stills 2.5 11 21   # pratinjau
python tools/promo/promo_portrait.py render
```

Keluaran default ada di `promo-out/` (gitignored). Ubah dengan variabel
lingkungan `PROMO_OUT` dan `PROMO_FONTS`.

## Isi

| Berkas | Peran |
| --- | --- |
| `promolib.py` | palet warna dari `src/app/globals.css`, loader font, easing, teks bertracking, perisai brand, grain/vignette |
| `promoui.py` | mockup layar: katalog & detail storefront di ponsel, dashboard CRM di browser, CRM mobile dengan tab bar |
| `promo.py` | 8 adegan, timeline crossfade, audio sintetis, encode ffmpeg |
| `make_fonts.py` | konversi `public/fonts/*.woff2` → TTF di `tools/promo/fonts/` |

Urutan adegan landscape: brand → storefront → katalog → detail produk → CRM
desktop → CRM di ponsel → fitur owner → outro (URL demo).

Urutan adegan vertikal (33,6 dtk, tempo musik 1,6 dtk): hook full-bleed → katalog
di ponsel → produk full-bleed + CTA WhatsApp → CRM desktop → CRM di ponsel →
fitur owner → outro "LINK DI BIO". Area bawah ±300 px dan kanan ±120 px sengaja
dibiarkan kosong karena tertutup UI TikTok.

Foto produk dibaca langsung dari `public/images/` (8 `boot-*.jpg` dan
`catalog/*.jpg`), jadi kalau aset katalog diganti, video ikut berubah. Harga dan
nama produk mengikuti `src/db/seed.ts`; teks CRM memakai angka contoh yang sama
dengan data seed.
