import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Products are finished boots, made-to-order styles or archived styles.
 * `status` is the owner-controlled state; real availability also depends on
 * `stock` (a "ready" style with zero pairs on the shelf counts as sold out).
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  leather: varchar("leather", { length: 140 }).notNull(),
  colorway: varchar("colorway", { length: 100 }).notNull(),
  description: text("description").notNull(),
  priceIdr: integer("price_idr").notNull(),
  stock: integer("stock").notNull().default(0),
  status: varchar("status", { length: 32 }).notNull().default("ready"),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  collectionName: varchar("collection_name", { length: 80 })
    .notNull()
    .default("Core Line"),
  sizes: varchar("sizes", { length: 140 })
    .notNull()
    .default("39,40,41,42,43,44,45"),
  featured: boolean("featured").notNull().default(false),
  unitsSold: integer("units_sold").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerEmail: varchar("customer_email", { length: 180 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 60 }).notNull().default(""),
  country: varchar("country", { length: 90 }).notNull().default("Indonesia"),
  city: varchar("city", { length: 90 }).notNull().default("Bandung"),
  channel: varchar("channel", { length: 32 }).notNull().default("web"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  totalIdr: integer("total_idr").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: varchar("product_name", { length: 160 }).notNull(),
  size: varchar("size", { length: 16 }).notNull().default("42"),
  quantity: integer("quantity").notNull().default(1),
  unitPriceIdr: integer("unit_price_idr").notNull().default(0),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 60 }).notNull().default(""),
  country: varchar("country", { length: 90 }).notNull().default("Indonesia"),
  productInterest: varchar("product_interest", { length: 180 })
    .notNull()
    .default("General enquiry"),
  message: text("message").notNull().default(""),
  source: varchar("source", { length: 40 }).notNull().default("contact"),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  valueIdr: integer("value_idr").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Lead = typeof leads.$inferSelect;
