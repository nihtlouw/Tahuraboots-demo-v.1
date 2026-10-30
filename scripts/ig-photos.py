#!/usr/bin/env python3
"""Ubah ubin grid Instagram menjadi foto produk untuk storefront.

CATATAN: pipeline di berkas ini adalah versi awal (Lanczos + penajaman kuat)
dan sengaja dipertahankan sebagai fallback tanpa dependensi. Untuk hasil yang
dipakai di repo, jalankan `scripts/ig-restore.py` — ia memakai Real-ESRGAN x4
lalu menurunkan ke 1160 px dengan penajaman ringan, sehingga detail jahitan
naik tanpa halo. Berkas ini tetap berguna kalau onnxruntime tidak tersedia.

Sumber: documentation/instagram/tiles/*.jpg (potongan asli grid, 381 px lebar).

Ikon carousel Instagram (kotak putih + panah) selalu berada di **sudut kanan
atas** setiap ubin, pada kisaran y = 20-115 px. Menambal area itu dengan
inpainting/clone selalu menyisakan bekas yang terlihat (kotaknya 40x40 px,
terlalu besar), jadi pendekatan yang dipakai: **potong bagian atas gambar**.

Setiap ubin dipotong mulai y = 126 px sampai bawah, menghasilkan bidang
381 x 381 px yang bebas UI Instagram tanpa satu piksel pun yang dikarang.
Kartu produk memakai `object-cover` pada rasio 4:5 dan modal 5:4, jadi
potongan persegi ini aman untuk keduanya.

Lalu: perbesar ke 800x800, penajaman ringan, dan kompres ke JPEG progresif.

Pemakaian:
    python3 scripts/ig-photos.py

Butuh: pillow, numpy, opencv-python-headless.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
TILES = ROOT / "documentation/instagram/tiles"
OUT = ROOT / "public/images/catalog"

# Batas bawah ikon carousel (diukur: kotak berakhir di y=115, ekor panah 113).
CROP_TOP = 126
SQUARE = 800

# kode berkas tile -> nama berkas produk storefront
PICKS = {
    "P14_s2r1c2": "ciwidey-western",
    "P19_s2r3c1": "cibaduyut-western",
    "P05_s1r2c2": "maribaya-mountain",
    "P23_s2r4c2": "tangkuban-mountain",
    "P07_s1r3c1": "riau-canvas",
    "P09_s1r3c3": "pasteur-gaucho",
    "P17_s2r2c2": "asiaafrika-strap",
    "P20_s2r3c2": "setiabudi-service",
    "P22_s2r4c1": "gedebage-logger",
    "P11_s1r4c2": "antapani-derby",
    "P15_s2r1c3": "ujungberung-suede",
    "P04_s1r2c1": "cibeunying-chukka",
}


def crop_below_icon(im: Image.Image) -> Image.Image:
    """Buang strip atas yang memuat ikon Instagram, lalu jadikan persegi."""
    w, h = im.size
    square = im.crop((0, CROP_TOP, w, h))
    # sisa tinggi setelah potong: 381 px (507 - 126). Kalau lebih, potong dari
    # bawah supaya tetap persegi tanpa menggeser titik berat sepatu.
    side = min(square.width, square.height)
    square = square.crop((0, 0, side, side))
    return square


def main() -> None:
    sentinel = OUT / ".restored-by-ai"
    if sentinel.exists():
        print(
            "Folder sudah berisi hasil restorasi AI (lihat .restored-by-ai).\n"
            "Lewati: skrip ini akan menimpa foto 1160 px dengan versi 800 px.\n"
            "Pakai scripts/ig-restore.py, atau hapus sentinel kalau memang ingin fallback."
        )
        return

    OUT.mkdir(parents=True, exist_ok=True)
    for tile, slug in PICKS.items():
        source = next(TILES.glob(f"{tile}*.jpg"))
        im = crop_below_icon(Image.open(source).convert("RGB"))
        im = im.resize((SQUARE, SQUARE), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=2))

        target = OUT / f"{slug}.jpg"
        im.save(target, quality=84, optimize=True, progressive=True)
        print(f"{source.name} -> {target.name} ({target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
