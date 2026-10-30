import { Crest } from "@/components/brand";

/** Skeleton saat halaman storefront sedang dirender (streaming). */
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="container-x flex min-h-[70vh] flex-col items-center justify-center gap-6">
        <Crest className="h-12 w-auto animate-pulse text-brass/60" />
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-paper/40">
          Lacing up…
        </p>
      </div>
    </div>
  );
}
