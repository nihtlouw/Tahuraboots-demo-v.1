# Video promo Tahura Boots

Hasil render dari [`tools/promo/`](../tools/promo) — brand, foto, harga, dan
struktur layar asli proyek ini.

| Berkas | Ukuran | Durasi | Untuk |
| --- | --- | --- | --- |
| [`tahura-demo-9x16.mp4`](tahura-demo-9x16.mp4) | 1080 × 1920 (9:16) | 33,6 dtk | TikTok, Reels, Shorts |
| [`tahura-demo.mp4`](tahura-demo.mp4) | 1920 × 1080 (16:9) | 46,8 dtk | website, YouTube, presentasi |

Keduanya H.264 (High, yuv420p) 30 fps + AAC 48 kHz stereo, tanpa narasi
(musik sintetis). Bisa langsung diunggah ke platform, tidak perlu dikonversi.

## Cara mengunduh

1. Klik salah satu nama berkas di tabel di atas.
2. Di halaman GitHub, tekan tombol **Download** (ikon unduh di kanan atas
   pratinjau berkas).

Tautan unduhan langsung (klik → file tersimpan):

- 9:16 — `https://github.com/nihtlouw/Tahuraboots-demo-v.1/raw/main/promo/tahura-demo-9x16.mp4`
- 16:9 — `https://github.com/nihtlouw/Tahuraboots-demo-v.1/raw/main/promo/tahura-demo.mp4`

Di Android: tekan-tahan tautannya → *Download link*.
Di iPhone: buka tautan, ketuk ikon bagikan → *Simpan ke File*.

## Pratinjau

- `poster-9x16.jpg` / `poster-16x9.jpg` — satu frame untuk thumbnail.
- `contact-9x16.jpg` — 20 frame berjajar, memperlihatkan alur video tanpa memutar.

## Render ulang

Berkas di folder ini adalah hasil render, bukan sumber. Kalau aset katalog,
harga, atau teks berubah, bangun ulang:

```bash
python -m pip install pillow numpy imageio-ffmpeg fonttools brotli
python tools/promo/make_fonts.py

python tools/promo/promo_portrait.py render   # promo-out/tahura-demo-9x16.mp4
python tools/promo/promo.py render            # promo-out/tahura-demo.mp4
```

Kalau tidak ingin videonya tersimpan di riwayat git, hapus folder ini dan
pakai `promo-out/` (sudah di-.gitignore) sebagai gantinya — ukuran repo
berkurang ±12 MB.
