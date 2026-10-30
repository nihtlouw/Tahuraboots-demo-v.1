"use client";

import Image from "next/image";
import { useState } from "react";
import { Stamp } from "@/components/brand";
import { formatIdr } from "@/lib/format";
import { heroStats, site } from "@/lib/site";

const colorways = [
  {
    id: "olive",
    name: "Olive Grove",
    model: "Bandung Toe-Cap",
    leather: "Tochigi Vachetta",
    price: 3450000,
    image: "/images/boot-olive.jpg",
    swatch: "#5c6244",
  },
  {
    id: "oxblood",
    name: "Oxblood No. 8",
    model: "Ters Kopo Brogue",
    leather: "Shinki Hikaru Horsebutt",
    price: 4150000,
    image: "/images/boot-oxblood.jpg",
    swatch: "#5f2429",
  },
  {
    id: "engineer",
    name: "Black Beauty",
    model: "Garut Engineer",
    leather: "Horween Chromexcel",
    price: 4850000,
    image: "/images/boot-engineer.jpg",
    swatch: "#26231f",
  },
];

export function Hero() {
  const [active, setActive] = useState(0);
  const current = colorways[active];

  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-[calc(6.5rem+env(safe-area-inset-top,0px))] sm:pt-[124px] lg:pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(200,162,102,0.16),transparent_65%)]" />
        <div className="absolute -right-32 top-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(109,33,38,0.28),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-line/50 to-transparent lg:block" />
        <div className="grain-layer" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="animate-rise">
            <div className="flex items-center gap-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brass animate-soft-pulse" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brass" />
              </span>
              <p className="eyebrow text-brass/90">
                Bandung, Indonesia — Est. {site.founded}
              </p>
            </div>

            <h1 className="mt-6 font-display text-[clamp(3rem,7.1vw,5.9rem)] font-light leading-[0.93] tracking-[-0.03em] text-paper">
              Boots built
              <br />
              to outlive
              <br />
              <span className="italic text-brass-light">the trend.</span>
            </h1>

            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-paper/65">
              Hand-welted leather boots from a small studio on Jl. Ters Kopo.
              Six weeks at the bench, seven pairs a week, and a Goodyear welt
              that means the story never really ends.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#collection"
                className="group inline-flex items-center justify-between gap-8 bg-brass px-6 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-brass-light"
              >
                Explore the collection
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a
                href="#custom"
                className="group inline-flex items-center justify-between gap-8 border border-paper/20 px-6 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-paper transition-colors hover:border-paper/60 hover:bg-paper/5"
              >
                Build your pair
                <span className="text-brass transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-y-6 border-t border-line/80 pt-6 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl text-paper">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-mute">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-[520px] lg:ml-auto">
              <div className="absolute -inset-3 border border-line/70" />
              <div className="relative overflow-hidden bg-ink-2">
                <div className="relative aspect-[4/5] w-full">
                  {colorways.map((colorway, index) => (
                    <Image
                      key={colorway.id}
                      src={colorway.image}
                      alt={`${colorway.model} in ${colorway.name}`}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className={`object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        index === active
                          ? "scale-100 opacity-100"
                          : "scale-105 opacity-0"
                      }`}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/10" />

                  <div className="absolute left-5 top-5 flex items-center gap-2 border border-paper/25 bg-ink/40 px-3 py-1.5 backdrop-blur-md">
                    <span className="h-1 w-1 rounded-full bg-brass" />
                    <span className="text-[0.58rem] font-medium uppercase tracking-[0.22em] text-paper/85">
                      Hand-welted · 31 steps
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.58rem] uppercase tracking-[0.24em] text-brass-light/90">
                        {current.model}
                      </p>
                      <p className="mt-1 font-display text-2xl leading-none text-paper">
                        {current.name}
                      </p>
                      <p className="mt-2 text-[0.6rem] uppercase tracking-[0.18em] text-paper/55">
                        {current.leather}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-[0.8rem] text-paper/85">
                      {formatIdr(current.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {colorways.map((colorway, index) => (
                    <button
                      key={colorway.id}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Show ${colorway.name}`}
                      aria-pressed={index === active}
                      className={`group flex items-center gap-2 border px-2.5 py-1.5 transition-colors ${
                        index === active
                          ? "border-brass/70 bg-brass/10"
                          : "border-line/80 hover:border-line-soft"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/40"
                        style={{ backgroundColor: colorway.swatch }}
                      />
                      <span
                        className={`text-[0.58rem] uppercase tracking-[0.16em] ${
                          index === active ? "text-paper" : "text-mute"
                        }`}
                      >
                        {colorway.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-mute">
                  {active + 1} / 3
                </p>
              </div>

              <Stamp className="absolute -left-10 -top-10 hidden h-24 w-24 animate-[spin_38s_linear_infinite] text-brass/80 sm:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="container-x relative mt-14 hidden items-center justify-between border-t border-line/60 pt-5 lg:flex">
        <p className="text-[0.6rem] uppercase tracking-[0.26em] text-mute">
          Scroll to explore the bench
        </p>
        <div className="flex items-center gap-6 text-[0.6rem] uppercase tracking-[0.22em] text-mute">
          <span>Goodyear welted</span>
          <span className="h-1 w-1 rounded-full bg-brass/60" />
          <span>Ships worldwide</span>
          <span className="h-1 w-1 rounded-full bg-brass/60" />
          <span>Resole for life</span>
        </div>
      </div>
    </section>
  );
}
