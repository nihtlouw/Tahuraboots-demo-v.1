import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/kit";
import { journal } from "@/lib/site";

export function Journal() {
  return (
    <section className="bg-ink py-20 lg:py-24">
      <div className="container-x">
        <SectionHeading
          index="06"
          eyebrow="The journal"
          title={
            <>
              Notes from
              <br />
              <span className="italic text-brass-light">the bench.</span>
            </>
          }
          copy="Process, patina and the people who wear the pairs in. New entries every few weeks."
        />

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {journal.map((entry, index) => (
            <Reveal key={entry.title} delay={index * 90} as="article">
              <a href="#studio" className="group block">
                <div className="hover-zoom relative aspect-[4/3] w-full overflow-hidden bg-ink-3">
                  <Image
                    src={entry.image}
                    alt={entry.title}
                    fill
                    sizes="(min-width: 768px) 31vw, 92vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <span className="absolute left-3 top-3 border border-paper/20 bg-ink/60 px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.18em] text-paper/80 backdrop-blur-sm">
                    {entry.tag}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.18em] text-mute">
                  <span>{entry.date}</span>
                  <span className="h-px w-6 bg-line-soft" />
                  <span>4 min read</span>
                </div>
                <h3 className="mt-2 font-display text-xl leading-snug text-paper transition-colors group-hover:text-brass-light">
                  {entry.title}
                </h3>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-paper/50">
                  {entry.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] text-brass">
                  Read the entry
                  <span className="h-px w-6 bg-brass/60 transition-all group-hover:w-9" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
