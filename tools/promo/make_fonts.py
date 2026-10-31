"""Konversi font situs (woff2 variabel) ke TTF per weight untuk Pillow.

Pillow tidak bisa membaca woff2 dan tidak bisa memilih instance dari variable
font, jadi tiap file di-instance-kan di sumbu `wght` lalu disimpan sebagai TTF.

    python tools/promo/make_fonts.py

Hasil: tools/promo/fonts/*.ttf (tidak di-commit, bisa dibangun ulang dari
public/fonts/*.woff2 yang memang ada di repo).
"""

from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SITE = Path(__file__).resolve().parents[2]
SRC = SITE / "public/fonts"
DEST = Path(__file__).resolve().parent / "fonts"

# (file woff2, [(nama output, weight), ...])
JOBS = [
    ("inter-latin.woff2", [("inter-latin-400", 400), ("inter-latin-500", 500),
                           ("inter-latin-600", 600), ("inter-latin-700", 700)]),
    ("fraunces-latin.woff2", [("fraunces-latin-300", 300), ("fraunces-latin-400", 400),
                              ("fraunces-latin-600", 600)]),
    ("fraunces-italic-latin.woff2", [("fraunces-italic-latin-400", 400)]),
]


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for name, instances in JOBS:
        source = SRC / name
        if not source.exists():
            raise SystemExit(f"font sumber hilang: {source}")
        for out_name, weight in instances:
            font = TTFont(str(source))
            if "fvar" in font:
                instantiateVariableFont(font, {"wght": weight}, inplace=True)
            target = DEST / f"{out_name}.ttf"
            font.save(str(target))
            print(f"→ {target.relative_to(SITE)}")


if __name__ == "__main__":
    main()
