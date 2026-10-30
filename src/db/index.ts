import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __tahuraPool?: Pool;
};

/**
 * Satu pool per proses.
 *
 * - `max: 5` — Neon (paket kecil) punya batas koneksi; 5 cukup untuk SSR.
 * - `idleTimeoutMillis` — lepaskan koneksi menganggur agar tidak menahan slot.
 * - `keepAlive` — hindari putus di tengah request pada jaringan publik.
 * - SSL: koneksi `-pooler` Neon memakai `sslmode=require`, jadi `pg` perlu
 *   `ssl` eksplisit supaya tidak memakai perilaku default yang bisa berubah.
 */
function createPool() {
  const isNeon = /neon\.tech/.test(databaseUrl ?? "");
  return new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    ...(isNeon ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

export const pool = globalForDb.__tahuraPool ?? createPool();

// Cegah kebocoran listener pada hot reload saat development.
pool.on("error", (error) => {
  console.error("[db] idle client error", error.message);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__tahuraPool = pool;
}

export const db = drizzle(pool);
