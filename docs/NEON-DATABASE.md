# Koneksi Database — Neon Postgres

## 1. Ringkasan

| Item | Nilai |
| --- | --- |
| Provider | Neon (Postgres serverless) |
| Region | `ap-southeast-1` (Singapore) |
| Database | `neondb` |
| User | `neondb_owner` |
| Host (pooled) | `ep-super-poetry-aztnujjm-pooler.c-3.ap-southeast-1.aws.neon.tech` |
| Port | `5432` |
| SSL | wajib (`sslmode=require`) |

Nilai lengkap (termasuk password) **hanya** disimpan di `.env` / `.env.local`
yang sudah masuk `.gitignore`. Repo ini **public**, jadi credential tidak boleh
pernah ikut di-commit.

## 2. Format connection string

```ini
# Dipakai aplikasi (serverless-friendly, lewat connection pooler Neon)
DATABASE_URL="postgresql://neondb_owner:<PASSWORD>@ep-super-poetry-aztnujjm-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Dipakai tooling migration (Prisma migrate / drizzle-kit / psql)
# Host tanpa "-pooler":
DIRECT_URL="postgresql://neondb_owner:<PASSWORD>@ep-super-poetry-aztnujjm.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

> **Catatan `${...}` vs `&amp;`**
> Kalau connection string di-copy dari dashboard Neon / WhatsApp / halaman web,
> karakter `&` sering berubah jadi `&amp;` (HTML entity). Di dalam `.env` harus
> ditulis `&` biasa. Kalau pakai `channel_binding=require`, sebagian driver Node
> (`pg`, Prisma, Drizzle) tidak mendukungnya — lebih aman pakai `sslmode=require`
> saja. Untuk `psql`/libpq keduanya aman.

## 3. Setup lokal

```bash
cp .env.example .env        # lalu isi DATABASE_URL & DIRECT_URL
npm install                 # sesuai stack project
```

Prisma (`schema.prisma`):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Drizzle (`drizzle.config.ts`):

```ts
export default defineConfig({
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL! },
});
```

node-postgres (`pg`):

```ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon: sslmode=require
});
```

## 4. Menerapkan skema ke Neon

Karena sandbox agen tidak punya akses keluar ke host Neon, eksekusi migration
dilakukan dari mesin Anda sendiri atau lewat Neon SQL Editor:

**Opsi A — dari lokal (paling praktis)**

```bash
npx prisma migrate deploy     # Prisma
# atau
npx drizzle-kit push          # Drizzle
# atau
psql "$DIRECT_URL" -f migrations/0001_init.sql
```

**Opsi B — Neon SQL Editor**

Buka <https://console.neon.tech> → project `neondb` → **SQL Editor** → paste isi
file `migrations/*.sql` → Run.

**Opsi C — GitHub Actions (otomatis)**

Simpan `DATABASE_URL` di *Settings → Secrets and variables → Actions*, lalu
jalankan workflow migration pada runner GitHub (runner punya akses internet
penuh, berbeda dengan sandbox agen).

## 5. Deployment (Vercel / Netlify / dsb.)

Tambahkan environment variable berikut di dashboard hosting:

- `DATABASE_URL` → pooled connection string
- `DIRECT_URL` → direct connection string (kalau tooling butuh)

## 6. Keamanan

- Password Neon yang pernah dikirim lewat chat sebaiknya **dirotasi**:
  Neon Console → **Roles & Databases** → `neondb_owner` → *Reset password*.
- Setelah rotasi, cukup perbarui `.env` lokal dan env var di hosting.
- Jangan pernah commit `.env`; gunakan `.env.example` sebagai template.
