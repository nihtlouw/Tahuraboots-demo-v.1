import { pool } from "@/db";
import { BOOTSTRAP_STATEMENTS, BOOTSTRAP_VERSION } from "@/db/bootstrap-sql";

/**
 * Membuat skema database secara otomatis saat pertama kali diakses.
 *
 * Kenapa: deployment baru (Vercel + Neon) sering lupa menjalankan migration,
 * sehingga semua query gagal dengan "relation does not exist" dan halaman
 * tampil 500. Fungsi ini menutup celah tersebut — statement-nya idempotent
 * (`CREATE ... IF NOT EXISTS`), jadi aman dijalankan berkali-kali.
 *
 * Pengaman:
 * - Hanya berjalan bila tabel `products` belum ada.
 * - Memakai advisory lock sesi agar beberapa cold start bersamaan tidak
 *   mengeksekusi DDL secara paralel.
 * - Hasil pengecekan di-cache singkat (TTL), bukan selamanya: instance yang
 *   sudah lama hidup (warm lambda) tetap mendeteksi kalau tabelnya hilang,
 *   misalnya database di-reset atau branch Neon diganti.
 * - Bisa dimatikan dengan `AUTO_MIGRATE=false` (mis. kalau DDL hanya boleh
 *   lewat pipeline migration).
 */

const REQUIRED_TABLE = "products";

/** Kunci advisory bebas tabrakan dengan lock seed. */
const SCHEMA_LOCK_KEY = 728_341_902;

/**
 * Lama hasil pengecekan dianggap valid. 30 detik cukup untuk memangkas query
 * `information_schema` pada trafik beruntun, tapi tetap cepat pulih.
 */
const CACHE_TTL_MS = 30_000;

function autoMigrateEnabled() {
  return (process.env.AUTO_MIGRATE ?? "true").toLowerCase() !== "false";
}

async function tableExists() {
  const result = await pool.query(
    `select 1
       from information_schema.tables
      where table_schema = 'public' and table_name = $1
      limit 1`,
    [REQUIRED_TABLE],
  );

  return (result.rows?.length ?? 0) > 0;
}

export type SchemaState = {
  ready: boolean;
  created: boolean;
  statements: number;
  skippedReason?: string;
};

type Cache = { at: number; state: SchemaState };

const globalForSchema = globalThis as typeof globalThis & {
  __tahuraSchemaCache?: Cache;
  __tahuraSchemaInflight?: Promise<SchemaState>;
};

/** Paksa pengecekan ulang pada pemanggilan berikutnya. */
export function resetSchemaCache() {
  globalForSchema.__tahuraSchemaCache = undefined;
}

/**
 * Apakah error ini "tabel/relasi belum ada" (Postgres 42P01)?
 *
 * Dipakai untuk memulihkan diri: kalau DDL baru saja dijalankan/di-reset dan
 * query masih menabrak tabel yang hilang, kita buat ulang skema lalu ulangi.
 */
export function isMissingRelationError(error: unknown) {
  // Drizzle membungkus error `pg` di dalam `cause` (DrizzleQueryError), jadi
  // kode Postgres tidak ada di objek teratas — telusuri rantai cause.
  let current: unknown = error;

  for (let depth = 0; current && depth < 5; depth += 1) {
    const code = (current as { code?: string } | null)?.code;
    if (code === "42P01") return true;

    const message =
      current instanceof Error ? current.message : typeof current === "string" ? current : "";
    if (/relation .* does not exist|does not exist.*relation/i.test(message)) return true;

    current = (current as { cause?: unknown } | null)?.cause;
  }

  return false;
}

async function runBootstrap(): Promise<SchemaState> {
  if (await tableExists()) {
    return { ready: true, created: false, statements: 0 };
  }

  if (!autoMigrateEnabled()) {
    return {
      ready: false,
      created: false,
      statements: 0,
      skippedReason:
        "Tabel belum ada dan AUTO_MIGRATE=false — jalankan migration secara manual.",
    };
  }

  console.log(
    `[schema] tabel "${REQUIRED_TABLE}" belum ada — menerapkan ${BOOTSTRAP_STATEMENTS.length} statement (${BOOTSTRAP_VERSION})`,
  );

  // Client khusus supaya advisory lock sesi tidak "bocor" ke koneksi pool lain.
  const client = await pool.connect();
  let applied = 0;

  try {
    await client.query("select pg_advisory_lock($1)", [SCHEMA_LOCK_KEY]);

    // Instance lain mungkin sudah menyelesaikannya saat kita menunggu lock.
    const alreadyThere = await client.query(
      `select 1
         from information_schema.tables
        where table_schema = 'public' and table_name = $1
        limit 1`,
      [REQUIRED_TABLE],
    );
    if ((alreadyThere.rows?.length ?? 0) > 0) {
      return { ready: true, created: false, statements: 0 };
    }

    for (const statement of BOOTSTRAP_STATEMENTS) {
      try {
        await client.query(statement);
        applied += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Idempotensi: objek yang sudah ada bukan kegagalan.
        if (/already exists|duplicate_object|duplicate key/i.test(message)) {
          continue;
        }
        throw error;
      }
    }

    console.log(`[schema] selesai — ${applied} statement dieksekusi`);
    return { ready: true, created: true, statements: applied };
  } finally {
    await client.query("select pg_advisory_unlock($1)", [SCHEMA_LOCK_KEY]).catch(() => {});
    client.release();
  }
}

/**
 * Idempotent & di-cache singkat per instance. Kalau gagal, cache dikosongkan
 * agar request berikutnya mencoba lagi (mis. setelah env var diperbaiki).
 */
export function ensureSchema(options?: { force?: boolean }): Promise<SchemaState> {
  const cached = globalForSchema.__tahuraSchemaCache;
  if (!options?.force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Promise.resolve(cached.state);
  }

  if (globalForSchema.__tahuraSchemaInflight) {
    return globalForSchema.__tahuraSchemaInflight;
  }

  const promise = runBootstrap()
    .then((state) => {
      globalForSchema.__tahuraSchemaCache = { at: Date.now(), state };
      return state;
    })
    .catch((error) => {
      globalForSchema.__tahuraSchemaCache = undefined;
      console.error(
        "[schema] gagal menyiapkan skema:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    })
    .finally(() => {
      globalForSchema.__tahuraSchemaInflight = undefined;
    });

  globalForSchema.__tahuraSchemaInflight = promise;
  return promise;
}
