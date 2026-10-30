import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { CHANNELS } from "@/lib/catalog";
import { nextOrderNumber } from "@/lib/orders";

export const dynamic = "force-dynamic";

type ItemPayload = {
  productId?: number | string;
  size?: string;
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

export async function POST(request: Request) {
  if (!(await isOwner())) return unauthorized();

  try {
    const body = (await request.json()) as OrderPayload;
    const name = (body.customerName ?? "").trim();
    const email = (body.customerEmail ?? "").trim();

    if (!name || !email.includes("@")) {
      return Response.json(
        { ok: false, error: "Customer name and a valid email are required." },
        { status: 400 },
      );
    }

    const rawItems = (body.items ?? []).filter(
      (item) => item.productId !== undefined && item.productId !== "",
    );

    if (rawItems.length === 0) {
      return Response.json(
        { ok: false, error: "Add at least one pair to the order." },
        { status: 400 },
      );
    }

    const productIds = rawItems
      .map((item) => Number(item.productId))
      .filter((id) => Number.isFinite(id));

    const found = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const byId = new Map(found.map((product) => [product.id, product]));

    const items = rawItems
      .map((item) => {
        const product = byId.get(Number(item.productId));
        if (!product) return null;
        const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
        return {
          product,
          size: (item.size ?? "42").slice(0, 8),
          quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
      return Response.json(
        { ok: false, error: "Those pairs are no longer in the catalogue." },
        { status: 400 },
      );
    }

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
        await tx
          .update(products)
          .set({
            stock: sql`greatest(${products.stock} - ${item.quantity}, 0)`,
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
  } catch {
    return Response.json(
      { ok: false, error: "Could not log the order." },
      { status: 500 },
    );
  }
}
