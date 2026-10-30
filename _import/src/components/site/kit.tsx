import type { ReactNode } from "react";
import { Reveal } from "@/components/site/reveal";

export function SectionHeading({
  index,
  eyebrow,
  title,
  copy,
  inverted = false,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  copy?: ReactNode;
  inverted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 border-b border-line/70 pb-8 md:flex-row md:items-end md:justify-between">
      <Reveal className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="text-[0.6rem] uppercase tracking-[0.26em] text-brass">
            {index}
          </span>
          <span className="h-px w-8 bg-brass/50" />
          <span
            className={`eyebrow ${inverted ? "text-paper/60" : "text-mute"}`}
          >
            {eyebrow}
          </span>
        </div>
        <h2
          className={`mt-4 font-display text-[clamp(2.1rem,4.2vw,3.5rem)] font-light leading-[1.02] tracking-[-0.02em] ${
            inverted ? "text-ink" : "text-paper"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {copy && (
        <Reveal delay={120} className="max-w-sm md:text-right">
          <p
            className={`text-sm leading-relaxed ${
              inverted ? "text-ink/60" : "text-paper/55"
            }`}
          >
            {copy}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export function ArrowLink({
  href,
  children,
  tone = "light",
  external = false,
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark" | "brass";
  external?: boolean;
}) {
  const color =
    tone === "dark"
      ? "text-ink/70 hover:text-ink"
      : tone === "brass"
        ? "text-brass hover:text-brass-light"
        : "text-paper/70 hover:text-paper";
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`group inline-flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] transition-colors ${color}`}
    >
      {children}
      <span className="inline-block h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
      <span className="sr-only">(open)</span>
    </a>
  );
}
