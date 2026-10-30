import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import { Stamp } from "@/components/brand";
import { processSteps } from "@/lib/site";

export function Craft() {
  return (
    <section id="craft" className="relative overflow-hidden bg-ink py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(200,162,102,0.08),transparent_60%)]" />
      <div className="container-x relative">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="relative">
            <Reveal className="relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src="/images/craft-stitching.jpg"
                  alt="Artisan hand-stitching the welt of a leather boot"
                  fill
                  sizes="(min-width: 1024px) 45vw, 92vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-[0.56rem] uppercase tracking-[0.24em] text-brass-light">
                      Jl. Ters Kopo studio
                    </p>
                    <p className="mt-1 font-display text-lg text-paper">
                      Hand-welting bench no. 3
                    </p>
                  </div>
                  <p className="text-[0.56rem] uppercase tracking-[0.2em] text-paper/60">
                    60+ hrs / pair
                  </p>
                </div>
              </div>
              <Stamp className="absolute -right-7 -top-7 h-20 w-20 animate-[spin_44s_linear_infinite] text-brass/70" />
            </Reveal>

            <div className="mt-6 grid grid-cols-3 divide-x divide-line/70 border border-line/70">
              {[
                ["07", "pairs / week"],
                ["31", "bench steps"],
                ["0", "glued soles"],
              ].map(([value, label]) => (
                <div key={label} className="px-4 py-5">
                  <p className="font-display text-2xl text-paper">{value}</p>
                  <p className="mt-1 text-[0.56rem] uppercase tracking-[0.18em] text-mute">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="text-[0.6rem] uppercase tracking-[0.26em] text-brass">
                  02
                </span>
                <span className="h-px w-8 bg-brass/50" />
                <span className="eyebrow text-mute">The craft</span>
              </div>
              <h2 className="mt-5 max-w-xl font-display text-[clamp(2.1rem,4vw,3.4rem)] font-light leading-[1.04] tracking-[-0.02em] text-paper">
                Seven pairs a week.
                <br />
                <span className="italic text-brass-light">
                  Nothing rushed,
                </span>{" "}
                nothing glued.
              </h2>
              <p className="mt-6 max-w-lg text-[0.92rem] leading-relaxed text-paper/60">
                Tahura started in 2013 with one bench, a borrowed sewing machine
                and a stubborn idea: a pair of boots should be the last thing
                you have to replace. Twelve years later the studio still holds
                to seven pairs a week. Every welt is stitched by hand, every
                hide is cut around its scars, and nothing leaves the bench
                without a maker&apos;s initials inside the collar.
              </p>
            </Reveal>

            <div className="mt-10 space-y-0 border-t border-line/70">
              {processSteps.map((step, index) => (
                <Reveal
                  key={step.number}
                  delay={index * 80}
                  className="group grid grid-cols-[auto_1fr] gap-5 border-b border-line/70 py-6 transition-colors hover:bg-paper/[0.025] md:grid-cols-[auto_auto_1fr] md:items-baseline md:gap-8"
                >
                  <span className="font-display text-lg text-brass/80">
                    {step.number}
                  </span>
                  <h3 className="text-[0.95rem] font-medium tracking-wide text-paper md:w-40">
                    {step.title}
                  </h3>
                  <div className="col-span-2 md:col-span-1">
                    <p className="max-w-md text-[0.82rem] leading-relaxed text-paper/50">
                      {step.body}
                    </p>
                  </div>
                  <span className="col-span-2 text-[0.56rem] uppercase tracking-[0.2em] text-mute/70 md:col-span-1 md:hidden">
                    {step.time}
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
