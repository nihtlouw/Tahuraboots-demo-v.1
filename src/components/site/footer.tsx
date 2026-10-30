"use client";

import Link from "next/link";
import { useState } from "react";
import { Crest } from "@/components/brand";
import { navLinks, site } from "@/lib/site";

export function Footer() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-line/70 bg-ink-2">
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-96 w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(200,162,102,0.12),transparent_65%)]" />
      <div className="container-x relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Crest className="h-10 w-auto text-brass" />
              <div>
                <p className="font-display text-xl tracking-[0.16em] text-paper">
                  TAHURA
                </p>
                <p className="mt-1 text-[0.5rem] uppercase tracking-[0.32em] text-mute">
                  Boots Company
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-[0.82rem] leading-relaxed text-paper/50">
              Bandung boot maker since 2013. Hand-welted pairs, resoled for
              life, shipped from West Java to forty countries and counting.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Goodyear welted", "Made in Indonesia"].map((tag) => (
                <span
                  key={tag}
                  className="border border-line px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.16em] text-mute"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-brass">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={`/${link.href}`}
                    className="text-[0.8rem] text-paper/60 transition-colors hover:text-paper"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/crm"
                  className="text-[0.8rem] text-paper/60 transition-colors hover:text-paper"
                >
                  Owner CRM
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-brass">
              Studio
            </p>
            <address className="mt-4 space-y-2.5 text-[0.8rem] not-italic leading-relaxed text-paper/60">
              <p>
                {site.addressLine1}
                <br />
                {site.addressLine2}
              </p>
              <p>{site.hours}</p>
              <a
                href={`mailto:${site.email}`}
                className="block transition-colors hover:text-paper"
              >
                {site.email}
              </a>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="block transition-colors hover:text-paper"
              >
                +62 811 2233 4455
              </a>
            </address>
          </div>

          <div>
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-brass">
              The cutting list
            </p>
            <p className="mt-4 text-[0.8rem] leading-relaxed text-paper/50">
              One letter when a new hide is cut. No sales noise, no weekly
              newsletters.
            </p>
            {joined ? (
              <p className="mt-4 border border-brass/40 bg-brass/10 px-3 py-3 text-[0.72rem] text-brass-light">
                You&apos;re on the cutting list. Watch your inbox.
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (email.includes("@")) setJoined(true);
                }}
                className="mt-4 flex border border-line focus-within:border-brass/60"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  aria-label="Email address for the cutting list"
                  className="w-full bg-transparent px-3 py-3 text-[0.78rem] text-paper outline-none placeholder:text-mute/60"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-brass px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brass-light"
                >
                  Join
                </button>
              </form>
            )}
            <div className="mt-5 flex gap-2">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex-1 border border-line px-3 py-2 text-center text-[0.58rem] uppercase tracking-[0.14em] text-paper/60 transition-colors hover:border-brass/60 hover:text-paper"
              >
                Instagram
              </a>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex-1 border border-line px-3 py-2 text-center text-[0.58rem] uppercase tracking-[0.14em] text-paper/60 transition-colors hover:border-brass/60 hover:text-paper"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 select-none overflow-hidden">
          <p className="text-outline whitespace-nowrap text-center font-display text-[clamp(4rem,15vw,12rem)] leading-[0.8] tracking-[0.04em]">
            TAHURA
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-6 sm:flex-row">
          <p className="text-[0.58rem] uppercase tracking-[0.18em] text-mute">
            © {new Date().getFullYear()} {site.name} · Bandung, Indonesia
          </p>
          <div className="flex items-center gap-5 text-[0.58rem] uppercase tracking-[0.16em] text-mute">
            <a href="#top" className="transition-colors hover:text-paper">
              Back to top ↑
            </a>
            <Link href="/crm" className="transition-colors hover:text-paper">
              Owner login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
