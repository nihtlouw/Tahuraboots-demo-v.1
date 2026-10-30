-- ─────────────────────────────────────────────────────────────────────
--  Tahura Boots — bootstrap database (idempotent)
--
--  Tempel SELURUH isi file ini ke Neon Console → SQL Editor → Run.
--  Aman dijalankan berulang kali: semua objek memakai IF NOT EXISTS,
--  dan constraint dibungkus penanganan duplicate_object.
--
--  Isinya gabungan dari:
--    drizzle/0000_sleepy_valeria_richards.sql
--    drizzle/0001_hardening.sql
--
--  PENTING: kalau memakai file ini, JANGAN jalankan `npm run db:migrate`
--  setelahnya (drizzle akan mencoba membuat ulang tabel yang sudah ada).
--  Pilih salah satu jalur saja.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(140) NOT NULL,
  "name" varchar(160) NOT NULL,
  "model" varchar(100) NOT NULL,
  "leather" varchar(140) NOT NULL,
  "colorway" varchar(100) NOT NULL,
  "description" text NOT NULL,
  "price_idr" integer NOT NULL,
  "stock" integer DEFAULT 0 NOT NULL,
  "status" varchar(32) DEFAULT 'ready' NOT NULL,
  "image_url" varchar(255) NOT NULL,
  "collection_name" varchar(80) DEFAULT 'Core Line' NOT NULL,
  "sizes" varchar(140) DEFAULT '39,40,41,42,43,44,45' NOT NULL,
  "featured" boolean DEFAULT false NOT NULL,
  "units_sold" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "products_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_number" varchar(40) NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "customer_email" varchar(180) NOT NULL,
  "customer_phone" varchar(60) DEFAULT '' NOT NULL,
  "country" varchar(90) DEFAULT 'Indonesia' NOT NULL,
  "city" varchar(90) DEFAULT 'Bandung' NOT NULL,
  "channel" varchar(32) DEFAULT 'web' NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "total_idr" integer DEFAULT 0 NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "product_id" integer,
  "product_name" varchar(160) NOT NULL,
  "size" varchar(16) DEFAULT '42' NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_price_idr" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "email" varchar(180) NOT NULL,
  "phone" varchar(60) DEFAULT '' NOT NULL,
  "country" varchar(90) DEFAULT 'Indonesia' NOT NULL,
  "product_interest" varchar(180) DEFAULT 'General enquiry' NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "source" varchar(40) DEFAULT 'contact' NOT NULL,
  "status" varchar(32) DEFAULT 'new' NOT NULL,
  "value_idr" integer DEFAULT 0 NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscribers" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(180) NOT NULL,
  "source" varchar(40) DEFAULT 'footer' NOT NULL,
  "interest" varchar(180) DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── Foreign keys (order_items → orders / products) ───────────────────
DO $$
BEGIN
  ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_order_id_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Index (migration 0001) ────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_key" ON "subscribers" USING btree ("email");
CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "leads_source_idx" ON "leads" USING btree ("source");

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx" ON "order_items" USING btree ("product_id");

CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "orders_email_idx" ON "orders" USING btree ("customer_email");

CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" USING btree ("status");
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products" USING btree ("featured");
CREATE INDEX IF NOT EXISTS "products_collection_idx" ON "products" USING btree ("collection_name");

-- ── Sequence nomor pesanan (format TB-YYMMDD-####) ────────────────────
CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START WITH 1001;

-- ── Verifikasi ────────────────────────────────────────────────────────
-- Setelah Run, jalankan query ini untuk memastikan semuanya ada:
--
--   select table_name from information_schema.tables
--    where table_schema = 'public' order by 1;
--
--   select sequencename from pg_sequences where schemaname = 'public';
--
-- Harus muncul: leads, order_items, orders, products, subscribers
-- dan sequence order_number_seq (plus *_id_seq bawaan serial).
