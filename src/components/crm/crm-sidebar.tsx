"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crest } from "@/components/brand";
import { CRM_LINKS, crmBadge, crmIsActive, type CrmCounts } from "./crm-nav";

export function CrmSidebar({ counts }: { counts: CrmCounts }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Drawer di ponsel: kunci scroll latar dan tutup dengan Escape, sama seperti
  // modal lain di CRM. Sebelumnya latar tetap bisa digulir di balik drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/crm/session", { method: "DELETE" });
    router.refresh();
    setSigningOut(false);
  }

  const nav = (
    <nav className="space-y-1">
      {CRM_LINKS.map((link) => {
        const active = crmIsActive(pathname, link.href);
        const count = crmBadge(link.href, counts);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`group flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[0.84rem] transition-colors active:bg-paper/10 ${
              active
                ? "bg-paper/10 text-paper"
                : "text-paper/55 hover:bg-paper/5 hover:text-paper"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`text-[0.9rem] ${active ? "text-brass" : "text-paper/35 group-hover:text-brass/70"}`}
              >
                {link.glyph}
              </span>
              {link.label}
            </span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.64rem] font-semibold ${
                  active
                    ? "bg-brass text-ink"
                    : "bg-paper/10 text-paper/60 group-hover:bg-paper/15"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* z-40: saat drawer terbuka, overlay `z-30` menutupi baris ini — tanpa
          naik satu lapis tombol "Close" berubah label tapi tidak bisa ditekan. */}
      <div className="safe-top sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b border-crm-line bg-crm/95 px-4 py-2 backdrop-blur lg:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <Crest className="h-7 w-auto shrink-0 text-[#7a5a2e]" />
          <span className="truncate font-display text-base tracking-[0.14em] text-[#221b15]">
            TAHURA
          </span>
          {/* Di ponsel tab bar hanya menandai posisi; label ini menyebut namanya. */}
          <span className="shrink-0 rounded-full bg-[#efe7d6] px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#7a5a2e]">
            {CRM_LINKS.find((link) => crmIsActive(pathname, link.href))?.label ?? "CRM"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 items-center rounded-md border border-crm-line px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#5f5548] active:bg-[#f1ebdf]"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-ink transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="grain-layer opacity-20" />
        <div className="relative flex items-center justify-between px-5 pb-5 pt-6">
          <Link href="/crm" className="flex items-center gap-2.5">
            <Crest className="h-9 w-auto text-brass" />
            <span>
              <span className="block font-display text-lg leading-none tracking-[0.16em] text-paper">
                TAHURA
              </span>
              <span className="mt-1 block text-[0.60rem] uppercase tracking-[0.26em] text-paper/45">
                Owner console
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-lg text-paper/50 active:bg-paper/10 lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="relative border-y border-paper/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-oxblood/70 text-[0.64rem] font-semibold text-paper">
              TB
            </span>
            <span>
              <span className="block text-[0.72rem] text-paper/85">Studio owner</span>
              <span className="block text-[0.62rem] uppercase tracking-[0.16em] text-paper/40">
                Bandung · Admin
              </span>
            </span>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-paper/30">
            Manage
          </p>
          {nav}

          <p className="mt-6 px-3 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-paper/30">
            Shortcuts
          </p>
          <div className="space-y-1">
            <Link
              href="/#collection"
              className="flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-[0.8rem] text-paper/55 transition-colors hover:bg-paper/5 hover:text-paper active:bg-paper/10"
            >
              View storefront <span className="text-[0.68rem]">↗</span>
            </Link>
            <Link
              href="/#custom"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[0.78rem] text-paper/55 transition-colors hover:bg-paper/5 hover:text-paper"
            >
              Configurator <span className="text-[0.68rem]">↗</span>
            </Link>
            <a
              href="https://www.instagram.com/tahurabootsco"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[0.78rem] text-paper/55 transition-colors hover:bg-paper/5 hover:text-paper"
            >
              Instagram <span className="text-[0.68rem]">↗</span>
            </a>
          </div>
        </div>

        <div className="relative border-t border-paper/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="min-h-11 w-full rounded-lg border border-paper/15 px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-paper/65 transition-colors hover:border-brass/60 hover:text-brass active:bg-paper/10 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.16em] text-paper/25">
            Tahura CRM v1.0
          </p>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 cursor-default bg-ink/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
