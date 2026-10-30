"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Batas galat untuk seluruh aplikasi. Kalau database Neon tidak bisa dihubungi,
 * pengunjung melihat pesan yang jelas alih-alih stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="container-x flex min-h-screen flex-col items-center justify-center gap-5 text-center">
        <p className="text-[0.6rem] uppercase tracking-[0.28em] text-brass">
          Something slipped at the bench
        </p>
        <h1 className="max-w-lg font-display text-3xl font-light leading-tight">
          We couldn&apos;t load this page.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-paper/55">
          Terjadi kesalahan saat menghubungi database studio. Coba lagi sebentar;
          kalau masih berlanjut, hubungi kami lewat WhatsApp.
        </p>
        {error.digest && (
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-paper/30">
            ref {error.digest}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-brass px-5 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-brass-light"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-line px-5 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
          >
            Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
