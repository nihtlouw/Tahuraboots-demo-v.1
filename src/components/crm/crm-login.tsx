"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crest } from "@/components/brand";
import { site } from "@/lib/site";

export function CrmLogin() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not open the console.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-crm lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(200,162,102,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="grain-layer" />
        </div>
        <div className="relative flex items-center gap-3">
          <Crest className="h-10 w-auto text-brass" />
          <div>
            <p className="font-display text-xl tracking-[0.16em] text-paper">TAHURA</p>
            <p className="text-[0.5rem] uppercase tracking-[0.3em] text-paper/45">
              Boots Company
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.26em] text-brass">
            Owner console
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.3rem,4vw,3.4rem)] font-light leading-[1.02] text-paper">
            The bench,
            <br />
            <span className="italic text-brass-light">on one screen.</span>
          </h1>
          <p className="mt-5 text-[0.9rem] leading-relaxed text-paper/55">
            Track every pair in stock, every order out of Bandung, and every
            collector waiting on a cutting — without leaving the studio.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-paper/15 pt-5">
            {[
              [String(site.founded), "est. in Bandung"],
              ["Hand-welted", "on the bench"],
              ["6–8 weeks", "made to order"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-xl text-paper">{value}</p>
                <p className="mt-1 text-[0.52rem] uppercase tracking-[0.14em] text-paper/40">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[0.56rem] uppercase tracking-[0.2em] text-paper/30">
          Jl. Ters Kopo · Bandung 40218
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Crest className="h-9 w-auto text-[#7a5a2e]" />
            <div>
              <p className="font-display text-lg tracking-[0.16em] text-[#221b15]">TAHURA</p>
              <p className="text-[0.5rem] uppercase tracking-[0.26em] text-[#8b8173]">
                Owner console
              </p>
            </div>
          </div>

          <h2 className="font-display text-3xl leading-tight text-[#221b15]">
            Sign in
          </h2>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-[#8b8173]">
            Enter the studio passcode to manage inventory, orders and leads.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            <div>
              <label htmlFor="passcode" className="crm-label">
                Studio passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="crm-input !px-4 !py-3"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
            >
              {loading ? "Opening the console…" : "Open the console"}
              <span>→</span>
            </button>
            {error && (
              <p className="rounded-lg border border-[#dfc0bb] bg-[#f1dedb] px-3 py-2 text-[0.74rem] text-[#88423a]">
                {error}
              </p>
            )}
          </form>

          <div className="mt-6 rounded-lg border border-[#e6d6b8] bg-[#fbf4e5] px-4 py-3">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#8a6a3c]">
              Demo access
            </p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-[#7a6244]">
              Use passcode{" "}
              <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.72rem] font-semibold text-[#221b15]">
                tahura2026
              </span>{" "}
              — set <span className="font-mono text-[0.7rem]">CRM_PASSCODE</span>{" "}
              in the environment to change it.
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#8b8173] transition-colors hover:text-[#221b15]"
          >
            ← Back to the storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
