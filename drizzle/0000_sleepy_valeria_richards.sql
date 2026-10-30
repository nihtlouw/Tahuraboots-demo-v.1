CREATE TABLE "leads" (
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
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"product_name" varchar(160) NOT NULL,
	"size" varchar(16) DEFAULT '42' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_idr" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
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
--> statement-breakpoint
CREATE TABLE "products" (
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
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;