#!/usr/bin/env python3
"""Restorasi + penajaman AI untuk foto katalog hasil potongan grid Instagram.

Kenapa perlu: sumbernya hanya 381x381 px (potongan ubin grid). Diperbesar
dengan Lanczos + UnsharpMask kuat, jahitan welt dan tepi sol jadi berhalo dan
"crunchy" — terlihat seperti foto low-res yang dipaksa tajam.

Pipeline:
  1. Real-ESRGAN x4plus (ONNX, 64 MB) menaikkan 4x dengan detail yang
     direkonstruksi, bukan diinterpolasi.
  2. Turunkan ke ukuran final 928x1160 (rasio 4:5, sama seperti 8 foto produk
     lama di public/images/boot-*.jpg) memakai Lanczos.
  3. Jadikan persegi. Tiga tile dari baris terakhir tangkapan layar hanya
     289-344 px tingginya; sisa tinggi diisi perpanjangan meja (warna tepi
     bawah + gradien menggelap) supaya sepatu tidak gepeng saat di-resize.
  4. Turunkan ke 1160x1160 (persegi, sama dengan bingkai aslinya sehingga
     tidak ada bagian sepatu yang terpotong; kartu produk memakai
     `object-cover` 4:5 dan modal 5:4, jadi CSS yang mengatur crop).
  5. UnsharpMask ringan (35%, radius 1.1) — cukup untuk mengembalikan
     ketajaman yang hilang saat downscale, tidak sampai menimbulkan halo.
  6. Tone match ke foto produk lama (public/images/boot-*.jpg): luminance
     digeser ke mean/std studio, dengan kekuatan 65% supaya bayangan tetap
     terbuka. Tanpa ini, ubin terang (suede, western) tampak "beda studio"
     di sebelah 8 foto lama yang gelap.

Kalau `onnxruntime` atau model belum ada, skrip jatuh ke pipeline lama
(potong + Lanczos + UnsharpMask 80%) supaya build tidak pernah gagal.

Pemakaian:
    python3 scripts/ig-restore.py                # semua pick
    python3 scripts/ig-restore.py --only P14_s2r1c2
    python3 scripts/ig-restore.py --compare      # buat contact sheet pembanding

Butuh: pillow, numpy, opencv-python-headless, onnxruntime.
Model diunduh sekali ke .cache/ig-models/ (gitignored).
"""
from __future__ import annotations

import argparse
import sys
import time
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
TILES = ROOT / "documentation/instagram/tiles"
OUT = ROOT / "public/images/catalog"
CACHE = ROOT / ".cache/ig-models"

MODEL_URL = (
    "https://raw.githubusercontent.com/kongxa/RealESRGAN_x4plus/"
    "main/RealESRGAN_x4plus.onnx"
)
MODEL_PATH = CACHE / "RealESRGAN_x4plus.onnx"

CROP_TOP = 126          # batas bawah ikon carousel Instagram
FINAL = (1160, 1160)    # persegi: seluruh bingkai asli, tanpa potong
TONE_STRENGTH = 0.65    # 0 = tanpa koreksi, 1 = samakan penuh dengan foto lama
SHARPEN = (1.1, 35, 3)  # radius, percent, threshold

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


# ── model ────────────────────────────────────────────────────────────────
def ensure_model() -> Path | None:
    """Unduh model sekali kalau belum ada. None kalau tidak bisa."""
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 50_000_000:
        return MODEL_PATH
    CACHE.mkdir(parents=True, exist_ok=True)
    print(f"  mengunduh model ({MODEL_URL.rsplit('/', 1)[-1]}, ~64 MB)…", flush=True)
    try:
        with urllib.request.urlopen(MODEL_URL, timeout=180) as response:
            data = response.read()
        if len(data) < 50_000_000:
            raise ValueError(f"ukuran tidak wajar: {len(data)} byte")
        MODEL_PATH.write_bytes(data)
        return MODEL_PATH
    except Exception as error:  # noqa: BLE001 - fallback disengaja
        print(f"  gagal mengunduh model: {error}", file=sys.stderr)
        return None


def load_session():
    try:
        import onnxruntime as ort
    except ImportError:
        print("  onnxruntime tidak terpasang — pakai fallback Lanczos", file=sys.stderr)
        return None

    path = ensure_model()
    if path is None:
        return None

    options = ort.SessionOptions()
    options.intra_op_num_threads = 8
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(
        str(path), sess_options=options, providers=["CPUExecutionProvider"]
    )
    return session


def restore(session, im: Image.Image) -> Image.Image:
    """Naikkan 4x dengan Real-ESRGAN."""
    name = session.get_inputs()[0].name
    arr = np.asarray(im).astype(np.float32) / 255.0
    tensor = arr.transpose(2, 0, 1)[None]
    out = session.run(None, {name: tensor})[0]
    rgb = np.clip(out[0].transpose(1, 2, 0), 0.0, 1.0)
    return Image.fromarray((rgb * 255).round().astype(np.uint8))


# ── ukuran akhir ───────────────────────────────────────────────────────
def legacy_tone() -> tuple[float, float] | None:
    """Rata-rata luminance foto produk lama, dipakai sebagai target tone."""
    samples = sorted((ROOT / "public/images").glob("boot-*.jpg"))
    if not samples:
        return None
    means, stds = [], []
    for path in samples:
        gray = np.asarray(Image.open(path).convert("L"), dtype=np.float32)
        means.append(float(gray.mean()))
        stds.append(float(gray.std()))
    return float(np.mean(means)), float(np.mean(stds))


def tone_match(im: Image.Image, target: tuple[float, float] | None) -> Image.Image:
    """Geser luminance ke target, sebagian saja (TONE_STRENGTH)."""
    if target is None:
        return im

    lab = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2LAB).astype(np.float32)
    light = lab[:, :, 0]
    current_mean, current_std = float(light.mean()), float(light.std())
    if current_std <= 1:
        return im

    target_mean, target_std = target
    scaled = (light - current_mean) * (target_std / current_std) + target_mean
    light = light * (1 - TONE_STRENGTH) + scaled * TONE_STRENGTH
    lab[:, :, 0] = np.clip(light, 0, 255)

    rgb = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)
    return Image.fromarray(rgb)


def square_fill(im: Image.Image) -> Image.Image:
    """Jadikan persegi tanpa meregangkan subjek.

    Tiga tile berasal dari baris terakhir tangkapan layar, jadi tingginya hanya
    289-344 px setelah strip ikon dibuang (bukan 381). Kalau langsung di-resize
    ke persegi, sepatu jadi gepeng.

    Solusinya **memperpanjang meja**, bukan merefleksikan sepatu: warna diambil
    dari rata-rata 8 baris terbawah lalu diberi gradien menggelap ke bawah plus
    grain halus, sehingga terbaca sebagai bayangan meja yang menjauh. Sudah
    dibandingkan dengan cermin-tepi: cermin meninggalkan pantulan sepatu yang
    jelas terlihat palsu, gradien ini tidak.
    """
    width, height = im.size
    if width == height:
        return im

    if height > width:
        # terlalu tinggi: potong dari atas (ikon sudah dibuang sebelumnya)
        return im.crop((0, height - width, width, height))

    pad = width - height
    arr = np.asarray(im).astype(np.float32)
    bottom = arr[height - 8 : height, :, :].mean(axis=0)
    strip = np.repeat(bottom[None, :, :], pad, axis=0)

    ramp = np.linspace(1.0, 0.55, pad)[:, None, None]
    rng = np.random.default_rng(5)
    grain = rng.normal(0, 2.5, (pad, width, 1))
    strip = np.clip(strip * ramp + grain, 0, 255)

    out = np.concatenate([arr, strip], axis=0)
    canvas = Image.fromarray(out.astype(np.uint8))
    return canvas.filter(ImageFilter.GaussianBlur(0.6))


def finalise(im: Image.Image, target_tone: tuple[float, float] | None) -> Image.Image:
    im = im.resize(FINAL, Image.LANCZOS)
    im = tone_match(im, target_tone)
    radius, percent, threshold = SHARPEN
    return im.filter(ImageFilter.UnsharpMask(radius, percent, threshold))


def fallback(im: Image.Image) -> Image.Image:
    """Pipeline lama: Lanczos + penajaman kuat (tanpa AI)."""
    im = im.resize((800, 800), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(1.5, 80, 2))


# ── utama ────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="proses satu kode tile saja, mis. P14_s2r1c2")
    parser.add_argument("--compare", action="store_true", help="buat contact sheet pembanding")
    args = parser.parse_args()

    session = load_session()
    OUT.mkdir(parents=True, exist_ok=True)
    target_tone = legacy_tone()
    if target_tone:
        print(f"target tone foto lama: mean={target_tone[0]:.1f} std={target_tone[1]:.1f}")

    picks = {
        k: v for k, v in PICKS.items() if not args.only or k == args.only
    }

    started = time.time()
    for index, (tile, slug) in enumerate(picks.items(), start=1):
        source = next(TILES.glob(f"{tile}*.jpg"))
        base = Image.open(source).convert("RGB")
        base = base.crop((0, CROP_TOP, base.width, base.height))
        base = square_fill(base)

        if session is not None:
            t0 = time.time()
            restored = restore(session, base)
            result = finalise(restored, target_tone)
            note = f"AI {time.time() - t0:.0f}s"
        else:
            result = fallback(base)
            note = "fallback"

        target = OUT / f"{slug}.jpg"
        result.save(target, quality=86, optimize=True, progressive=True)
        print(
            f"[{index}/{len(picks)}] {tile} -> {target.name} "
            f"({target.stat().st_size // 1024} KB, {note})",
            flush=True,
        )

    print(f"selesai dalam {time.time() - started:.0f}s")


if __name__ == "__main__":
    main()
