import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { formatIdr } from "@/lib/format";
import { CrmHeader, StatCard } from "@/components/crm/ui";
import {
  OrdersManager,
  type CrmOrder,
  type ProductOption,
} from "@/components/crm/orders-manager";

export const dynamic = "force-dynamic";

export default async function CrmOrdersPage() {
  await ensureSeed();

  const [orderRows, itemRows, productRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db
      .select({
        id: products.id,
        name: products.name,
        priceIdr: products.priceIdr,
        stock: products.stock,
        sizes: products.sizes,
        status: products.status,
      })
      .from(products)
      .orderBy(products.name),
  ]);

  const itemsByOrder = new Map<number, CrmOrder["items"]>();
  for (const item of itemRows) {
    const bucket = itemsByOrder.get(item.orderId) ?? [];
    bucket.push({
      id: item.id,
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
      unitPriceIdr: item.unitPriceIdr,
    });
    itemsByOrder.set(item.orderId, bucket);
  }

  const initial: CrmOrder[] = orderRows.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    country: order.country,
    city: order.city,
    channel: order.channel,
    status: order.status,
    totalIdr: order.totalIdr,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: itemsByOrder.get(order.id) ?? [],
  }));

  const productOptions: ProductOption[] = productRows.map((product) => ({
    id: product.id,
    name: product.name,
    priceIdr: product.priceIdr,
    stock: product.stock,
    sizes: product.sizes,
    status: product.status,
  }));

  const paid = orderRows.filter((order) =>
    ["paid", "in_production", "shipped", "delivered"].includes(order.status),
  );
  const revenue = paid.reduce((sum, order) => sum + order.totalIdr, 0);
  const awaiting = orderRows.filter((order) =>
    ["pending", "paid"].includes(order.status),
  ).length;
  const production = orderRows.filter(
    (order) => order.status === "in_production",
  ).length;
  const delivered = orderRows.filter(
    (order) => order.status === "delivered",
  ).length;
  const units = orderRows.reduce(
    (sum, order) => sum + (itemsByOrder.get(order.id)?.reduce((inner, item) => inner + item.quantity, 0) ?? 0),
    0,
  );

  const [{ value: uniqueCustomers }] = await db
    .select({ value: sql<number>`count(distinct ${orders.customerEmail})::int` })
    .from(orders);

  return (
    <div className="space-y-6">
      <CrmHeader
        eyebrow="Orders & fulfilment"
        title="Every pair leaving the bench"
        description="Log a sale, move an order through production, and keep the collector updated. Stock on ready pairs is reduced automatically when an order is logged."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected revenue" value={formatIdr(revenue)} detail={`${paid.length} paid orders`} icon={<span className="text-sm">◉</span>} />
        <StatCard label="Awaiting fulfilment" value={String(awaiting)} detail="Pending payment or packing" icon={<span className="text-sm">❐</span>} />
        <StatCard label="In production" value={String(production)} detail={`${delivered} delivered all-time`} icon={<span className="text-sm">✦</span>} />
        <StatCard label="Pairs sold" value={String(units)} detail={`${uniqueCustomers} collectors served`} icon={<span className="text-sm">◈</span>} />
      </div>

      <OrdersManager initial={initial} productOptions={productOptions} />
    </div>
  );
}
