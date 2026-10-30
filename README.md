# Tahura Boots Company — Storefront & CRM

Website penjualan sepatu boot kulit *hand-welted* asal Bandung, lengkap dengan
CRM internal untuk mengelola produk, pesanan, dan leads. Dibangun dengan
**Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Drizzle ORM**, dan
database **PostgreSQL (Neon)**.

```
Storefront  →  /            katalog, hero, craft, configurator, journal, kontak
CRM         →  /crm         dashboard omzet, pesanan, produk, leads
Kesehatan   →  /api/health  cek koneksi database (200 = ok)
```

---

## 1. Menjalankan secara lokal

Prasyarat: **Node.js 20+** dan sebuah database Postgres (Neon, Supabase, atau
Postgres lokal).

```bash
npm install

cp .env.example .env      # isi DATABASE_URL (dan DIRECT_URL)
npm run db:migrate        # buat tabel di database (pakai file di drizzle/)

npm run dev               # http://localhost:3000
```

Saat halaman pertama kali dibuka, tabel `products`, `orders`, `order_items`, dan
`leads` otomatis diisi data contoh (idempoten — hanya jalan kalau tabel produk
masih kosong). Selama pengembangan, folder `drizzle/` bisa dipakai dengan
`npm run db:push` alih-alih `db:migrate`.

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Connection string **pooled** (`...-pooler...`) yang dipakai aplikasi saat runtime. |
| `DIRECT_URL` | – | Connection string langsung tanpa pooler, dipakai `drizzle-kit` untuk DDL/migration. Kalau kosong, fallback ke `DATABASE_URL`. |
| `CRM_PASSCODE` | – | Passcode masuk `/crm`. Default pengembangan: `tahura2026`. **Ganti sebelum deploy.** |

---

## 2. Koneksi database (Neon)

Detail lengkap ada di [`docs/NEON-DATABASE.md`](docs/NEON-DATABASE.md).
Ringkasnya:

```bash
# 1. isi .env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 2. buat tabel
npm run db:migrate

# 3. cek koneksi aplikasi
curl http://localhost:3000/api/health     # {"ok":true}
```

Alternatif tanpa CLI: buka **Neon Console → SQL Editor**, tempel isi file
`drizzle/0000_*.sql`, lalu Run.

---

## 3. Struktur project

```
src/
├─ app/
│  ├─ page.tsx                 # storefront (server component, baca produk dari DB)
│  ├─ layout.tsx               # font lokal + metadata
│  ├─ crm/                     # dashboard CRM (login passcode, pesanan, produk, leads)
│  └─ api/
│     ├─ health/               # kesehatan koneksi DB
│     ├─ inquiries/            # form kontak → tabel leads
│     └─ crm/                  # REST untuk products, orders, leads, session
├─ components/
│  ├─ site/                    # section storefront (hero, collection, craft, …)
│  └─ crm/                     # komponen dashboard
├─ db/
│  ├─ index.ts                 # koneksi Drizzle + pool pg
│  ├─ schema.ts                # skema tabel
│  └─ seed.ts                  # data contoh + ensureSeed()
└─ lib/                        # auth, katalog, format, data situs
drizzle/                       # migration SQL (hasil drizzle-kit generate)
public/images/                 # foto produk & editorial
public/fonts/                  # Inter + Fraunces (woff2, lokal)
```

### Skema database

| Tabel | Isi |
| --- | --- |
| `products` | Katalog boot: slug, model, kulit, colorway, harga IDR, stok, status, ukuran. |
| `orders` | Pesanan: nomor, pelanggan, kanal, status, total. |
| `order_items` | Baris pesanan (FK ke `orders` dan `products`). |
| `leads` | Inquiry/CRM: kontak, minat produk, sumber, status, nilai estimasi. |

---

## 4. Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` / `start` | Build & jalankan versi produksi. |
| `npm run lint` / `typecheck` | ESLint & TypeScript. |
| `npm run db:generate` | Generate SQL migration baru setelah `schema.ts` diubah. |
| `npm run db:migrate` | Terapkan migration ke database. |
| `npm run db:push` | Sinkronkan skema langsung (prototyping). |
| `npm run db:studio` | Drizzle Studio (GUI database). |

---

## 5. Deploy

Cocok untuk Vercel/Netlify. Tambahkan `DATABASE_URL`, `DIRECT_URL`, dan
`CRM_PASSCODE` di environment variables hosting, lalu jalankan migration sekali
dari lokal (`npm run db:migrate`) atau lewat CI.

Font dan gambar disajikan dari repo sendiri (`public/`), jadi tidak butuh
koneksi ke Google Fonts atau CDN eksternal saat build.

---

## 6. Catatan keamanan

- Repo ini **public**: jangan pernah commit `.env` (sudah di-gitignore).
- `/crm` dilindungi passcode cookie sederhana (`CRM_PASSCODE`). Untuk produksi
  serius, ganti dengan auth sesi penuh (mis. NextAuth) — passcode bersama mudah
  ditebak dan tidak punya audit trail.
- Kredensial database yang pernah dibagikan lewat chat sebaiknya dirotasi di
  Neon Console → **Roles & Databases → Reset password**.
