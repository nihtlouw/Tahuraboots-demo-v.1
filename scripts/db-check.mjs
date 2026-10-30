#!/usr/bin/env node
/**
 * Cek koneksi database + ringkasan tabel.
 *
 *   npm run db:check
 *
 * Membaca DATABASE_URL / DIRECT_URL dari .env (atau environment variable).
 * Keluar dengan kode 1 kalau koneksi atau query gagal — cocok dipakai di CI.
 */
import "dotenv/config";
import pg from "pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error("✗ DATABASE_URL (atau DIRECT_URL) belum di-set.");
  process.exit(1);
}

const redacted = url.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1****$2");
const expected = ["products", "orders", "order_items", "leads"];

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 });

try {
  await client.connect();
  const { rows: version } = await client.query("select version()");
  console.log(`✓ Terhubung ke ${redacted}`);
  console.log(`  ${version[0].version.split(" on ")[0]}`);

  const { rows } = await client.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
      order by table_name`,
  );
  const tables = rows.map((row) => row.table_name);
  console.log(`\n  Tabel di schema public (${tables.length}):`);

  for (const name of tables) {
    const { rows: countRows } = await client.query(
      `select count(*)::int as n from "${name}"`,
    );
    console.log(`   • ${name.padEnd(14)} ${String(countRows[0].n).padStart(6)} baris`);
  }

  const missing = expected.filter((name) => !tables.includes(name));
  if (missing.length > 0) {
    console.error(`\n✗ Tabel belum ada: ${missing.join(", ")}`);
    console.error("  Jalankan: npm run db:migrate");
    process.exitCode = 1;
  } else {
    console.log("\n✓ Skema lengkap. Aplikasi siap dipakai.");
  }
} catch (error) {
  console.error(`✗ Gagal koneksi/query: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
