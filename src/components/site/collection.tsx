"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { ProductModal } from "@/components/site/product-modal";
import { SectionHeading } from "@/components/site/kit";
import {
  availabilityCopy,
  resolveAvailability,
  type Availability,
} from "@/lib/catalog";
import { formatIdr } from "@/lib/format";

export type CollectionProduct = {
  id: number;
  slug: string;
  name: string;
  model: string;
  leather: string;
  colorway: string;
  description: string;
  priceIdr: number;
  stock: number;
  status: string;
  imageUrl: string;
  collectionName: string;
  sizes: string;
  featured: boolean;
};

type Filter = "all" | Availability;

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const sorts: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Studio picks" },
  { id: "price-asc", label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
  { id: "name", label: "A–Z" },
];

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All styles" },
  { id: "ready", label: "Ready to ship" },
  { id: "made_to_order", label: "Made to order" },
  { id: "archive", label: "Archive" },
];

export function Collection({ products }: { products: CollectionProduct[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<CollectionProduct | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");

  const counted = useMemo(() => {
    const base: Record<Filter, number> = {
      all: products.length,
      ready: 0,
      sold_out: 0,
      made_to_order: 0,
      archive: 0,
    };
    for (const product of products) {
      base[resolveAvailability(product)] += 1;
    }
    return base;
  }, [products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesFilter =
        filter === "all" || resolveAvailability(product) === filter;
      if (!matchesFilter) return false;
      if (!needle) return true;

      return `${product.name} ${product.model} ${product.leather} ${product.colorway} ${product.collectionName}`
        .toLowerCase()
        .includes(needle);
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceIdr - b.priceIdr);
    else if (sort === "price-desc") sorted.sort((a, b) => b.priceIdr - a.priceIdr);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else
      sorted.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id,
      );

    return sorted;
  }, [filter, products, query, sort]);

  return (
    <section
      id="collection"
      className="relative border-t border-line/60 bg-ink py-20 lg:py-28"
    >
      <div className="container-x">
        <SectionHeading
          index="01"
          eyebrow="The collection"
          title={
            <>
              Pairs on the shelf,
              <br />
              <span className="italic text-brass-light">and on the bench.</span>
            </>
          }
          copy="Small runs, updated as pairs leave the studio. Ready-to-ship styles go out within 48 hours; sold-out styles reopen as made-to-order when a hide allows."
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="hide-scrollbar snap-row flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {filters.map((item) => {
              const count = counted[item.id] ?? 0;
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 border px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-all active:opacity-80 ${
                    isActive
                      ? "border-brass bg-brass text-ink"
                      : "border-line text-paper/60 hover:border-line-soft hover:text-paper"
                  }`}
                >
                  {item.label}
                  <span
                    className={`text-[0.55rem] ${isActive ? "text-ink/60" : "text-mute/70"}`}
                  >
                    {String(Math.max(count, 0)).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <label className="sr-only" htmlFor="collection-search">
              Search the collection
            </label>
            <input
              id="collection-search"
              type="search"
              enterKeyHint="search"
              autoCapitalize="none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search model, leather…"
              className="h-11 min-w-0 flex-1 border border-line bg-transparent px-3 text-base text-paper outline-none transition-colors placeholder:text-mute/60 focus:border-brass sm:h-auto sm:w-56 sm:flex-none sm:py-2 sm:text-[0.7rem]"
            />
            <label className="sr-only" htmlFor="collection-sort">
              Sort styles
            </label>
            <select
              id="collection-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-11 shrink-0 border border-line bg-ink px-3 text-base uppercase tracking-[0.12em] text-paper/75 outline-none transition-colors focus:border-brass sm:h-auto sm:py-2 sm:text-[0.66rem]"
            >
              {sorts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/40 pt-3">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-mute">
            {visible.length} of {products.length} styles
            {query ? ` · “${query}”` : ""}
          </p>
          {(query || filter !== "all" || sort !== "featured") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setSort("featured");
              }}
              className="tap-40 flex items-center px-1 text-[0.62rem] uppercase tracking-[0.16em] text-brass underline-offset-4 hover:underline"
            >
              Reset view
            </button>
          )}
        </div>

        {/*
          Grid katalog. Di ponsel dua kolom (bukan satu kartu selebar layar):
          empat produk terlihat sekaligus saat digulir, pola yang lazim di
          e-commerce. Kolom bertambah 3 → 4 seiring lebar layar.
        */}
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
          {visible.map((product, index) => {
            const availability = resolveAvailability(product);
            const meta = availabilityCopy[availability];
            const soldOut =
              availability === "sold_out" || availability === "archive";
            return (
              <Reveal key={product.id} delay={(index % 2) * 80} as="article">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setSelected(product)}
                  className="group block w-full text-left"
                >
                  <div className="hover-zoom relative aspect-[4/5] w-full overflow-hidden bg-ink-3">
                    <Image
                      src={product.imageUrl}
                      alt={`${product.name} — ${product.colorway}`}
                      fill
                      sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 47vw"
                      className={`object-cover transition-all duration-700 ${
                        soldOut
                          ? "grayscale-[0.72] opacity-70 group-hover:opacity-85"
                          : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-ink/10" />

                    {/* Chip ketersediaan: versi ringkas di ponsel supaya tidak
                        menabrak tepi kartu selebar ~154px. */}
                    <div className="absolute left-2 top-2 flex items-center gap-1.5 border border-paper/20 bg-ink/55 px-1.5 py-1 backdrop-blur-md sm:left-3 sm:top-3 sm:gap-2 sm:px-2.5">
                      <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                      <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-paper/85 sm:tracking-[0.18em]">
                        {meta.label}
                      </span>
                    </div>

                    {/*
                      Pita "Studio pick": di ponsel ditaruh kanan-bawah (baris
                      nama koleksi di situ memang disembunyikan). Dari `sm`
                      sampai `lg` dua label di atas gambar bertabrakan dengan
                      chip ketersediaan, jadi pita disembunyikan lalu muncul
                      lagi di kanan-atas mulai `xl` (kartu ≥ ~277px).
                    */}
                    {product.featured && !soldOut && (
                      <div className="absolute bottom-2 right-2 border border-brass/40 bg-ink/60 px-1.5 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-brass-light backdrop-blur-md sm:hidden xl:right-3 xl:top-3 xl:bottom-auto xl:block xl:px-2 xl:tracking-[0.18em]">
                        Studio pick
                      </div>
                    )}

                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="border border-paper/30 bg-ink/70 px-3 py-1.5 text-[0.55rem] uppercase tracking-[0.18em] text-paper/80 backdrop-blur-sm sm:px-5 sm:py-2 sm:text-[0.62rem] sm:tracking-[0.28em]">
                          {availability === "archive" ? "Archive" : "Sold out"}
                        </span>
                      </div>
                    )}

                    {/* Nama koleksi + panah hanya di layar lebar; di ponsel
                        keduanya memakan ruang gambar tanpa menambah info. */}
                    <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between p-4 sm:flex">
                      <span className="text-[0.58rem] uppercase tracking-[0.2em] text-paper/60">
                        {product.collectionName}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center border border-paper/30 text-paper opacity-100 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:translate-y-2 sm:opacity-0">
                        ↗
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-col sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[0.95rem] leading-tight text-paper transition-colors group-hover:text-brass-light sm:text-[1.12rem]">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[0.58rem] uppercase tracking-[0.12em] text-mute sm:mt-1 sm:text-[0.62rem] sm:tracking-[0.16em]">
                        {product.colorway} · {product.leather}
                      </p>
                    </div>
                    {/* Harga & status ditumpuk di ponsel: pada kartu ~154px,
                        "Rp 4.850.000" + "6–8 week build" tidak muat sebaris. */}
                    <div className="mt-1 flex flex-col gap-0.5 sm:mt-0 sm:block sm:shrink-0 sm:text-right">
                      <p className="whitespace-nowrap text-[0.74rem] tabular-nums text-paper/85 sm:text-[0.82rem]">
                        {formatIdr(product.priceIdr)}
                      </p>
                      <p className="whitespace-nowrap text-[0.58rem] uppercase tracking-[0.1em] text-mute/80 sm:mt-1 sm:tracking-[0.14em]">
                        {availability === "made_to_order"
                          ? "6–8 week build"
                          : soldOut
                            ? "Waitlist open"
                            : product.stock <= 2
                              ? `${product.stock} pair${product.stock === 1 ? "" : "s"} left`
                              : "In stock"}
                      </p>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div className="mt-10 border border-line/70 px-6 py-16 text-center">
            <p className="font-display text-xl text-paper">
              No pairs in this state today.
            </p>
            <p className="mt-2 text-sm text-paper/50">
              Message the studio and we&apos;ll open a made-to-order slot.
            </p>
          </div>
        )}
      </div>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
