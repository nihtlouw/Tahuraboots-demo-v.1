import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="container-x flex min-h-screen flex-col items-center justify-center gap-5 text-center">
        <p className="text-[0.6rem] uppercase tracking-[0.28em] text-brass">404</p>
        <h1 className="max-w-md font-display text-4xl font-light leading-tight">
          This last was never cut.
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-paper/55">
          Halaman yang Anda cari tidak ada. Kembali ke katalog atau lihat pesanan
          di Owner CRM.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-brass px-5 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-brass-light"
          >
            The collection
          </Link>
          <Link
            href="/crm"
            className="border border-line px-5 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
          >
            Owner CRM
          </Link>
        </div>
      </div>
    </div>
  );
}
