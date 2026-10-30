#!/usr/bin/env node
/**
 * Menghasilkan `src/db/bootstrap-sql.ts` dari `drizzle/bootstrap.sql`.
 *
 * Kenapa perlu digenerate?
 *   Serverless (Vercel) tidak menjamin file .sql ikut ter-bundle kalau dibaca
 *   lewat `fs`, jadi statement-nya perlu menjadi modul TypeScript agar pasti
 *   ikut ter-build. Satu sumber kebenaran tetap file .sql di drizzle/.
 *
 * Pemakaian:
 *   node scripts/gen-bootstrap.mjs
 *   node scripts/gen-bootstrap.mjs --check   # gagal kalau file tidak sinkron
 */
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE = "drizzle/bootstrap.sql";
const TARGET = "src/db/bootstrap-sql.ts";

/** Pecah SQL jadi statement, sadar string literal dan blok dolar ($$). */
export function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inString = false;
  let dollarTag = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    // Komentar baris (-- ...) dibuang, kecuali di dalam string.
    if (!inString && !dollarTag && char === "-" && next === "-") {
      while (index < sql.length && sql[index] !== "\n") index += 1;
      current += "\n";
      continue;
    }

    // Blok dolar: $$ ... $$ atau $tag$ ... $tag$
    if (!inString && char === "$") {
      const rest = sql.slice(index);
      const match = rest.match(/^\$[A-Za-z_]*\$/);
      if (match) {
        const tag = match[0];
        if (dollarTag === tag) {
          dollarTag = null;
        } else if (!dollarTag) {
          dollarTag = tag;
        }
        current += tag;
        index += tag.length - 1;
        continue;
      }
    }

    if (!dollarTag) {
      if (char === "'" && !inString) {
        inString = true;
      } else if (char === "'" && inString) {
        // '' adalah escape di SQL, bukan penutup string.
        if (next === "'") {
          current += "''";
          index += 1;
          continue;
        }
        inString = false;
      }
    }

    if (char === ";" && !inString && !dollarTag) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function main() {
  const sql = await fs.readFile(SOURCE, "utf8");
  const statements = splitStatements(sql);

  const header = `// ─────────────────────────────────────────────────────────────────────
//  AUTO-GENERATED — jangan diedit manual.
//  Sumber: ${SOURCE}
//  Regenerasi: node scripts/gen-bootstrap.mjs
//
//  Dipakai oleh src/db/ensure-schema.ts untuk membuat skema otomatis pada
//  deployment baru (idempotent: CREATE ... IF NOT EXISTS).
// ─────────────────────────────────────────────────────────────────────

export const BOOTSTRAP_STATEMENTS: readonly string[] = [`;

  const body = statements
    .map((statement) => `  ${JSON.stringify(statement)},`)
    .join("\n");

  const content = `${header}\n${body}\n];\n\nexport const BOOTSTRAP_VERSION = "bootstrap-v1";\n`;

  if (process.argv.includes("--check")) {
    const existing = await fs.readFile(TARGET, "utf8").catch(() => "");
    if (existing !== content) {
      console.error(
        `✗ ${TARGET} tidak sinkron dengan ${SOURCE}. Jalankan: node scripts/gen-bootstrap.mjs`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`✓ ${TARGET} sinkron (${statements.length} statement)`);
    return;
  }

  await fs.mkdir(path.dirname(TARGET), { recursive: true });
  await fs.writeFile(TARGET, content);
  console.log(`✓ ${TARGET} — ${statements.length} statement dari ${SOURCE}`);
}

await main();
