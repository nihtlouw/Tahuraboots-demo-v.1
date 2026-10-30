"use client";

import { useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { voices } from "@/lib/site";

export function Voices() {
  const [index, setIndex] = useState(0);
  const active = voices[index];
  const go = (direction: number) =>
    setIndex((current) => (current + direction + voices.length) % voices.length);

  return (
    <section className="relative overflow-hidden border-y border-line/60 bg-ink-2 py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(109,33,38,0.25),transparent_65%)]" />
        <div className="grain-layer" />
      </div>
      <div className="container-x relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[0.6rem] uppercase tracking-[0.26em] text-brass">
              05
            </span>
            <span className="h-px w-8 bg-brass/50" />
            <span className="eyebrow text-mute">Worn in</span>
          </div>
          <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.05] text-paper">
            13.2K collectors.
            <br />
            <span className="italic text-brass-light">40+ countries.</span>
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/50">
            From Braga to Berlin — a few notes from people who put the miles in.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center border border-line text-paper/70 transition-colors hover:border-brass hover:text-brass"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center border border-line text-paper/70 transition-colors hover:border-brass hover:text-brass"
            >
              →
            </button>
            <span className="ml-2 text-[0.6rem] uppercase tracking-[0.2em] text-mute">
              0{index + 1} / 0{voices.length}
            </span>
          </div>
        </div>

        <Reveal className="relative">
          <div className="flex items-start gap-5">
            <span className="mt-1 font-display text-5xl leading-none text-brass/40">
              &ldquo;
            </span>
            <div key={active.name} className="animate-rise">
              <blockquote className="font-display text-[clamp(1.35rem,2.4vw,2rem)] font-light leading-[1.3] text-paper/90">
                {active.quote}
              </blockquote>
              <div className="mt-7 flex items-center gap-3">
                <span className="h-px w-10 bg-brass/60" />
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-paper">
                    {active.name}
                  </p>
                  <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-mute">
                    {active.place}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-9 flex gap-2">
            {voices.map((voice, voiceIndex) => (
              <button
                key={voice.name}
                type="button"
                onClick={() => setIndex(voiceIndex)}
                aria-label={`Show testimonial from ${voice.name}`}
                aria-pressed={voiceIndex === index}
                className={`h-1 flex-1 transition-colors ${
                  voiceIndex === index ? "bg-brass" : "bg-line hover:bg-line-soft"
                }`}
              />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line/70 pt-6">
            {[
              ["4.9", "average rating"],
              ["92%", "return for a second"],
              ["48h", "dispatch, in stock"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-xl text-paper">{value}</p>
                <p className="mt-1 text-[0.54rem] uppercase leading-relaxed tracking-[0.14em] text-mute">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
