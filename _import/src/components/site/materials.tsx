"use client";

import Image from "next/image";
import { useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/kit";
import { materials } from "@/lib/site";

const hideImages: Record<string, string> = {
  tochigi: "/images/boot-olive.jpg",
  shinki: "/images/boot-oxblood.jpg",
  chromexcel: "/images/boot-engineer.jpg",
  croc: "/images/boot-croc.jpg",
  suede: "/images/boot-chukka.jpg",
  veg: "/images/boot-monkey.jpg",
};

export function Materials() {
  const [activeId, setActiveId] = useState<string>(materials[0].id);
  const active = materials.find((item) => item.id === activeId) ?? materials[0];

  return (
    <section id="materials" className="relative bg-paper py-20 text-ink lg:py-28">
      <div className="container-x">
        <SectionHeading
          index="03"
          eyebrow="The hides"
          title={
            <>
              Six hides.
              <br />
              <span className="italic text-oxblood">Chosen by hand.</span>
            </>
          }
          copy="We buy small and we buy often. Every hide is inspected in daylight before it earns a place on the cutting table."
          inverted
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="border-t border-ink/15">
              {materials.map((material, index) => {
                const isActive = material.id === active.id;
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => setActiveId(material.id)}
                    aria-pressed={isActive}
                    className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-ink/15 py-5 text-left transition-colors ${
                      isActive ? "bg-ink/[0.04]" : "hover:bg-ink/[0.025]"
                    }`}
                  >
                    <span className="pl-2 text-[0.6rem] tracking-[0.2em] text-ink/35">
                      0{index + 1}
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="h-6 w-6 shrink-0 rounded-full ring-1 ring-ink/20"
                        style={{ backgroundColor: material.swatch }}
                      />
                      <span>
                        <span
                          className={`block font-display text-[1.1rem] leading-tight transition-colors ${
                            isActive ? "text-oxblood" : "text-ink"
                          }`}
                        >
                          {material.name}
                        </span>
                        <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.18em] text-ink/45">
                          {material.origin}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`pr-2 text-lg transition-all ${
                        isActive
                          ? "translate-x-0 text-oxblood opacity-100"
                          : "-translate-x-2 text-ink/30 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                    >
                      →
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 max-w-sm text-[0.72rem] leading-relaxed text-ink/45">
              Hides rotate with the seasons and the tanneries&apos; output. If
              you have a leather in mind, the studio can usually source it for a
              made-to-order build.
            </p>
          </div>

          <Reveal className="order-1 lg:order-2">
            <div className="relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
                <Image
                  key={active.id}
                  src={hideImages[active.id] ?? "/images/boot-olive.jpg"}
                  alt={`${active.name} used on a Tahura boot`}
                  fill
                  sizes="(min-width: 1024px) 42vw, 92vw"
                  className="animate-rise object-cover"
                />
                <div
                  className="absolute inset-0 opacity-35 mix-blend-multiply"
                  style={{ backgroundColor: active.swatch }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
                  <p className="text-[0.56rem] uppercase tracking-[0.24em] text-brass-light">
                    {active.short} · {active.origin}
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight">
                    {active.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-[0.78rem] leading-relaxed text-paper/65">
                    {active.body}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-ink/15 border border-t-0 border-ink/15 bg-paper">
                {active.specs.map(([label, value]) => (
                  <div key={label} className="px-3 py-4">
                    <dt className="text-[0.5rem] uppercase tracking-[0.16em] text-ink/40">
                      {label}
                    </dt>
                    <dd className="mt-1 text-[0.72rem] leading-snug text-ink/80">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
