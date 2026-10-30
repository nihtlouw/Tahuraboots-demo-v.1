import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * - `DATABASE_URL`  → koneksi Neon (pooled) untuk runtime aplikasi.
 * - `DIRECT_URL`    → koneksi langsung (tanpa pooler) untuk migration/push.
 *
 * Catatan Neon: `drizzle-kit` sebaiknya memakai koneksi direct (tanpa "-pooler")
 * agar DDL tidak melewati PgBouncer. Kalau `DIRECT_URL` tidak diisi, fallback
 * ke `DATABASE_URL`.
 */
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL (atau DIRECT_URL) belum di-set. Salin .env.example ke .env.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
