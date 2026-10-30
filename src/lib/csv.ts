/** Utilitas ekspor CSV kecil (tanpa dependensi) untuk tabel CRM. */

function escapeCell(value: unknown) {
  const text = value == null ? "" : String(value);
  // Selalu kutip agar aman terhadap koma, kutip, dan baris baru.
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]) {
  if (rows.length === 0) return "";
  const keys = columns ?? Object.keys(rows[0]);
  const header = keys.map((key) => escapeCell(key)).join(",");
  const body = rows
    .map((row) => keys.map((key) => escapeCell(row[key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Unduh CSV di browser. Menambahkan BOM supaya Excel membaca UTF-8 dengan benar
 * (nama pelanggan bisa mengandung karakter non-ASCII).
 */
export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]) {
  if (rows.length === 0) return false;

  const blob = new Blob([`\uFEFF${toCsv(rows, columns)}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function csvStamp(prefix: string) {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${prefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.csv`;
}
