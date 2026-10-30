"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHANNELS, ORDER_STATUSES, orderStatusMeta } from "@/lib/catalog";
import { formatDate, formatIdr } from "@/lib/format";
import { Avatar, ChannelBadge, OrderPill, Panel } from "@/components/crm/ui";

export type CrmOrderItem = {
  id: number;
  productName: string;
  size: string;
  quantity: number;
  unitPriceIdr: number;
};

export type CrmOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  city: string;
  channel: string;
  status: string;
  totalIdr: number;
  notes: string;
  createdAt: string;
  items: CrmOrderItem[];
};

export type ProductOption = {
  id: number;
  name: string;
  priceIdr: number;
  stock: number;
  sizes: string;
  status: string;
};

type LineItem = { productId: string; size: string; quantity: number };

export function OrdersManager({
  initial,
  productOptions,
}: {
  initial: CrmOrder[];
  productOptions: ProductOption[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(initial[0]?.id ?? null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    country: "Indonesia",
    city: "Bandung",
    channel: "web",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    {
      productId: productOptions[0] ? String(productOptions[0].id) : "",
      size: productOptions[0]?.sizes.split(",")[0] ?? "42",
      quantity: 1,
    },
  ]);

  const [syncedInitial, setSyncedInitial] = useState(initial);

  // Data dari server berubah setelah router.refresh(); sinkronkan di fase render.
  if (syncedInitial !== initial) {
    setSyncedInitial(initial);
    setOrders(initial);
  }

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const matchesFilter = filter === "all" || order.status === filter;
        const needle = query.trim().toLowerCase();
        const matchesQuery =
          !needle ||
          `${order.orderNumber} ${order.customerName} ${order.customerEmail} ${order.city} ${order.country}`
            .toLowerCase()
            .includes(needle);
        return matchesFilter && matchesQuery;
      }),
    [orders, filter, query],
  );

  const total = lines.reduce((sum, line) => {
    const product = productOptions.find(
      (option) => String(option.id) === line.productId,
    );
    return sum + (product?.priceIdr ?? 0) * Math.max(1, line.quantity || 1);
  }, 0);

  async function updateStatus(order: CrmOrder, status: string) {
    setBusy(order.id);
    setError(null);
    setOrders((current) =>
      current.map((row) => (row.id === order.id ? { ...row, status } : row)),
    );
    try {
      const response = await fetch(`/api/crm/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not update the order.");
        setOrders((current) =>
          current.map((row) =>
            row.id === order.id ? { ...row, status: order.status } : row,
          ),
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — the order was not updated.");
    } finally {
      setBusy(null);
    }
  }

  async function removeOrder(order: CrmOrder) {
    if (!window.confirm(`Remove order ${order.orderNumber}? This cannot be undone.`)) {
      return;
    }
    setBusy(order.id);
    try {
      const response = await fetch(`/api/crm/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not remove the order.");
        return;
      }
      setOrders((current) => current.filter((row) => row.id !== order.id));
      router.refresh();
    } catch {
      setError("Network error — the order was not removed.");
    } finally {
      setBusy(null);
    }
  }

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: lines
            .filter((line) => line.productId)
            .map((line) => ({
              productId: Number(line.productId),
              size: line.size,
              quantity: line.quantity,
            })),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not log the order.");
        return;
      }
      setCreating(false);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        country: "Indonesia",
        city: "Bandung",
        channel: "web",
        notes: "",
      });
      setLines([
        {
          productId: productOptions[0] ? String(productOptions[0].id) : "",
          size: productOptions[0]?.sizes.split(",")[0] ?? "42",
          quantity: 1,
        },
      ]);
      router.refresh();
    } catch {
      setError("Network error — the order was not logged.");
    } finally {
      setSaving(false);
    }
  }

  const counts = (status: string) =>
    status === "all"
      ? orders.length
      : orders.filter((order) => order.status === status).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-crm-line bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
          {[{ id: "all", label: "All" }, ...ORDER_STATUSES.map((status) => ({ id: status, label: orderStatusMeta[status].label }))].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[0.65rem] font-medium transition-colors ${
                filter === tab.id ? "bg-ink text-paper" : "text-[#7a7062] hover:bg-[#f4eee2]"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[0.56rem] ${filter === tab.id ? "text-paper/60" : "text-[#a19683]"}`}>
                {counts(tab.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders, customers…"
            className="crm-input !w-full lg:!w-56"
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-lg bg-[#7a5a2e] px-3.5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5f451f]"
          >
            + New order
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dfc0bb] bg-[#f1dedb] px-4 py-2.5 text-[0.76rem] text-[#88423a]">
          {error}
          <button type="button" onClick={() => setError(null)} className="font-semibold">✕</button>
        </div>
      )}

      <Panel title="Order ledger" subtitle={`${filtered.length} orders in view`}>
        <ul className="divide-y divide-crm-line/70">
          {filtered.map((order) => {
            const isOpen = expanded === order.id;
            return (
              <li key={order.id}>
                <div className="grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-3 sm:grid-cols-[1.1fr_1fr_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[0.76rem] font-semibold text-[#221b15]">{order.orderNumber}</p>
                    <p className="text-[0.62rem] text-[#a19683]">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="col-span-2 flex min-w-0 items-center gap-2.5 sm:col-span-1">
                    <Avatar name={order.customerName} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.74rem] text-[#3c332a]">{order.customerName}</p>
                      <p className="truncate text-[0.6rem] text-[#a19683]">{order.city}, {order.country}</p>
                    </div>
                  </div>
                  <div className="text-right sm:min-w-[104px]">
                    <p className="text-[0.76rem] font-semibold text-[#221b15]">{formatIdr(order.totalIdr)}</p>
                    <p className="text-[0.6rem] text-[#a19683]">{order.items.reduce((sum, item) => sum + item.quantity, 0)} pair(s)</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={order.status}
                      onChange={(event) => updateStatus(order, event.target.value)}
                      disabled={busy === order.id}
                      className="rounded-lg border border-crm-line bg-white px-2 py-1.5 text-[0.66rem] font-medium text-[#3c332a] outline-none focus:border-[#b08c52]"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{orderStatusMeta[status].label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      aria-label={isOpen ? "Collapse order" : "Expand order"}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-crm-line text-[0.7rem] text-[#7a7062] transition-colors hover:bg-[#f4eee2]"
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="grid gap-4 border-t border-dashed border-crm-line bg-[#fdfbf7] px-4 py-4 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[#a19683]">Pairs in this order</p>
                      <ul className="mt-2 space-y-1.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-crm-line bg-white px-3 py-2">
                            <span className="text-[0.72rem] text-[#3c332a]">
                              {item.productName}
                              <span className="ml-2 text-[0.6rem] text-[#a19683]">EU {item.size} · ×{item.quantity}</span>
                            </span>
                            <span className="text-[0.7rem] text-[#5f5548]">{formatIdr(item.unitPriceIdr * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mt-3 rounded-lg bg-[#faf6ee] px-3 py-2 text-[0.7rem] leading-relaxed text-[#7a6244]">
                          <span className="font-semibold">Notes: </span>
                          {order.notes}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[#a19683]">Customer</p>
                      <div className="space-y-1 text-[0.7rem] text-[#5f5548]">
                        <p>{order.customerEmail}</p>
                        <p>{order.customerPhone || "No phone on file"}</p>
                        <p>{order.city}, {order.country}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <ChannelBadge channel={order.channel} />
                        <OrderPill status={order.status} />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <a
                          href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your Tahura order ${order.orderNumber}`)}`}
                          className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 text-[0.6rem] font-medium text-[#5f5548] hover:border-[#c6b699]"
                        >
                          Email customer
                        </a>
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 text-[0.6rem] font-medium text-[#5f5548] hover:border-[#c6b699]"
                        >
                          WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={() => removeOrder(order)}
                          disabled={busy === order.id}
                          className="rounded-md border border-transparent px-2 py-1.5 text-[0.6rem] text-[#a19683] hover:border-[#dfc0bb] hover:bg-[#f1dedb] hover:text-[#88423a]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-lg text-[#3c332a]">No orders in this view.</p>
            <p className="mt-1 text-[0.76rem] text-[#8b8173]">Log a new order or clear the filter.</p>
          </div>
        )}
      </Panel>

      {creating && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <form onSubmit={createOrder} className="w-full max-w-2xl rounded-xl border border-crm-line bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-crm-line px-5 py-4">
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#a8865a]">Order entry</p>
                <h2 className="mt-1 font-display text-xl text-[#221b15]">Log a new order</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)} className="text-[#a19683] hover:text-[#221b15]">✕</button>
            </div>

            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <div>
                <label className="crm-label">Customer name</label>
                <input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} className="crm-input" placeholder="Raka Pradipta" />
              </div>
              <div>
                <label className="crm-label">Email</label>
                <input required type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} className="crm-input" placeholder="raka@email.com" />
              </div>
              <div>
                <label className="crm-label">Phone / WhatsApp</label>
                <input value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} className="crm-input" placeholder="+62 812 …" />
              </div>
              <div>
                <label className="crm-label">Channel</label>
                <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="crm-input">
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel === "web" ? "Website" : channel === "whatsapp" ? "WhatsApp" : channel === "studio" ? "Studio visit" : "Instagram"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="crm-label">City</label>
                <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Country</label>
                <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="crm-input" />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="crm-label !mb-0">Pairs</label>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((current) => [
                        ...current,
                        {
                          productId: productOptions[0] ? String(productOptions[0].id) : "",
                          size: productOptions[0]?.sizes.split(",")[0] ?? "42",
                          quantity: 1,
                        },
                      ])
                    }
                    className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a6a3c] hover:text-[#221b15]"
                  >
                    + Add another pair
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {lines.map((line, index) => {
                    const selected = productOptions.find((option) => String(option.id) === line.productId);
                    return (
                      <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded-lg border border-crm-line bg-[#fdfbf7] p-2">
                        <select
                          value={line.productId}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, productId: event.target.value } : row,
                              ),
                            )
                          }
                          className="crm-input !bg-white"
                        >
                          {productOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name} — {formatIdr(option.priceIdr)} ({option.stock} left)
                            </option>
                          ))}
                        </select>
                        <select
                          value={line.size}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, size: event.target.value } : row,
                              ),
                            )
                          }
                          className="crm-input !w-20 !bg-white"
                        >
                          {(selected?.sizes.split(",") ?? ["42"]).map((size) => (
                            <option key={size} value={size}>EU {size}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, quantity: Number(event.target.value) } : row,
                              ),
                            )
                          }
                          aria-label="Quantity"
                          className="crm-input !w-16 !bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                          disabled={lines.length === 1}
                          className="rounded-md px-2 text-[0.8rem] text-[#a19683] hover:text-[#88423a] disabled:opacity-30"
                          aria-label="Remove pair"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="crm-label">Studio notes</label>
                <textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="crm-input resize-none" placeholder="Fitting notes, shipping preference, monogram…" />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-crm-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-[#a19683]">Order total</p>
                <p className="font-display text-xl text-[#221b15]">{formatIdr(total)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-crm-line px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a7062]">
                  Cancel
                </button>
                <button type="submit" disabled={saving || productOptions.length === 0} className="rounded-lg bg-ink px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60">
                  {saving ? "Logging…" : "Log order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
