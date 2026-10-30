// ─────────────────────────────────────────────────────────────────────
//  AUTO-GENERATED — jangan diedit manual.
//  Sumber: drizzle/bootstrap.sql
//  Regenerasi: node scripts/gen-bootstrap.mjs
//
//  Dipakai oleh src/db/ensure-schema.ts untuk membuat skema otomatis pada
//  deployment baru (idempotent: CREATE ... IF NOT EXISTS).
// ─────────────────────────────────────────────────────────────────────

export const BOOTSTRAP_STATEMENTS: readonly string[] = [
  "CREATE TABLE IF NOT EXISTS \"products\" (\n  \"id\" serial PRIMARY KEY NOT NULL,\n  \"slug\" varchar(140) NOT NULL,\n  \"name\" varchar(160) NOT NULL,\n  \"model\" varchar(100) NOT NULL,\n  \"leather\" varchar(140) NOT NULL,\n  \"colorway\" varchar(100) NOT NULL,\n  \"description\" text NOT NULL,\n  \"price_idr\" integer NOT NULL,\n  \"stock\" integer DEFAULT 0 NOT NULL,\n  \"status\" varchar(32) DEFAULT 'ready' NOT NULL,\n  \"image_url\" varchar(255) NOT NULL,\n  \"collection_name\" varchar(80) DEFAULT 'Core Line' NOT NULL,\n  \"sizes\" varchar(140) DEFAULT '39,40,41,42,43,44,45' NOT NULL,\n  \"featured\" boolean DEFAULT false NOT NULL,\n  \"units_sold\" integer DEFAULT 0 NOT NULL,\n  \"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n  CONSTRAINT \"products_slug_unique\" UNIQUE(\"slug\")\n)",
  "CREATE TABLE IF NOT EXISTS \"orders\" (\n  \"id\" serial PRIMARY KEY NOT NULL,\n  \"order_number\" varchar(40) NOT NULL,\n  \"customer_name\" varchar(160) NOT NULL,\n  \"customer_email\" varchar(180) NOT NULL,\n  \"customer_phone\" varchar(60) DEFAULT '' NOT NULL,\n  \"country\" varchar(90) DEFAULT 'Indonesia' NOT NULL,\n  \"city\" varchar(90) DEFAULT 'Bandung' NOT NULL,\n  \"channel\" varchar(32) DEFAULT 'web' NOT NULL,\n  \"status\" varchar(32) DEFAULT 'pending' NOT NULL,\n  \"total_idr\" integer DEFAULT 0 NOT NULL,\n  \"notes\" text DEFAULT '' NOT NULL,\n  \"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n  CONSTRAINT \"orders_order_number_unique\" UNIQUE(\"order_number\")\n)",
  "CREATE TABLE IF NOT EXISTS \"order_items\" (\n  \"id\" serial PRIMARY KEY NOT NULL,\n  \"order_id\" integer NOT NULL,\n  \"product_id\" integer,\n  \"product_name\" varchar(160) NOT NULL,\n  \"size\" varchar(16) DEFAULT '42' NOT NULL,\n  \"quantity\" integer DEFAULT 1 NOT NULL,\n  \"unit_price_idr\" integer DEFAULT 0 NOT NULL\n)",
  "CREATE TABLE IF NOT EXISTS \"leads\" (\n  \"id\" serial PRIMARY KEY NOT NULL,\n  \"name\" varchar(160) NOT NULL,\n  \"email\" varchar(180) NOT NULL,\n  \"phone\" varchar(60) DEFAULT '' NOT NULL,\n  \"country\" varchar(90) DEFAULT 'Indonesia' NOT NULL,\n  \"product_interest\" varchar(180) DEFAULT 'General enquiry' NOT NULL,\n  \"message\" text DEFAULT '' NOT NULL,\n  \"source\" varchar(40) DEFAULT 'contact' NOT NULL,\n  \"status\" varchar(32) DEFAULT 'new' NOT NULL,\n  \"value_idr\" integer DEFAULT 0 NOT NULL,\n  \"notes\" text DEFAULT '' NOT NULL,\n  \"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n)",
  "CREATE TABLE IF NOT EXISTS \"subscribers\" (\n  \"id\" serial PRIMARY KEY NOT NULL,\n  \"email\" varchar(180) NOT NULL,\n  \"source\" varchar(40) DEFAULT 'footer' NOT NULL,\n  \"interest\" varchar(180) DEFAULT '' NOT NULL,\n  \"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n)",
  "DO $$\nBEGIN\n  ALTER TABLE \"order_items\"\n    ADD CONSTRAINT \"order_items_order_id_orders_id_fk\"\n    FOREIGN KEY (\"order_id\") REFERENCES \"public\".\"orders\"(\"id\")\n    ON DELETE cascade ON UPDATE no action;\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\nEND $$",
  "DO $$\nBEGIN\n  ALTER TABLE \"order_items\"\n    ADD CONSTRAINT \"order_items_product_id_products_id_fk\"\n    FOREIGN KEY (\"product_id\") REFERENCES \"public\".\"products\"(\"id\")\n    ON DELETE set null ON UPDATE no action;\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\nEND $$",
  "CREATE UNIQUE INDEX IF NOT EXISTS \"subscribers_email_key\" ON \"subscribers\" USING btree (\"email\")",
  "CREATE INDEX IF NOT EXISTS \"subscribers_created_at_idx\" ON \"subscribers\" USING btree (\"created_at\")",
  "CREATE INDEX IF NOT EXISTS \"leads_status_idx\" ON \"leads\" USING btree (\"status\")",
  "CREATE INDEX IF NOT EXISTS \"leads_created_at_idx\" ON \"leads\" USING btree (\"created_at\")",
  "CREATE INDEX IF NOT EXISTS \"leads_source_idx\" ON \"leads\" USING btree (\"source\")",
  "CREATE INDEX IF NOT EXISTS \"order_items_order_id_idx\" ON \"order_items\" USING btree (\"order_id\")",
  "CREATE INDEX IF NOT EXISTS \"order_items_product_id_idx\" ON \"order_items\" USING btree (\"product_id\")",
  "CREATE INDEX IF NOT EXISTS \"orders_status_idx\" ON \"orders\" USING btree (\"status\")",
  "CREATE INDEX IF NOT EXISTS \"orders_created_at_idx\" ON \"orders\" USING btree (\"created_at\")",
  "CREATE INDEX IF NOT EXISTS \"orders_email_idx\" ON \"orders\" USING btree (\"customer_email\")",
  "CREATE INDEX IF NOT EXISTS \"products_status_idx\" ON \"products\" USING btree (\"status\")",
  "CREATE INDEX IF NOT EXISTS \"products_featured_idx\" ON \"products\" USING btree (\"featured\")",
  "CREATE INDEX IF NOT EXISTS \"products_collection_idx\" ON \"products\" USING btree (\"collection_name\")",
  "CREATE SEQUENCE IF NOT EXISTS \"order_number_seq\" START WITH 1001",
];

export const BOOTSTRAP_VERSION = "bootstrap-v1";
