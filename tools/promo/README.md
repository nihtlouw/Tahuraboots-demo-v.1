# Video promo Tahura Boots

Video demo 46,8 detik (1920×1080, 30 fps, H.264 + AAC) yang memakai brand, foto,
harga, dan struktur layar asli proyek ini — storefront customer lalu CRM owner.

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

Urutan adegan: brand → storefront → katalog → detail produk → CRM desktop →
CRM di ponsel → fitur owner → outro (URL demo).

Foto produk dibaca langsung dari `public/images/` (8 `boot-*.jpg` dan
`catalog/*.jpg`), jadi kalau aset katalog diganti, video ikut berubah. Harga dan
nama produk mengikuti `src/db/seed.ts`; teks CRM memakai angka contoh yang sama
dengan data seed.
