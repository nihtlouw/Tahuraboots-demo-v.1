"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  availabilityCopy,
  resolveAvailability,
} from "@/lib/catalog";
import { formatIdr, formatUsdFromIdr } from "@/lib/format";
import { site } from "@/lib/site";
import type { CollectionProduct } from "@/components/site/collection";

type Props = {
  product: CollectionProduct;
  onClose: () => void;
};

/**
 * Detail produk: ukuran bisa dipilih (sebelumnya hanya teks statis dan
 * WhatsApp selalu memakai ukuran pertama), plus waitlist yang tersimpan ke
 * database untuk style yang habis / arsip.
 */
export function ProductModal({ product, onClose }: Props) {
  const availability = resolveAvailability(product);
  const meta = availabilityCopy[availability];
  const unavailable = availability === "sold_out" || availability === "archive";
  const sizes = product.sizes.split(",").map((size) => size.trim()).filter(Boolean);

  const [size, setSize] = useState(sizes[0] ?? "42");
  const [email, setEmail] = useState("");
  const [waitlist, setWaitlist] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done"; message: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();

      // Focus trap sederhana: Tab berputar di dalam dialog.
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const inquiry = encodeURIComponent(
    `Hi Tahura Boots Co., I'm interested in the ${product.name} (${product.colorway}) — size EU ${size}. Could you confirm availability and shipping?`,
  );

  async function joinWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@")) {
      setWaitlist({ kind: "error", message: "Add a valid email address." });
      return;
    }

    setWaitlist({ kind: "sending" });
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "waitlist",
          interest: `${product.name} — ${product.colorway} (EU ${size})`,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not join the waitlist.");
      }
      setWaitlist({
        kind: "done",
        message: data.message ?? "You're on the waitlist.",
      });
    } catch (caught) {
      setWaitlist({
        kind: "error",
        message:
          caught instanceof Error ? caught.message : "Could not join the waitlist.",
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/85 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="animate-rise relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-t-2xl border border-line bg-ink-2 outline-none sm:rounded-none"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute right-2.5 top-2.5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-paper/25 bg-ink/80 text-paper backdrop-blur-md transition-colors hover:border-brass hover:text-brass active:bg-ink"
        >
          ✕
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[5/4] w-full sm:aspect-[4/3] md:aspect-auto md:min-h-[560px]">
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

          <div className="px-5 pb-6 pt-5 sm:p-8">
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
              <div className="flex items-center justify-between">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-mute">
                  {unavailable ? "Size run (reference)" : "Choose your size"}
                </p>
                <p className="text-[0.58rem] uppercase tracking-[0.14em] text-mute/70">
                  EU · D width
                </p>
              </div>
              <div
                className="mt-2 flex flex-wrap gap-2"
                role="group"
                aria-label="Select a size"
              >
                {sizes.map((item) => {
                  const active = item === size;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSize(item)}
                      aria-pressed={active}
                      className={`flex h-11 min-w-11 items-center justify-center border px-2 text-[0.78rem] transition-colors ${
                        active
                          ? "border-brass bg-brass text-ink"
                          : unavailable
                            ? "border-line/60 text-paper/35 line-through hover:text-paper/60"
                            : "border-line text-paper/80 hover:border-line-soft hover:text-paper"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[0.66rem] text-paper/40">
                Between sizes? The studio cuts a half size on request — mention it
                in your message.
              </p>
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

            {unavailable ? (
              <div className="mt-6">
                {waitlist.kind === "done" ? (
                  <p
                    role="status"
                    className="border border-brass/40 bg-brass/10 px-4 py-3 text-[0.74rem] text-brass-light"
                  >
                    {waitlist.message} We&apos;ll write to {email} first when EU {size}{" "}
                    is cut.
                  </p>
                ) : (
                  <form onSubmit={joinWaitlist} className="space-y-2.5">
                    <label
                      htmlFor="waitlist-email"
                      className="text-[0.58rem] uppercase tracking-[0.2em] text-mute"
                    >
                      Join the waitlist · EU {size}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="waitlist-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        enterKeyHint="send"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="min-w-0 flex-1 border border-line bg-transparent px-3 py-3 text-base text-paper outline-none placeholder:text-mute/60 focus:border-brass sm:text-[0.8rem]"
                      />
                      <button
                        type="submit"
                        disabled={waitlist.kind === "sending"}
                        className="tap-44 shrink-0 bg-brass px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brass-light active:bg-brass disabled:cursor-wait disabled:opacity-60"
                      >
                        {waitlist.kind === "sending" ? "…" : "Notify me"}
                      </button>
                    </div>
                    {waitlist.kind === "error" && (
                      <p role="alert" className="text-[0.68rem] text-[#d68b74]">
                        {waitlist.message}
                      </p>
                    )}
                  </form>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5 max-md:hidden">
              <a
                href={`https://wa.me/${site.whatsapp}?text=${inquiry}`}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="group flex items-center justify-between bg-brass px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-brass-light"
              >
                {unavailable
                  ? `Ask about EU ${size}`
                  : availability === "made_to_order"
                    ? `Commission EU ${size}`
                    : `Reserve EU ${size} on WhatsApp`}
                <span className="transition-transform group-hover:translate-x-1">
                  ↗
                </span>
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(
                  `Enquiry — ${product.name} (EU ${size})`,
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

        {/* Ponsel: CTA utama menempel di bawah supaya tidak perlu menggulir
            seluruh deskripsi sebelum bisa memesan. */}
        <div className="sticky bottom-0 z-10 border-t border-line bg-ink-2/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md md:hidden">
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${site.whatsapp}?text=${inquiry}`}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="tap-44 flex flex-1 items-center justify-between gap-2 bg-brass px-4 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-ink active:bg-brass-light"
            >
              <span className="truncate">
                {unavailable
                  ? `Ask about EU ${size}`
                  : availability === "made_to_order"
                    ? `Commission EU ${size}`
                    : `Reserve EU ${size}`}
              </span>
              <span aria-hidden>↗</span>
            </a>
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent(
                `Enquiry — ${product.name} (EU ${size})`,
              )}`}
              onClick={onClose}
              aria-label="Email the studio"
              className="tap-44 flex w-12 items-center justify-center border border-line text-paper/80 active:bg-paper/10"
            >
              ✉
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
