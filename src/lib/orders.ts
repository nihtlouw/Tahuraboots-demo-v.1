import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Db = typeof db | Tx;

/**
 * Kembalikan stok & `unitsSold` untuk sebuah pesanan.
 *
 * Dipakai saat pesanan dibatalkan atau dihapus, supaya angka stok di storefront
 * tidak "bocor" turun permanen. Aman dipanggil berulang: pemanggil yang
 * memastikan transisi status (mis. hanya dari status aktif → cancelled).
 */
export async function restoreOrderStock(tx: Db, orderId: number) {
  const items = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const totals = new Map<number, number>();
  for (const item of items) {
    if (item.productId == null) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, quantity] of totals) {
    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${quantity}`,
        unitsSold: sql`greatest(${products.unitsSold} - ${quantity}, 0)`,
      })
      .where(eq(products.id, productId));
  }
}

/** Kesalahan stok yang bisa ditampilkan apa adanya ke pemilik studio. */
export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

/**
 * Potong stok untuk pesanan yang diaktifkan kembali (mis. `cancelled → paid`).
 *
 * Kebalikan dari `restoreOrderStock`: dipakai saat status kembali ke status
 * yang memegang stok. Stok dicek lebih dulu supaya pesanan tidak pernah
 * membuat shelf menjadi negatif — dulu transisi ini tidak menyentuh stok sama
 * sekali sehingga angka di storefront dan ledger bisa berbeda.
 */
export async function takeOrderStock(tx: Db, orderId: number) {
  const items = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const totals = new Map<number, number>();
  for (const item of items) {
    if (item.productId == null) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, quantity] of totals) {
    const [product] = await tx
      .select({ name: products.name, stock: products.stock, status: products.status })
      .from(products)
      .where(eq(products.id, productId));

    // Produk sudah dihapus dari katalog: lewati, riwayat pesanan tetap utuh.
    if (!product) continue;
    // Made to order tidak memakai shelf.
    if (product.status === "made_to_order") continue;

    if (product.stock < quantity) {
      throw new StockError(
        `Only ${product.stock} × ${product.name} left on the shelf — this order needs ${quantity}.`,
      );
    }

    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        unitsSold: sql`${products.unitsSold} + ${quantity}`,
      })
      .where(eq(products.id, productId));
  }
}

/** Status yang dianggap masih "memegang" stok. */
export const STOCK_HOLDING_STATUSES = [
  "pending",
  "paid",
  "in_production",
  "shipped",
  "delivered",
] as const;

export async function getOrdersByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
    })
    .from(orders)
    .where(inArray(orders.id, ids));
}

export async function setOrderStatus(id: number, status: string, notes?: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id));

    if (!current) return null;

    const wasHolding = STOCK_HOLDING_STATUSES.includes(
      current.status as (typeof STOCK_HOLDING_STATUSES)[number],
    );
    const willHold = STOCK_HOLDING_STATUSES.includes(
      status as (typeof STOCK_HOLDING_STATUSES)[number],
    );

    // Aktif → cancelled: kembalikan stok ke shelf.
    if (wasHolding && !willHold) {
      await restoreOrderStock(tx, id);
    }

    // Cancelled → aktif lagi: ambil stok kembali (dan gagal jelas kalau shelf
    // sudah tidak cukup, bukan diam-diam membuat stok negatif).
    if (!wasHolding && willHold) {
      await takeOrderStock(tx, id);
    }

    const [updated] = await tx
      .update(orders)
      .set({
        status,
        ...(notes !== undefined ? { notes: notes.slice(0, 2000) } : {}),
      })
      .where(eq(orders.id, id))
      .returning();

    return updated ?? null;
  });
}

export async function deleteOrder(id: number) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id));

    if (!current) return false;

    const wasHolding = STOCK_HOLDING_STATUSES.includes(
      current.status as (typeof STOCK_HOLDING_STATUSES)[number],
    );
    if (wasHolding) await restoreOrderStock(tx, id);

    await tx.delete(orders).where(and(eq(orders.id, id)));
    return true;
  });
}

/**
 * Nomor pesanan berurutan: `TB-<YYMMDD>-<seq>`.
 *
 * Sebelumnya memakai 6 digit terakhir `Date.now()` yang berulang setiap
 * ~16 menit sehingga bisa melanggar constraint UNIQUE (pesanan gagal dibuat).
 */
export async function nextOrderNumber() {
  try {
    const result = (await db.execute(
      sql`select to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') as stamp,
                 nextval('order_number_seq') as seq`,
    )) as unknown as { rows: { stamp: string; seq: string }[] };

    const row = result.rows?.[0];
    const stamp = row?.stamp ?? "000000";
    const seq = Number(row?.seq ?? 0);
    return `TB-${stamp}-${String(seq).padStart(4, "0")}`;
  } catch (error) {
    // Sequence berasal dari migration 0001. Kalau belum diterapkan, jangan
    // sampai pembuatan pesanan gagal total — pakai nomor acak yang tetap unik.
    console.error(
      "[orders] order_number_seq belum ada (jalankan migration 0001), memakai fallback:",
      error instanceof Error ? error.message : error,
    );
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const stamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TB-${stamp}-${suffix}`;
  }
}
