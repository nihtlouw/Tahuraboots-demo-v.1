# Tahura Boots Company — Storefront & CRM

Website penjualan sepatu boot kulit *hand-welted* asal Bandung, lengkap dengan
CRM internal untuk mengelola produk, pesanan, dan leads. Dibangun dengan
**Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Drizzle ORM**, dan
database **PostgreSQL (Neon)**.

```
Storefront  →  /            katalog, hero, craft, configurator, journal, kontak
CRM         →  /crm         dashboard omzet, pesanan, produk, leads
Kesehatan   →  /api/health  diagnosa deployment: koneksi, tabel, sequence, seed
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
| `AUTH_SECRET` | – | Kunci HMAC untuk cookie sesi (`openssl rand -base64 32`). Kalau kosong, diturunkan dari `CRM_PASSCODE`. |
| `NEXT_PUBLIC_SITE_URL` | – | URL publik untuk canonical, sitemap, dan structured data. |

---

## 2. Koneksi database (Neon)

Detail lengkap ada di [`documentation/NEON-DATABASE.md`](documentation/NEON-DATABASE.md).
Ringkasnya:

```bash
# 1. isi .env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 2. buat tabel
npm run db:migrate

# 3. cek koneksi aplikasi
curl http://localhost:3000/api/health     # {"ok":true,"ready":true,...}
```

Alternatif tanpa CLI:

- **Neon SQL Editor** — buka Neon Console → SQL Editor, tempel isi file
  `drizzle/0000_*.sql`, lalu Run.
- **GitHub Actions** — tambahkan secret `DATABASE_URL` & `DIRECT_URL` di
  *Settings → Secrets and variables → Actions*, lalu jalankan workflow
  **Database Migration (Neon)** dari tab Actions (butuh workflow ini sudah ada
  di branch default).

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

### Keamanan sesi CRM

`/crm` dilindungi cookie sesi bertanda tangan HMAC-SHA256 (`<expiry>.<nonce>.<sig>`),
divalidasi di tiga lapis:

1. **`src/proxy.ts`** (pengganti `middleware.ts` di Next 16) menolak request
   `/crm/*` tanpa sesi sah — halaman tidak pernah dieksekusi.
2. **`app/crm/layout.tsx`** menampilkan form login kalau belum masuk.
3. **Setiap page CRM** memanggil `isOwner()` sebelum query, sehingga data tidak
   ikut bocor di payload RSC sekalipun layout di-bypass.

Login dibatasi 8 percobaan / 10 menit per IP, dan passcode dibandingkan dengan
waktu konstan.

### Skema database

| Tabel | Isi |
| --- | --- |
| `products` | Katalog boot: slug, model, kulit, colorway, harga IDR, stok, status, ukuran. |
| `orders` | Pesanan: nomor, pelanggan, kanal, status, total. |
| `order_items` | Baris pesanan (FK ke `orders` dan `products`). |
| `leads` | Inquiry/CRM: kontak, minat produk, sumber, status, nilai estimasi. |
| `subscribers` | "The cutting list": email newsletter & waitlist produk (unik per email). |

Semua tabel punya index untuk kolom yang dipakai filter/sortir CRM (`status`,
`created_at`, `order_id`, dst.). Nomor pesanan memakai sequence
`order_number_seq` dengan format `TB-<YYMMDD>-<seq>`.

---

## 4. Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` / `start` | Build & jalankan versi produksi. |
| `npm run lint` / `typecheck` | ESLint & TypeScript. |
| `npm run db:generate` | Generate SQL migration baru setelah `schema.ts` diubah. |
| `npm run db:migrate` | Terapkan migration ke database. |
| — | `drizzle/bootstrap.sql` — versi idempotent untuk Neon SQL Editor. |
| `npm run db:push` | Sinkronkan skema langsung (prototyping). |
| `npm run db:studio` | Drizzle Studio (GUI database). |
| `npm run db:check` | Verifikasi koneksi + daftar tabel & jumlah baris. Exit code 1 kalau skema belum lengkap. |
| `npm run pages:build` | Rekam snapshot UI statis ke `docs/` untuk GitHub Pages (butuh server jalan di :3000). |

### Fitur CRM

- **Orders** — filter status, pencarian, sortir (tanggal/total/pelanggan),
  pagination 8 baris, pilih baris + ubah status massal, ekspor CSV.
- **Products** — pencarian, sortir stok/harga/terjual, ekspor CSV, tambah/edit/
  hapus, penyesuaian stok cepat.
- **Leads** — papan kanban per tahap, pencarian, ekspor CSV, ubah status dan
  catatan.
- **Dashboard** — omzet, pipeline, stok kritis, best seller, dan ringkasan
  "cutting list" (newsletter/waitlist).

Pembatalan atau penghapusan pesanan otomatis mengembalikan stok dan
`units_sold`, sehingga angka di storefront tetap konsisten.

---

## 5. Demo statis di GitHub Pages

GitHub Pages hanya melayani **file statis** — tidak bisa menjalankan Node, API
routes, atau koneksi Postgres. Karena itu repo ini memakai dua jalur:

| Kebutuhan | Tempat |
| --- | --- |
| Lihat tampilan UI tanpa server | GitHub Pages (snapshot statis di `docs/`) |
| Aplikasi fungsional (DB, form, CRM) | Vercel / Netlify / VPS + `DATABASE_URL` |

Snapshot dibuat dengan `scripts/build-pages-snapshot.mjs`: aplikasi dijalankan
sungguhan, lalu HTML hasil render + CSS + font + gambar direkam ke `docs/`.
Semua tautan bersifat **relatif**, jadi folder `docs/` bisa dilayani dari root,
dari `/docs/`, atau dari custom domain tanpa diubah.

### Sekali setel di GitHub

**Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch `main` + Folder `/docs` → Save.**

Selesai. URL: `https://<user>.github.io/<repo>/`

> Alternatif tanpa mengubah setting: biarkan Source di **`/` (root)**. File
> `index.html` di root akan mengarahkan pengunjung ke `./docs/`, dan `.nojekyll`
> di root mematikan Jekyll agar folder `_next` tidak dibuang.

Snapshot bersifat read-only: tombol, filter, dan formulir tidak aktif — ada
banner kecil di kiri bawah yang menjelaskan hal itu. Isi CRM direkam setelah
login, jadi dashboard terlihat meski tanpa sesi.

Membuat ulang snapshot setelah UI berubah:

```bash
npm run build
npx next start -p 3000        # terminal lain
npm run pages:build           # menulis ulang docs/
```

Env opsional: `SNAPSHOT_BASE_URL` (default `http://127.0.0.1:3000`),
`SNAPSHOT_BASE_PATH` (hanya untuk tautan di `404.html`), `CRM_PASSCODE`.

---

## 6. Deploy

Panduan lengkap Vercel + Neon: [`documentation/DEPLOY-VERCEL.md`](documentation/DEPLOY-VERCEL.md).

Ringkasnya — set environment variables berikut di hosting:

| Key | Wajib | Catatan |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | connection string **pooled** (`-pooler`) |
| `DIRECT_URL` | – | hanya untuk `drizzle-kit` |
| `CRM_PASSCODE` | ✅ | **tanpa ini login CRM ditolak di production** |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | – | canonical/sitemap |

Lalu terapkan skema (pilih satu): tempel `drizzle/bootstrap.sql` di Neon SQL
Editor, jalankan `npm run db:migrate`, atau pakai workflow GitHub Actions.

Terakhir buka **`/api/health`** — endpoint ini melaporkan koneksi, tabel,
sequence, jumlah baris, dan konfigurasi yang masih kurang. `ok:true` +
`ready:true` berarti siap dipakai.

Font dan gambar disajikan dari repo sendiri (`public/`), jadi tidak butuh
koneksi ke Google Fonts atau CDN eksternal saat build.

---

## 7. Catatan keamanan

- Repo ini **public**: jangan pernah commit `.env` (sudah di-gitignore).
- `/crm` dilindungi passcode cookie sederhana (`CRM_PASSCODE`). Untuk produksi
  serius, ganti dengan auth sesi penuh (mis. NextAuth) — passcode bersama mudah
  ditebak dan tidak punya audit trail.
- Kredensial database yang pernah dibagikan lewat chat sebaiknya dirotasi di
  Neon Console → **Roles & Databases → Reset password**.
