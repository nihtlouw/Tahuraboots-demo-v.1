import { NextResponse, type NextRequest } from "next/server";
import { OWNER_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Penjaga rute CRM di level request.
 *
 * Layout `app/crm/layout.tsx` hanya mengganti tampilan; komponen halaman tetap
 * dieksekusi dan datanya ikut terkirim di payload RSC. Middleware ini
 * menghentikan request lebih awal sehingga tidak ada data yang dirender untuk
 * pengunjung tanpa sesi sah.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/crm` adalah halaman login — biarkan lewat.
  if (pathname === "/crm") return NextResponse.next();

  const token = request.cookies.get(OWNER_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/crm";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/crm/:path*"],
};
