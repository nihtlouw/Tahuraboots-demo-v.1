import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { CHANNELS, resolveAvailability } from "@/lib/catalog";
import { nextOrderNumber } from "@/lib/orders";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

/** Batas wajar per baris supaya salah ketik tidak menguras shelf. */
const MAX_QUANTITY = 20;

type ItemPayload = {
  productId?: number | string;
  size?: string | number;
  quantity?: number | string;
};

type OrderPayload = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  country?: string;
  city?: string;
  channel?: string;
  notes?: string;
  items?: ItemPayload[];
};

type Line = { productId: number; size: string; quantity: number };

/**
 * Rapikan baris pesanan: buang yang kosong, gabungkan produk+ukuran yang sama,
 * dan jaga jumlahnya di rentang 1..MAX_QUANTITY.
 */
function normaliseLines(raw: ItemPayload[]): Line[] {
  const merged = new Map<string, Line>();

  for (const item of raw) {
    const productId = Number(item.productId);
    if (!Number.isFinite(productId)) continue;

    const size = String(item.size ?? "42").trim().slice(0, 8) || "42";
    const requested = Math.round(Number(item.quantity) || 1);
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, requested));
    const key = `${productId}:${size}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
    } else {
      merged.set(key, { productId, size, quantity });
    }
  }

  return [...merged.values()];
}

export async function POST(request: Request) {
  if (!(await isOwner())) return unauthorized();

  try {
    // Deployment baru: pastikan skema + data contoh siap sebelum menulis.
    await ensureSeed();
    const body = (await request.json()) as OrderPayload;
    const name = (body.customerName ?? "").trim();
    const email = (body.customerEmail ?? "").trim();

    if (!name || !email.includes("@")) {
      return Response.json(
        { ok: false, error: "Customer name and a valid email are required." },
        { status: 400 },
      );
    }

    const lines = normaliseLines(body.items ?? []);
    if (lines.length === 0) {
      return Response.json(
        { ok: false, error: "Add at least one pair to the order." },
        { status: 400 },
      );
    }

    const productIds = [...new Set(lines.map((line) => line.productId))];
    const found = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));
    const byId = new Map(found.map((product) => [product.id, product]));

    // Validasi ketersediaan SEBELUM menulis apa pun. Dulu pesanan 5 pasang
    // saat stok 2 tetap tersimpan: shelf mentok di 0, lalu pembatalannya
    // mengembalikan 5 pasang yang tidak pernah ada (stok hantu).
    for (const line of lines) {
      const product = byId.get(line.productId);

      if (!product) {
        return Response.json(
          { ok: false, error: "One of those pairs is no longer in the catalogue." },
          { status: 400 },
        );
      }

      const availability = resolveAvailability(product);

      if (availability === "archive") {
        return Response.json(
          { ok: false, error: `${product.name} is archived — it can't be ordered.` },
          { status: 409 },
        );
      }

      if (availability === "sold_out") {
        return Response.json(
          {
            ok: false,
            error: `${product.name} is sold out. Restock it or take a made-to-order build instead.`,
          },
          { status: 409 },
        );
      }

      if (availability === "ready" && line.quantity > product.stock) {
        return Response.json(
          {
            ok: false,
            error: `Only ${product.stock} × ${product.name} left on the shelf.`,
          },
          { status: 409 },
        );
      }
    }

    const items = lines.map((line) => {
      const product = byId.get(line.productId)!;
      return { product, size: line.size, quantity: line.quantity };
    });

    const total = items.reduce(
      (sum, item) => sum + item.product.priceIdr * item.quantity,
      0,
    );

    const channel = CHANNELS.includes(body.channel as (typeof CHANNELS)[number])
      ? (body.channel as string)
      : "web";

    const orderNumber = await nextOrderNumber();

    const created = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerName: name.slice(0, 160),
          customerEmail: email.slice(0, 180),
          customerPhone: (body.customerPhone ?? "").slice(0, 60),
          country: (body.country ?? "Indonesia").slice(0, 90),
          city: (body.city ?? "Bandung").slice(0, 90),
          channel,
          status: "pending",
          totalIdr: total,
          notes: (body.notes ?? "").slice(0, 2000),
        })
        .returning();

      if (!order) throw new Error("order insert failed");

      await tx.insert(orderItems).values(
        items.map((item) => ({
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          unitPriceIdr: item.product.priceIdr,
        })),
      );

      for (const item of items) {
        // Made-to-order tidak memakai shelf: hanya catat penjualannya.
        const takesShelf = resolveAvailability(item.product) === "ready";
        await tx
          .update(products)
          .set({
            ...(takesShelf
              ? { stock: sql`greatest(${products.stock} - ${item.quantity}, 0)` }
              : {}),
            unitsSold: sql`${products.unitsSold} + ${item.quantity}`,
          })
          .where(inArray(products.id, [item.product.id]));
      }

      return order;
    });

    return Response.json({
      ok: true,
      order: { id: created.id, orderNumber: created.orderNumber, totalIdr: total },
    });
  } catch (error) {
    // Jangan telan diam-diam: tanpa log, kegagalan di produksi tak bisa dilacak.
    console.error("[api] gagal menyimpan pesanan:", error);
    return Response.json(
      { ok: false, error: "Could not log the order." },
      { status: 500 },
    );
  }
}
