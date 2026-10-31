"""Audio sintetis untuk video promo (dipakai varian landscape & vertikal)."""

from __future__ import annotations

import wave
from pathlib import Path

import numpy as np


def build_audio(path: Path, duration: float, starts: list[float], sr: int = 48000,
                beat: float = 2.0) -> None:
    """Musik latar sintetis: pad Dm, pulse bass, noise udara, whoosh di transisi.

    `starts` adalah waktu mulai tiap adegan — dipakai untuk menempatkan whoosh.
    """
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

    # bass pulse (tempo bisa diatur: landscape 2 dtk, vertikal 1,6 dtk)
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
    for start in starts[1:]:
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
