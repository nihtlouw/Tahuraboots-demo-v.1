# Deploy ke Vercel + Neon

Panduan singkat untuk membuat deployment produksi berjalan penuh: storefront,
CRM, dan database Neon.

---

## 1. Environment variables di Vercel

**Settings → Environment Variables** (centang Production *dan* Preview):

| Key | Contoh nilai | Wajib | Catatan |
| --- | --- | --- | --- |
| `DATABASE_URL` | `postgresql://USER:PASS@ep-xxx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | ✅ | **Wajib** memakai host ber-`-pooler` |
| `DIRECT_URL` | `postgresql://USER:PASS@ep-xxx.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | – | Hanya untuk migration dari mesin lokal/CI |
| `CRM_PASSCODE` | passphrase panjang & acak | ✅ | Tanpa ini **login CRM ditolak di production** |
| `AUTH_SECRET` | hasil `openssl rand -base64 32` | ✅ | Kunci penandatangan cookie sesi |
| `NEXT_PUBLIC_SITE_URL` | `https://tahuraboots-demo-v1.vercel.app` | – | Canonical, sitemap, structured data. Kalau kosong dipakai `VERCEL_PROJECT_PRODUCTION_URL` |
| `PG_POOL_MAX` | `1` | – | Default sudah `1` saat terdeteksi Vercel |
| `AUTO_MIGRATE` | `true` (default) | – | Set `false` kalau DDL hanya boleh lewat pipeline migration |

> Jangan tambahkan `channel_binding=require` pada connection string — driver
> `pg` tidak mendukungnya. Cukup `sslmode=require`.

Setelah menambah/mengubah env var, **Redeploy** agar berlaku.

---

## 2. Terapkan skema ke Neon

**A. Otomatis — biasanya tidak perlu melakukan apa pun**

Aplikasi membuat skemanya sendiri saat pertama kali diakses:

1. Deploy seperti biasa, lalu buka `https://<domain-anda>/api/health` sekali
   (atau langsung halaman utama).
2. `ensureSchema()` memeriksa tabel `products`. Kalau belum ada, ia menjalankan
   isi `drizzle/bootstrap.sql` (21 statement, semuanya `IF NOT EXISTS`).
3. `ensureSeed()` langsung mengisi 8 produk, 15 pesanan, dan 8 leads.
4. Selesai — refresh `/api/health`, nilainya sudah `ok:true` & `ready:true`.

Pengaman yang sudah terpasang:

| Situasi | Perilaku |
| --- | --- |
| Beberapa lambda cold start bersamaan | `pg_advisory_lock` — hanya satu yang menjalankan DDL, yang lain menunggu lalu melewati |
| Database di-reset / branch Neon diganti saat instance masih hidup | Cache 30 detik + penanganan error `42P01` membuat skema dibuat ulang otomatis |
| Ingin DDL dikunci ke pipeline migration saja | Set `AUTO_MIGRATE=false`; health akan melaporkan `schema: Tabel belum ada dan AUTO_MIGRATE=false` |
| User database tidak punya hak `CREATE` | Health melaporkan `schema` gagal dengan pesan asli Postgres — gunakan opsi manual di bawah |

**B. Manual — Neon SQL Editor (cadangan)**

1. Buka <https://console.neon.tech> → project → **SQL Editor**.
2. Copy seluruh isi [`drizzle/bootstrap.sql`](../drizzle/bootstrap.sql).
3. **Run**. File ini idempotent, aman dijalankan berkali-kali.

**C. Manual — dari mesin lokal**

```bash
cp .env.example .env      # isi DATABASE_URL & DIRECT_URL
npm install
npm run db:migrate        # menerapkan drizzle/0000 + 0001
npm run db:check          # daftar tabel + jumlah baris
```

**D. Manual — GitHub Actions**

`.github/workflows/db-migrate.yml` → isi secret `DATABASE_URL` & `DIRECT_URL`
di *Settings → Secrets and variables → Actions*, lalu **Run workflow**.

> `drizzle/bootstrap.sql` adalah sumber kebenaran. Setelah mengubahnya, jalankan
> `node scripts/gen-bootstrap.mjs` agar `src/db/bootstrap-sql.ts` ikut diperbarui
> (`--check` untuk memverifikasi tanpa menulis).

---

## 3. Verifikasi

Buka:

```
https://<domain-anda>/api/health
```

Deployment sehat akan menampilkan:

```json
{
  "ok": true,
  "ready": true,
  "environment": "production",
  "counts": { "products": 8, "orders": 15, "leads": 8, "subscribers": 0 },
  "checks": [
    { "name": "connection", "ok": true, "detail": "Postgres terjangkau" },
    { "name": "schema",     "ok": true, "detail": "skema dibuat otomatis (21 statement)" },
    { "name": "tables",     "ok": true, "detail": "5/5 tabel tersedia" },
    { "name": "sequences",  "ok": true, "detail": "order_number_seq siap" },
    { "name": "seed",       "ok": true, "detail": "produk=8 pesanan=15 leads=8" }
  ]
}
```

Arti field:

- **`ok`** → fungsi inti (koneksi, schema, tabel, sequence, seed). Kalau `false`, HTTP 503.
  Endpoint ini sengaja **mengabaikan cache** (`force`) supaya angka yang tampil
  adalah keadaan nyata saat itu.
- **`ready`** → `ok` **dan** `CRM_PASSCODE` sudah di-set, artinya CRM bisa dipakai.
- **`warnings`** → masalah konfigurasi yang tidak mematikan aplikasi.
- **`hints`** → langkah perbaikan yang spesifik.

Endpoint ini sekaligus memperbaiki database-nya: satu kunjungan ke `/api/health`
membuat skema **dan** data contoh. Halaman lain juga memanggil `ensureSeed()`
yang sama, jadi membuka homepage lebih dulu pun hasilnya identik.

---

## 4. Troubleshooting

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| Homepage 500, `/api/health` 503 dengan `tables: belum ada …` | Skema belum dibuat dan `AUTO_MIGRATE=false`, atau user DB tak punya hak `CREATE` | Hapus `AUTO_MIGRATE`/set `true`, atau jalankan `drizzle/bootstrap.sql` (opsi 2B) |
| `connection: connection refused / timeout` | `DATABASE_URL` salah atau host tidak ber-`-pooler` | Salin ulang connection string dari Neon, pastikan ada `-pooler` dan `sslmode=require` |
| Login CRM selalu "passcode does not match" | `CRM_PASSCODE` belum di-set (production menolak passcode default) | Set `CRM_PASSCODE`, lalu Redeploy |
| Login berhasil tapi langsung logout / sesi tidak konsisten | `AUTH_SECRET` kosong sehingga kunci acak per-instance | Set `AUTH_SECRET` tetap, Redeploy |
| Health `ready:false` tapi `ok:true` | `CRM_PASSCODE` kosong | Set env var tersebut |
| Pesanan baru bernomor acak seperti `TB-261030-07SM` | Sequence `order_number_seq` belum ada | Buka `/api/health` (membuat ulang sequence), atau jalankan `drizzle/0001_hardening.sql` |
| Halaman produk kosong padahal tabel ada | Seed belum jalan | Buka halaman utama atau `/api/health` sekali |
| Rate limit login tidak konsisten | Counter disimpan di memori per-instance | Wajar di serverless; gunakan passcode kuat |

---

## 5. Catatan khusus serverless

- **Pool koneksi**: di Vercel `max` pool otomatis `1` per lambda (Neon sudah
  memakai PgBouncer lewat host `-pooler`). Override dengan `PG_POOL_MAX`.
- **Migrasi & seed aman konkuren**: `ensureSchema()` memakai `pg_advisory_lock`
  sesi dan `runSeed()` memakai `pg_advisory_xact_lock`, jadi beberapa cold start
  bersamaan tidak mengeksekusi DDL paralel, tidak menggandakan data, dan tidak
  menabrak constraint `order_number`.
- **Instance warm tidak jadi buta**: cache skema hanya 30 detik, dan error
  Postgres `42P01` (relation does not exist) memicu bootstrap ulang + retry,
  sehingga aplikasi pulih sendiri kalau database di-reset.
- **Rate limit** login/subscribe disimpan di memori instance. Di serverless ini
  hanya lapisan tambahan — pertahanan utamanya tetap passcode kuat +
  `AUTH_SECRET`.
- **Gambar**: `next/image` memakai optimizer Vercel (AVIF/WebP). Kuota Hobby
  dibatasi 5.000 transformasi/bulan; dengan 10 foto produk ini jauh di bawah batas.
- **Preview deployment** memakai database yang sama kecuali Anda membuat branch
  database terpisah di Neon. Untuk data produksi, pertimbangkan Neon branching.
