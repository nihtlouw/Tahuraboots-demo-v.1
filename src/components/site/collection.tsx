"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/kit";
import {
  availabilityCopy,
  resolveAvailability,
  type Availability,
} from "@/lib/catalog";
import { formatIdr, formatUsdFromIdr } from "@/lib/format";
import { site } from "@/lib/site";

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

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All styles" },
  { id: "ready", label: "Ready to ship" },
  { id: "made_to_order", label: "Made to order" },
  { id: "archive", label: "Archive" },
];

export function Collection({ products }: { products: CollectionProduct[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<CollectionProduct | null>(null);

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
    if (filter === "all") return products;
    if (filter === "ready") {
      return products.filter(
        (product) => resolveAvailability(product) === "ready",
      );
    }
    return products.filter(
      (product) => resolveAvailability(product) === filter,
    );
  }, [filter, products]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

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
          <div className="hide-scrollbar flex w-full gap-2 overflow-x-auto sm:w-auto">
            {filters.map((item) => {
              const count = counted[item.id] ?? 0;
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-all ${
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
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-mute">
            {visible.length} styles showing
          </p>
        </div>

        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product, index) => {
            const availability = resolveAvailability(product);
            const meta = availabilityCopy[availability];
            const soldOut =
              availability === "sold_out" || availability === "archive";
            return (
              <Reveal key={product.id} delay={(index % 3) * 90} as="article">
                <button
                  type="button"
                  onClick={() => setSelected(product)}
                  className="group block w-full text-left"
                >
                  <div className="hover-zoom relative aspect-[4/5] w-full overflow-hidden bg-ink-3">
                    <Image
                      src={product.imageUrl}
                      alt={`${product.name} — ${product.colorway}`}
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                      className={`object-cover transition-all duration-700 ${
                        soldOut
                          ? "grayscale-[0.72] opacity-70 group-hover:opacity-85"
                          : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-ink/10" />

                    <div className="absolute left-3 top-3 flex items-center gap-2 border border-paper/20 bg-ink/50 px-2.5 py-1 backdrop-blur-md">
                      <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                      <span className="text-[0.55rem] font-medium uppercase tracking-[0.18em] text-paper/85">
                        {meta.label}
                      </span>
                    </div>

                    {product.featured && !soldOut && (
                      <div className="absolute right-3 top-3 border border-brass/40 bg-ink/50 px-2 py-1 text-[0.52rem] uppercase tracking-[0.18em] text-brass-light backdrop-blur-md">
                        Studio pick
                      </div>
                    )}

                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="border border-paper/30 bg-ink/70 px-5 py-2 text-[0.62rem] uppercase tracking-[0.28em] text-paper/80 backdrop-blur-sm">
                          {availability === "archive" ? "Archive" : "Sold out"}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                      <span className="text-[0.58rem] uppercase tracking-[0.2em] text-paper/60">
                        {product.collectionName}
                      </span>
                      <span className="flex h-8 w-8 translate-y-2 items-center justify-center border border-paper/30 text-paper opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        ↗
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-[1.12rem] leading-tight text-paper transition-colors group-hover:text-brass-light">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-mute">
                        {product.colorway} · {product.leather}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.82rem] text-paper/85">
                        {formatIdr(product.priceIdr)}
                      </p>
                      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.14em] text-mute/80">
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

function ProductModal({
  product,
  onClose,
}: {
  product: CollectionProduct;
  onClose: () => void;
}) {
  const availability = resolveAvailability(product);
  const meta = availabilityCopy[availability];
  const unavailable =
    availability === "sold_out" || availability === "archive";
  const sizes = product.sizes.split(",").filter(Boolean);
  const inquiry = encodeURIComponent(
    `Hi Tahura Boots Co., I'm interested in the ${product.name} (${product.colorway}) — size EU ${
      sizes[0] ?? "42"
    }. Could you confirm availability and shipping?`,
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/85 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
      onClick={onClose}
    >
      <div
        className="animate-rise relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-line bg-ink-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border border-paper/25 bg-ink/70 text-paper transition-colors hover:border-brass hover:text-brass"
        >
          ✕
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[540px]">
            <Image
              src={product.imageUrl}
              alt={`${product.name} in ${product.colorway}`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent md:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 border border-paper/20 bg-ink/50 px-3 py-1.5 backdrop-blur-md">
              <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
              <span className="text-[0.55rem] uppercase tracking-[0.18em] text-paper/85">
                {meta.label}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-[0.58rem] uppercase tracking-[0.24em] text-brass">
              {product.collectionName} · {product.model}
            </p>
            <h3 className="mt-3 font-display text-3xl font-light leading-tight text-paper">
              {product.name}
            </h3>
            <p className="mt-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-mute">
              {product.colorway} · {product.leather}
            </p>

            <div className="mt-5 flex items-baseline gap-3 border-y border-line/70 py-4">
              <p className="font-display text-2xl text-paper">
                {formatIdr(product.priceIdr)}
              </p>
              <p className="text-[0.7rem] text-mute">
                {formatUsdFromIdr(product.priceIdr)}
              </p>
            </div>

            <p className="mt-5 text-[0.86rem] leading-relaxed text-paper/60">
              {product.description}
            </p>

            <div className="mt-6">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-mute">
                {unavailable ? "Size run (reference)" : "Sizes on the shelf"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className={`flex h-9 min-w-11 items-center justify-center border px-2 text-[0.72rem] ${
                      unavailable
                        ? "border-line/60 text-paper/30 line-through"
                        : "border-line text-paper/80"
                    }`}
                  >
                    EU {size}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 border border-line/70 bg-ink/40 p-4">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-brass-light">
                {unavailable ? "Next cutting" : meta.detail}
              </p>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-paper/55">
                {unavailable
                  ? "This run is claimed. Join the waitlist and the studio will message you before the next hide is cut — waitlist members get first refusal."
                  : "Includes a cotton dust bag, spare waxed laces and a tin of studio polish. Ready-to-ship pairs leave Bandung within 48 hours."}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${site.whatsapp}?text=${inquiry}`}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="group flex items-center justify-between bg-brass px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-brass-light"
              >
                {unavailable
                  ? "Join the waitlist"
                  : availability === "made_to_order"
                    ? "Commission this pair"
                    : "Enquire on WhatsApp"}
                <span className="transition-transform group-hover:translate-x-1">
                  ↗
                </span>
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(
                  `Enquiry — ${product.name}`,
                )}`}
                onClick={onClose}
                className="flex items-center justify-between border border-line px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
              >
                Email the studio
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
