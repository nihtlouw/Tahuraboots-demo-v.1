"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";
import { navLinks, site } from "@/lib/site";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const height =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setProgress(Math.min(100, (window.scrollY / height) * 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`safe-top fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled || open
            ? "border-b border-line/70 bg-ink/92 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="container-x flex h-[76px] items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex items-center"
            onClick={() => setOpen(false)}
            aria-label="Tahura Boots Company home"
          >
            <BrandMark className="transition-opacity duration-300 group-hover:opacity-80" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={`/${link.href}`}
                className="group relative text-[0.78rem] font-medium uppercase tracking-[0.16em] text-paper/75 transition-colors hover:text-paper"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-brass transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/crm"
              className="hidden text-[0.68rem] font-medium uppercase tracking-[0.18em] text-mute transition-colors hover:text-brass md:block"
            >
              Owner CRM
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="group hidden items-center gap-2 border border-paper/25 px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-paper transition-all duration-300 hover:border-brass hover:bg-brass hover:text-ink sm:flex"
            >
              Book a fitting
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-paper/25 text-paper transition-colors active:bg-paper/10 lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-px w-full bg-current transition-opacity ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
        <div
          className="h-px origin-left bg-brass/70 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </header>

      <div
        className={`fixed inset-0 z-40 h-[100dvh] overflow-y-auto overscroll-contain bg-ink transition-all duration-500 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="grain-layer" />
        {/* `justify-between` bisa memotong CTA di ponsel pendek (360×640) —
            panel ini sekarang bisa digulir dan memberi ruang gesture bar. */}
        <div className="container-x flex min-h-full flex-col justify-between gap-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          <nav className="flex flex-col">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={`/${link.href}`}
                onClick={() => setOpen(false)}
                className="group flex min-h-14 items-center justify-between gap-4 border-b border-line/70 py-4"
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <span className="font-display text-[clamp(1.6rem,8vw,2.1rem)] leading-none text-paper transition-colors group-hover:text-brass">
                  {link.label}
                </span>
                <span className="text-[0.6rem] uppercase tracking-[0.3em] text-mute">
                  0{index + 1}
                </span>
              </a>
            ))}
          </nav>
          <div className="space-y-5">
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center bg-brass px-6 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink"
            >
              WhatsApp the studio
            </a>
            <Link
              href="/crm"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center justify-center border border-line px-6 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-paper"
            >
              Owner CRM dashboard
            </Link>
            <p className="text-center text-[0.65rem] uppercase tracking-[0.22em] text-mute">
              {site.addressShort}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
