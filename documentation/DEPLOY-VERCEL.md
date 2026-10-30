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

> Jangan tambahkan `channel_binding=require` pada connection string — driver
> `pg` tidak mendukungnya. Cukup `sslmode=require`.

Setelah menambah/mengubah env var, **Redeploy** agar berlaku.

---

## 2. Terapkan skema ke Neon

Pilih **salah satu** (jangan dicampur):

**A. Neon SQL Editor — paling cepat, tanpa terminal**

1. Buka <https://console.neon.tech> → project → **SQL Editor**.
2. Copy seluruh isi [`drizzle/bootstrap.sql`](../drizzle/bootstrap.sql).
3. **Run**. File ini idempotent, aman dijalankan berkali-kali.

**B. Dari mesin lokal**

```bash
cp .env.example .env      # isi DATABASE_URL & DIRECT_URL
npm install
npm run db:migrate        # menerapkan drizzle/0000 + 0001
npm run db:check          # daftar tabel + jumlah baris
```

**C. GitHub Actions**

`.github/workflows/db-migrate.yml` → isi secret `DATABASE_URL` & `DIRECT_URL`
di *Settings → Secrets and variables → Actions*, lalu **Run workflow**.

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
    { "name": "tables",     "ok": true, "detail": "5/5 tabel tersedia" },
    { "name": "sequences",  "ok": true, "detail": "order_number_seq siap" },
    { "name": "seed",       "ok": true, "detail": "produk=8 pesanan=15 leads=8" }
  ]
}
```

Arti field:

- **`ok`** → fungsi inti (koneksi, tabel, sequence, seed). Kalau `false`, HTTP 503.
- **`ready`** → `ok` **dan** `CRM_PASSCODE` sudah di-set, artinya CRM bisa dipakai.
- **`warnings`** → masalah konfigurasi yang tidak mematikan aplikasi.
- **`hints`** → langkah perbaikan yang spesifik.

Setelah health hijau, buka halaman utama sekali. Data contoh (8 produk, 15
pesanan, 8 leads) terisi otomatis lewat `ensureSeed()`.

---

## 4. Troubleshooting

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| Homepage 500, `/api/health` 503 dengan `tables: belum ada …` | Migration belum dijalankan | Jalankan `drizzle/bootstrap.sql` (opsi 2A) |
| `connection: connection refused / timeout` | `DATABASE_URL` salah atau host tidak ber-`-pooler` | Salin ulang connection string dari Neon, pastikan ada `-pooler` dan `sslmode=require` |
| Login CRM selalu "passcode does not match" | `CRM_PASSCODE` belum di-set (production menolak passcode default) | Set `CRM_PASSCODE`, lalu Redeploy |
| Login berhasil tapi langsung logout / sesi tidak konsisten | `AUTH_SECRET` kosong sehingga kunci acak per-instance | Set `AUTH_SECRET` tetap, Redeploy |
| Health `ready:false` tapi `ok:true` | `CRM_PASSCODE` kosong | Set env var tersebut |
| Pesanan baru bernomor acak seperti `TB-261030-07SM` | Sequence `order_number_seq` belum ada | Jalankan `drizzle/0001_hardening.sql` |
| Halaman produk kosong padahal tabel ada | Seed belum jalan | Buka halaman utama sekali |
| Rate limit login tidak konsisten | Counter disimpan di memori per-instance | Wajar di serverless; gunakan passcode kuat |

---

## 5. Catatan khusus serverless

- **Pool koneksi**: di Vercel `max` pool otomatis `1` per lambda (Neon sudah
  memakai PgBouncer lewat host `-pooler`). Override dengan `PG_POOL_MAX`.
- **Seeding aman konkuren**: `ensureSeed()` memakai
  `pg_advisory_xact_lock`, jadi beberapa cold start bersamaan tidak
  menggandakan data atau menabrak constraint `order_number`.
- **Rate limit** login/subscribe disimpan di memori instance. Di serverless ini
  hanya lapisan tambahan — pertahanan utamanya tetap passcode kuat +
  `AUTH_SECRET`.
- **Gambar**: `next/image` memakai optimizer Vercel (AVIF/WebP). Kuota Hobby
  dibatasi 5.000 transformasi/bulan; dengan 10 foto produk ini jauh di bawah batas.
- **Preview deployment** memakai database yang sama kecuali Anda membuat branch
  database terpisah di Neon. Untuk data produksi, pertimbangkan Neon branching.
