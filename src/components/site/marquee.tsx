import { marqueeWords } from "@/lib/site";

export function Marquee() {
  const items = [...marqueeWords, ...marqueeWords];
  return (
    <div className="relative overflow-hidden border-y border-line/70 bg-ink-2 py-4">
      <div className="marquee-track flex w-max items-center">
        {items.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="flex items-center whitespace-nowrap"
          >
            <span className="px-7 text-[0.66rem] font-medium uppercase tracking-[0.3em] text-paper/60">
              {word}
            </span>
            <span className="text-[0.7rem] text-brass/70">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
