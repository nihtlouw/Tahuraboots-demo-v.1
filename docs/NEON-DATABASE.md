# Koneksi Database — Neon Postgres

## 1. Ringkasan

| Item | Nilai |
| --- | --- |
| Provider | Neon (Postgres serverless) |
| Region | `ap-southeast-1` (Singapore) |
| Database | `neondb` |
| User | `neondb_owner` |
| Host (pooled) | `ep-super-poetry-aztnujjm-pooler.c-3.ap-southeast-1.aws.neon.tech` |
| Host (direct) | `ep-super-poetry-aztnujjm.c-3.ap-southeast-1.aws.neon.tech` |
| Port | `5432` |
| SSL | wajib (`sslmode=require`) |
| ORM | Drizzle ORM (`drizzle-orm` + driver `pg`) |

Password **hanya** disimpan di `.env` lokal dan environment variables hosting.
Repo ini public — credential tidak pernah di-commit.

## 2. Format connection string

```ini
# Runtime aplikasi — lewat connection pooler Neon (cocok untuk serverless/Vercel)
DATABASE_URL="postgresql://neondb_owner:<PASSWORD>@ep-super-poetry-aztnujjm-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Tooling migration (drizzle-kit) — koneksi langsung tanpa pooler
DIRECT_URL="postgresql://neondb_owner:<PASSWORD>@ep-super-poetry-aztnujjm.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

> **Penting saat copy-paste**
> - Karakter `&` kadang berubah menjadi `&amp;` (HTML entity) kalau disalin dari
>   halaman web / WhatsApp. Di `.env` harus `&` biasa.
> - Parameter `channel_binding=require` tidak dikenali driver `pg`/Drizzle dan
>   bisa membuat koneksi gagal. Cukup pakai `sslmode=require`.
> - `DATABASE_URL` (pooled) dipakai aplikasi, `DIRECT_URL` dipakai migration.
>   Kalau `DIRECT_URL` kosong, `drizzle.config.ts` otomatis memakai
>   `DATABASE_URL`.

## 3. Membuat tabel di Neon

Skema sudah tersedia sebagai file SQL: `drizzle/0000_*.sql`.

**Opsi A — dari lokal (disarankan)**

```bash
npm run db:migrate        # menjalankan semua file di drizzle/
# atau, untuk prototyping:
npm run db:push           # drizzle-kit membandingkan schema.ts vs database
```

**Opsi B — Neon SQL Editor**

1. Buka <https://console.neon.tech> → pilih project → tab **SQL Editor**.
2. Buka `drizzle/0000_sleepy_valeria_richards.sql` di repo.
3. Hapus komentar `--> statement-breakpoint` (boleh tetap ada juga), lalu Run.

Setelah tabel ada, buka halaman utama aplikasi — data contoh akan terisi
otomatis lewat `ensureSeed()` di `src/db/seed.ts`.

**Opsi C — GitHub Actions**

Simpan `DATABASE_URL` di *Settings → Secrets and variables → Actions*, lalu
jalankan langkah berikut pada runner:

```yaml
- run: npm ci
- run: npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

Runner GitHub punya akses internet penuh, jadi bisa menjangkau Neon.

## 4. Verifikasi

```bash
curl http://localhost:3000/api/health    # {"ok":true} bila DB terhubung
npm run db:studio                        # GUI untuk melihat tabel & data
```

## 5. Deployment (Vercel / Netlify)

Tambahkan environment variable berikut:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | connection string **pooled** |
| `DIRECT_URL` | connection string **direct** |
| `CRM_PASSCODE` | passcode CRM produksi |

## 6. Keamanan

- Rotasi password Neon yang pernah dibagikan lewat chat:
  **Neon Console → Roles & Databases → `neondb_owner` → Reset password**.
- Setelah rotasi, perbarui `.env` lokal dan env var di hosting.
- Jangan commit `.env`. Gunakan `.env.example` sebagai template.
- Untuk produksi, batasi akses `/crm` (passcode bersama tidak punya audit trail).
