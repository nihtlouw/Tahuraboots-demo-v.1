/**
 * Sumber tunggal navigasi CRM.
 *
 * Dipakai dua kali: sidebar (desktop, selalu terlihat) dan tab bar bawah
 * (ponsel). Sebelumnya daftar tautan hanya hidup di dalam sidebar, sehingga
 * di ponsel satu-satunya cara berpindah halaman adalah membuka drawer —
 * tiga ketukan untuk hal yang di aplikasi lain cukup satu.
 */

export type CrmCounts = {
  orders: number;
  leads: number;
  lowStock: number;
};

export type CrmLink = {
  href: string;
  label: string;
  /** Glyph untuk sidebar gelap (sudah ada sejak versi pertama). */
  glyph: string;
  /** Label pendek untuk tab bar ponsel, tempat ruang hanya ~80px. */
  tab: string;
};

export const CRM_LINKS: CrmLink[] = [
  { href: "/crm", label: "Overview", glyph: "◧", tab: "Overview" },
  { href: "/crm/orders", label: "Orders", glyph: "❐", tab: "Orders" },
  { href: "/crm/leads", label: "Leads", glyph: "✧", tab: "Leads" },
  { href: "/crm/products", label: "Inventory", glyph: "◈", tab: "Stock" },
];

/** Angka badge per tautan; 0 berarti tidak ada badge. */
export function crmBadge(href: string, counts: CrmCounts): number {
  if (href === "/crm/orders") return counts.orders;
  if (href === "/crm/leads") return counts.leads;
  if (href === "/crm/products") return counts.lowStock;
  return 0;
}

/**
 * `/crm` harus cocok persis, kalau tidak semua sub-halaman ikut menyalakan
 * tab Overview.
 */
export function crmIsActive(pathname: string, href: string): boolean {
  return href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);
}
