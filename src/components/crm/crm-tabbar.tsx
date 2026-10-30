"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_LINKS, crmBadge, crmIsActive, type CrmCounts } from "./crm-nav";

/**
 * Tab bar bawah untuk CRM di ponsel.
 *
 * Kenapa: sebelumnya navigasi di Android hanya lewat drawer (ketuk Menu →
 * pilih → tunggu transisi). Tab bar ini membuat keempat halaman berjarak satu
 * ketukan, dan berada di zona jempol. Disembunyikan mulai `lg`, tempat sidebar
 * permanen sudah mengambil alih.
 *
 * Detail khusus Android yang ditangani di sini:
 * - `pb-[env(safe-area-inset-bottom)]` supaya tidak tertutup gesture bar.
 * - tiap tab setinggi 56px (`min-h-14`) — di atas ambang 48px Material.
 * - `aria-current="page"` agar pembaca layar mengumumkan halaman aktif.
 * - ikon SVG 20px, bukan glyph font, jadi tidak bergantung font fallback.
 * - `z-20`, di bawah overlay drawer (`z-30`) dan modal (`z-[60]`): saat drawer
 *   terbuka tab bar ikut meredup, bukan melayang di atasnya.
 */
export function CrmTabBar({ counts }: { counts: CrmCounts }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="CRM sections"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-crm-line bg-white/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {CRM_LINKS.map((link) => {
          const active = crmIsActive(pathname, link.href);
          const count = crmBadge(link.href, counts);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 transition-colors active:bg-[#f4eee2] ${
                  active ? "text-[#221b15]" : "text-[#8b8173]"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity ${
                    active ? "bg-[#7a5a2e] opacity-100" : "opacity-0"
                  }`}
                />
                <span className="relative">
                  <TabIcon name={link.href} active={active} />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-[#7a5a2e] px-1 text-center text-[0.62rem] font-semibold leading-4 text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[0.64rem] leading-none ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {link.tab}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2 : 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "/crm/orders") {
    // kotak surat / berkas pesanan
    return (
      <svg {...common}>
        <path d="M4 5h16v14H4z" />
        <path d="M4 9h16M9 13h6" />
      </svg>
    );
  }

  if (name === "/crm/leads") {
    // orang + tanda plus (pipeline)
    return (
      <svg {...common}>
        <circle cx="10" cy="8" r="3.2" />
        <path d="M4 20c0-3.1 2.7-5 6-5s6 1.9 6 5" />
        <path d="M18 8v4M16 10h4" />
      </svg>
    );
  }

  if (name === "/crm/products") {
    // kotak inventaris bertumpuk
    return (
      <svg {...common}>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="M3 13l9 5 9-5" />
      </svg>
    );
  }

  // overview: empat blok dashboard
  return (
    <svg {...common}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
