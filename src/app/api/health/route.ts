import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = ["products", "orders", "order_items", "leads", "subscribers"];

const REQUIRED_SEQUENCES = ["order_number_seq"];

type Check = {
  name: string;
  ok: boolean;
  detail?: string;
};

type QueryResult<T> = { rows: T[] };

function rowsOf<T>(result: unknown): T[] {
  const value = result as QueryResult<T> | T[];
  if (Array.isArray(value)) return value;
  return value?.rows ?? [];
}

/**
 * Diagnostik deployment.
 *
 * `select 1` saja menyesatkan: database bisa terhubung tapi tabel belum
 * dimigrasikan, sehingga homepage 500 sementara health tetap hijau.
 */
export async function GET() {
  const startedAt = Date.now();
  const checks: Check[] = [];

  try {
    await db.execute(sql`select 1`);
    checks.push({ name: "connection", ok: true, detail: "Postgres terjangkau" });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        checks: [
          {
            name: "connection",
            ok: false,
            detail: error instanceof Error ? error.message : "Tidak bisa terhubung",
          },
        ],
        hint:
          "Periksa DATABASE_URL di environment Vercel. Gunakan connection string " +
          "pooled (berakhiran -pooler) dan pastikan sslmode=require.",
      },
      { status: 500 },
    );
  }

  // Tabel wajib
  try {
    const result = await db.execute(sql`
      select table_name
        from information_schema.tables
       where table_schema = 'public'
    `);
    const present = new Set(rowsOf<{ table_name: string }>(result).map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((name) => !present.has(name));

    checks.push({
      name: "tables",
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? `${REQUIRED_TABLES.length}/${REQUIRED_TABLES.length} tabel tersedia`
          : `belum ada: ${missing.join(", ")}`,
    });
  } catch (error) {
    checks.push({
      name: "tables",
      ok: false,
      detail: error instanceof Error ? error.message : "query gagal",
    });
  }

  // Sequence nomor pesanan (migration 0001)
  try {
    const result = await db.execute(sql`
      select sequencename from pg_sequences where schemaname = 'public'
    `);
    const present = new Set(rowsOf<{ sequencename: string }>(result).map((r) => r.sequencename));
    const missing = REQUIRED_SEQUENCES.filter((name) => !present.has(name));
    checks.push({
      name: "sequences",
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? "order_number_seq siap"
          : `belum ada: ${missing.join(", ")} — jalankan migration 0001`,
    });
  } catch {
    checks.push({ name: "sequences", ok: false, detail: "tidak dapat diperiksa" });
  }

  // Jumlah baris (bukti seed berjalan)
  let counts: Record<string, number> | null = null;
  try {
    const result = await db.execute(sql`
      select
        (select count(*) from products)::int    as products,
        (select count(*) from orders)::int      as orders,
        (select count(*) from leads)::int       as leads,
        (select count(*) from subscribers)::int as subscribers
    `);
    counts = rowsOf<Record<string, number>>(result)[0] ?? null;
    checks.push({
      name: "seed",
      ok: (counts?.products ?? 0) > 0,
      detail:
        (counts?.products ?? 0) > 0
          ? `produk=${counts?.products} pesanan=${counts?.orders} leads=${counts?.leads}`
          : "tabel produk kosong (seed belum jalan — buka halaman utama sekali)",
    });
  } catch {
    checks.push({ name: "seed", ok: false, detail: "tabel belum lengkap" });
  }

  // ── Konfigurasi (tidak membocorkan nilai rahasia) ─────────────────────
  const authSecretSet = Boolean(process.env.AUTH_SECRET?.trim());
  const passcodeSet = Boolean(process.env.CRM_PASSCODE?.trim());
  const warnings: string[] = [];

  if (!passcodeSet) {
    warnings.push(
      "CRM_PASSCODE belum di-set — login CRM ditolak di production. Set di " +
        "Vercel → Settings → Environment Variables.",
    );
  }
  if (!authSecretSet) {
    warnings.push(
      passcodeSet
        ? "AUTH_SECRET kosong — cookie sesi memakai turunan CRM_PASSCODE. Disarankan mengisi nilai acak (openssl rand -base64 32)."
        : "AUTH_SECRET dan CRM_PASSCODE kosong — sesi memakai kunci acak per instance; set keduanya.",
    );
  }

  // Status HTTP hanya mengikuti fungsi inti (koneksi, skema, seed).
  const ok = checks.every((check) => check.ok);
  const hints: string[] = [];

  if (!checks.find((c) => c.name === "tables")?.ok) {
    hints.push(
      "Migrasi belum dijalankan. Jalankan drizzle/0000_sleepy_valeria_richards.sql " +
        "lalu drizzle/0001_hardening.sql di Neon SQL Editor, atau `npm run db:migrate`.",
    );
  }
  if (!checks.find((c) => c.name === "sequences")?.ok) {
    hints.push("Jalankan drizzle/0001_hardening.sql untuk membuat sequence nomor pesanan.");
  }
  if (!checks.find((c) => c.name === "seed")?.ok) {
    hints.push("Buka halaman utama sekali agar data contoh terisi otomatis.");
  }

  return Response.json(
    {
      ok,
      ready: ok && passcodeSet,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      latencyMs: Date.now() - startedAt,
      counts,
      checks,
      ...(warnings.length > 0 ? { warnings } : {}),
      ...(hints.length > 0 ? { hints } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
