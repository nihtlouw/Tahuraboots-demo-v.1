import type { Metadata } from "next";
import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, orderItems, orders, products, subscribers } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { isOwner } from "@/lib/auth";
import { resolveAvailability } from "@/lib/catalog";
import { formatIdr, formatIdrCompact, formatShortDate, timeAgo } from "@/lib/format";
import {
  Avatar,
  ChannelBadge,
  CrmHeader,
  OrderPill,
  Panel,
  StatCard,
} from "@/components/crm/ui";

export const runtime = "nodejs";

export const metadata: Metadata = { title: "Overview" };

export const dynamic = "force-dynamic";

const PAID_STATES = ["paid", "in_production", "shipped", "delivered"];
const OPEN_LEAD_STATES = ["new", "contacted", "quoted"];

function weeklySeries(
  rows: { createdAt: Date; totalIdr: number; status: string }[],
) {
  const weeks: { label: string; value: number; orders: number }[] = [];
  const now = new Date();
  for (let index = 7; index >= 0; index -= 1) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - index * 7 - 6);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const bucket = rows.filter((row) => {
      const created = new Date(row.createdAt);
      return created >= start && created < end && PAID_STATES.includes(row.status);
    });

    weeks.push({
      label: formatShortDate(start),
      value: bucket.reduce((sum, row) => sum + row.totalIdr, 0),
      orders: bucket.length,
    });
  }
  return weeks;
}

/** Berapa baris dengan status tertentu yang lebih tua dari `days` hari. */
function staleCount(
  rows: { status: string; createdAt: Date }[],
  status: string,
  days: number,
) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter(
    (row) => row.status === status && new Date(row.createdAt).getTime() < cutoff,
  ).length;
}

export default async function CrmOverviewPage() {
  // Lapisan kedua: layout sudah menyembunyikan UI, tapi tanpa guard ini
  // komponen halaman tetap dieksekusi dan datanya bocor di payload RSC.
  if (!(await isOwner())) return null;

  await ensureSeed();

  const [
    orderRows,
    productRows,
    leadRows,
    recentOrders,
    topProducts,
    subscriberRows,
    recentSubscribers,
  ] = await Promise.all([
      db
        .select({
          id: orders.id,
          totalIdr: orders.totalIdr,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders),
      db.select().from(products).orderBy(products.stock),
      db.select().from(leads).orderBy(desc(leads.createdAt)),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
      db
        .select({
          name: orderItems.productName,
          units: sql<number>`sum(${orderItems.quantity})::int`,
          revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceIdr})::int`,
        })
        .from(orderItems)
        .groupBy(orderItems.productName)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(5),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(subscribers),
      db
        .select({
          id: subscribers.id,
          email: subscribers.email,
          source: subscribers.source,
          interest: subscribers.interest,
          createdAt: subscribers.createdAt,
        })
        .from(subscribers)
        .orderBy(desc(subscribers.createdAt))
        .limit(6),
    ]);

  const revenue = orderRows
    .filter((row) => PAID_STATES.includes(row.status))
    .reduce((sum, row) => sum + row.totalIdr, 0);
  const paidOrders = orderRows.filter((row) =>
    PAID_STATES.includes(row.status),
  );
  const openOrders = orderRows.filter((row) =>
    ["pending", "paid", "in_production"].includes(row.status),
  );
  const pipelineValue = orderRows
    .filter((row) => ["pending", "paid", "in_production"].includes(row.status))
    .reduce((sum, row) => sum + row.totalIdr, 0);
  const unitsInStock = productRows
    .filter((product) => product.status !== "archive")
    .reduce((sum, product) => sum + product.stock, 0);
  const stockValue = productRows.reduce(
    (sum, product) => sum + product.stock * product.priceIdr,
    0,
  );
  const soldOut = productRows.filter(
    (product) => resolveAvailability(product) === "sold_out",
  );
  const lowStock = productRows.filter(
    (product) =>
      product.status === "ready" && product.stock > 0 && product.stock <= 2,
  );
  const openLeads = leadRows.filter((lead) =>
    OPEN_LEAD_STATES.includes(lead.status),
  );
  const wonLeads = leadRows.filter((lead) => lead.status === "won");
  const conversion = leadRows.length
    ? Math.round((wonLeads.length / leadRows.length) * 100)
    : 0;
  const weeks = weeklySeries(orderRows);
  const peak = Math.max(...weeks.map((week) => week.value), 1);

  // Delta nyata minggu ini vs minggu sebelumnya. Sebelumnya angka "+12.4%"
  // ditulis mati di kode, jadi kartu revenue selalu tampak tumbuh.
  const currentWeek = weeks[weeks.length - 1];
  const previousWeek = weeks[weeks.length - 2];
  const weekDelta =
    previousWeek && previousWeek.value > 0
      ? Math.round(((currentWeek.value - previousWeek.value) / previousWeek.value) * 1000) / 10
      : null;

  const stalePending = staleCount(orderRows, "pending", 3);
  const staleLeads = staleCount(leadRows, "new", 7);

  const attention = [
    soldOut.length > 0 && {
      key: "sold-out",
      label: `${soldOut.length} style${soldOut.length === 1 ? "" : "s"} sold out`,
      detail: soldOut.map((product) => product.name).join(", "),
      href: "/crm/products",
      cta: "Restock",
      tone: "bg-[#f1dedb] text-[#88423a]",
    },
    lowStock.length > 0 && {
      key: "low-stock",
      label: `${lowStock.length} style${lowStock.length === 1 ? "" : "s"} running low`,
      detail: lowStock.map((product) => `${product.name} (${product.stock})`).join(", "),
      href: "/crm/products",
      cta: "Open inventory",
      tone: "bg-[#f6e7c8] text-[#7a5a17]",
    },
    stalePending > 0 && {
      key: "pending",
      label: `${stalePending} payment${stalePending === 1 ? "" : "s"} pending over 3 days`,
      detail: "Chase the customer or cancel the order to release the stock.",
      href: "/crm/orders",
      cta: "Open orders",
      tone: "bg-[#e8e1f0] text-[#5a4276]",
    },
    staleLeads > 0 && {
      key: "leads",
      label: `${staleLeads} new enquir${staleLeads === 1 ? "y" : "ies"} untouched for a week`,
      detail: "Reply before the pair goes cold.",
      href: "/crm/leads",
      cta: "Open board",
      tone: "bg-[#e3e9f0] text-[#365269]",
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    detail: string;
    href: string;
    cta: string;
    tone: string;
  }[];
  const averageOrder = paidOrders.length
    ? Math.round(revenue / paidOrders.length)
    : 0;
  const maxUnits = Math.max(...topProducts.map((row) => row.units), 1);

  const pipeline = [
    { key: "new", label: "New enquiries", count: leadRows.filter((lead) => lead.status === "new").length, color: "#c9a56a" },
    { key: "contacted", label: "In conversation", count: leadRows.filter((lead) => lead.status === "contacted").length, color: "#6d8da3" },
    { key: "quoted", label: "Quoted", count: leadRows.filter((lead) => lead.status === "quoted").length, color: "#9a6fa1" },
    { key: "won", label: "Converted", count: wonLeads.length, color: "#6f8f5f" },
  ];

  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <CrmHeader
        eyebrow={`${weekday} · Bandung studio`}
        title="Studio overview"
        description="Every pair on the shelf, every order leaving the bench and every collector in the pipeline — updated live from the storefront."
        actions={
          <>
            <Link
              href="/crm/orders"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-3"
            >
              + Log an order
            </Link>
            <Link
              href="/crm/products"
              className="inline-flex items-center gap-2 rounded-lg border border-crm-line bg-white px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#5f5548] transition-colors hover:border-[#c6b699]"
            >
              Manage stock
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Revenue in the ledger"
          value={formatIdr(revenue)}
          detail={`${paidOrders.length} paid orders`}
          trend={
            weekDelta === null
              ? undefined
              : {
                  value: `${Math.abs(weekDelta).toFixed(1)}% WoW`,
                  positive: weekDelta >= 0,
                }
          }
          icon={<span className="text-sm">◉</span>}
        />
        <StatCard
          label="Orders in motion"
          value={String(openOrders.length)}
          detail={`${formatIdrCompact(pipelineValue)} to fulfil`}
          trend={{ value: `${orderRows.filter((row) => row.status === "pending").length} pending payment`, positive: false }}
          icon={<span className="text-sm">❐</span>}
        />
        <StatCard
          label="Pairs on the shelf"
          value={String(unitsInStock)}
          detail={`Stock value ${formatIdrCompact(stockValue)}`}
          trend={{ value: `${soldOut.length} sold out`, positive: soldOut.length === 0 }}
          icon={<span className="text-sm">◈</span>}
        />
        <StatCard
          label="Open enquiries"
          value={String(openLeads.length)}
          detail={`${conversion}% pipeline conversion`}
          trend={{ value: `${wonLeads.length} won`, positive: true }}
          icon={<span className="text-sm">✧</span>}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Revenue by week"
          subtitle="Paid, in production, shipped and delivered orders over the last eight weeks"
          action={
            <span className="rounded-full bg-[#f4eee2] px-2.5 py-1 text-[0.6rem] font-semibold text-[#8a6a3c]">
              Avg. order {formatIdrCompact(averageOrder)}
            </span>
          }
        >
          <div className="px-5 pb-5 pt-6">
            <div className="flex h-40 items-end gap-1.5 sm:h-48 sm:gap-4">
              {weeks.map((week, index) => {
                const height = Math.max(4, Math.round((week.value / peak) * 100));
                const isCurrent = index === weeks.length - 1;
                return (
                  <div key={`${week.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[0.55rem] font-medium text-[#8b8173]">
                      {week.value > 0 ? formatIdrCompact(week.value) : "—"}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        title={`${week.label}: ${formatIdr(week.value)} · ${week.orders} orders`}
                        style={{ height: `${height}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 hover:opacity-80 ${
                          isCurrent
                            ? "bg-gradient-to-t from-[#6d2126] to-[#a8674c]"
                            : "bg-gradient-to-t from-[#b3925c] to-[#e3c995]"
                        }`}
                      />
                    </div>
                    <span className="text-[0.55rem] uppercase tracking-[0.08em] text-[#8b8173]">
                      {week.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-crm-line pt-3 text-[0.62rem] text-[#8b8173]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6d2126]" /> Current week
              </span>
              <span>Total in view {formatIdr(weeks.reduce((sum, week) => sum + week.value, 0))}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Lead pipeline" subtitle="Configurator builds and studio enquiries" action={<Link href="/crm/leads" className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a6a3c] hover:text-[#221b15]">Open board →</Link>}>
          <div className="space-y-3 px-5 py-4">
            {pipeline.map((stage) => (
              <div key={stage.key}>
                <div className="flex items-center justify-between text-[0.7rem]">
                  <span className="flex items-center gap-2 text-[#5f5548]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.label}
                  </span>
                  <span className="font-semibold text-[#221b15]">{stage.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1ebdf]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, (stage.count / Math.max(leadRows.length, 1)) * 100)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-lg bg-[#faf6ee] px-3 py-3">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#8a6a3c]">
                Open pipeline value
              </p>
              <p className="mt-1 font-display text-xl text-[#221b15]">
                {formatIdr(openLeads.reduce((sum, lead) => sum + lead.valueIdr, 0))}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Latest orders"
          subtitle="Newest at the top"
          action={
            <Link href="/crm/orders" className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a6a3c] hover:text-[#221b15]">
              All orders →
            </Link>
          }
        >
          {/* Ponsel: kartu ringkas, bukan tabel 560px yang harus digeser. */}
          <ul className="divide-y divide-crm-line/70 md:hidden">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={order.customerName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-medium text-[#3c332a]">
                    {order.customerName}
                  </p>
                  <p className="truncate text-[0.64rem] text-[#a19683]">
                    {order.orderNumber} · {order.city} · {timeAgo(order.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.76rem] font-semibold text-[#221b15]">
                    {formatIdrCompact(order.totalIdr)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <OrderPill status={order.status} />
                  </div>
                </div>
              </li>
            ))}
            {recentOrders.length === 0 && (
              <li className="px-4 py-8 text-center text-[0.72rem] text-[#8b8173]">
                No orders yet.
              </li>
            )}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-crm-line text-[0.55rem] uppercase tracking-[0.14em] text-[#a19683]">
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-3 py-2.5 font-semibold">Customer</th>
                  <th className="px-3 py-2.5 font-semibold">Channel</th>
                  <th className="px-3 py-2.5 font-semibold">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-crm-line/70 last:border-0 hover:bg-[#faf7f1]">
                    <td className="px-4 py-3">
                      <p className="text-[0.74rem] font-semibold text-[#221b15]">{order.orderNumber}</p>
                      <p className="text-[0.6rem] text-[#a19683]">{timeAgo(order.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={order.customerName} />
                        <div>
                          <p className="text-[0.74rem] text-[#3c332a]">{order.customerName}</p>
                          <p className="text-[0.6rem] text-[#a19683]">{order.city}, {order.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><ChannelBadge channel={order.channel} /></td>
                    <td className="px-3 py-3 text-[0.74rem] font-medium text-[#221b15]">{formatIdr(order.totalIdr)}</td>
                    <td className="px-3 py-3"><OrderPill status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Needs attention"
            subtitle="The things that cost money if they wait"
          >
            <ul className="divide-y divide-crm-line/70">
              {attention.map((item) => (
                <li key={item.key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[0.74rem] font-medium text-[#3c332a]">
                      <span className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold ${item.tone}`}>
                        !
                      </span>
                      {item.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[0.62rem] leading-relaxed text-[#a19683]">
                      {item.detail}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 rounded-md border border-crm-line bg-white px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[#8a6a3c] transition-colors hover:border-[#c6b699]"
                  >
                    {item.cta}
                  </Link>
                </li>
              ))}
              {attention.length === 0 && (
                <li className="px-4 py-6 text-center text-[0.72rem] text-[#8b8173]">
                  Nothing needs a decision today — shelf, payments and pipeline are clear.
                </li>
              )}
            </ul>
          </Panel>

          <Panel
            title="The cutting list"
            subtitle={`${subscriberRows.length} signup${subscriberRows.length === 1 ? "" : "s"} · newsletter & waitlist`}
          >
            <ul className="divide-y divide-crm-line/70">
              {recentSubscribers.map((row) => (
                <li key={row.id} className="px-4 py-2.5">
                  <p className="truncate text-[0.72rem] text-[#3c332a]">{row.email}</p>
                  <p className="mt-0.5 truncate text-[0.6rem] text-[#a19683]">
                    {row.source}
                    {row.interest ? ` · ${row.interest}` : ""} · {timeAgo(row.createdAt)}
                  </p>
                </li>
              ))}
              {recentSubscribers.length === 0 && (
                <li className="px-4 py-6 text-center text-[0.72rem] text-[#8b8173]">
                  No signups yet — the form lives in the site footer.
                </li>
              )}
            </ul>
          </Panel>

          <Panel title="Best sellers" subtitle="Units sold across the ledger">
            <div className="space-y-3 px-4 py-4">
              {topProducts.map((row) => (
                <div key={row.name}>
                  <div className="flex items-center justify-between gap-3 text-[0.7rem]">
                    <span className="truncate text-[#3c332a]">{row.name}</span>
                    <span className="shrink-0 font-semibold text-[#221b15]">{row.units} pairs</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1ebdf]">
                    <div className="h-full rounded-full bg-[#b3925c]" style={{ width: `${(row.units / maxUnits) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
