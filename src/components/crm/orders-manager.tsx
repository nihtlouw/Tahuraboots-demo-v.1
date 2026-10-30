"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHANNELS, ORDER_STATUSES, orderStatusMeta, resolveAvailability } from "@/lib/catalog";
import { formatDate, formatIdr } from "@/lib/format";
import { Avatar, ChannelBadge, OrderPill, Panel } from "@/components/crm/ui";
import {
  Banner,
  ConfirmDialog,
  Modal,
  ModalHeader,
  Toast,
  useToast,
} from "@/components/crm/overlay";
import { csvStamp, downloadCsv } from "@/lib/csv";

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

type SortKey = "newest" | "oldest" | "total-desc" | "total-asc" | "customer";

const PAGE_SIZE = 8;
const MAX_QUANTITY = 20;

const sortOptions: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "total-desc", label: "Total · high to low" },
  { id: "total-asc", label: "Total · low to high" },
  { id: "customer", label: "Customer A–Z" },
];

const channelLabels: Record<string, string> = {
  web: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  studio: "Studio visit",
};

const emptyForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  country: "Indonesia",
  city: "Bandung",
  channel: "web",
  notes: "",
};

function firstSize(product: ProductOption | undefined) {
  return product?.sizes.split(",")[0] ?? "42";
}

function pairsIn(order: CrmOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

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
  const [editing, setEditing] = useState<CrmOrder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CrmOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("paid");
  const [bulkBusy, setBulkBusy] = useState(false);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [form, setForm] = useState(emptyForm);

  // Hanya pair yang benar-benar bisa dipesan (ready / made to order). Sold out
  // dan arsip ditolak server, jadi jangan ditawarkan sebagai default.
  const orderableOptions = productOptions.filter((option) => {
    const availability = resolveAvailability(option);
    return availability === "ready" || availability === "made_to_order";
  });

  const [lines, setLines] = useState<LineItem[]>([
    {
      productId: orderableOptions[0] ? String(orderableOptions[0].id) : "",
      size: firstSize(orderableOptions[0]),
      quantity: 1,
    },
  ]);

  const [syncedInitial, setSyncedInitial] = useState(initial);

  // Data dari server berubah setelah router.refresh(); sinkronkan di fase render.
  if (syncedInitial !== initial) {
    setSyncedInitial(initial);
    setOrders(initial);
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const rows = orders.filter((order) => {
      const matchesFilter = filter === "all" || order.status === filter;
      if (!matchesFilter) return false;
      if (!needle) return true;
      return `${order.orderNumber} ${order.customerName} ${order.customerEmail} ${order.city} ${order.country}`
        .toLowerCase()
        .includes(needle);
    });

    const sorted = [...rows];
    if (sort === "oldest") sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sort === "total-desc") sorted.sort((a, b) => b.totalIdr - a.totalIdr);
    else if (sort === "total-asc") sorted.sort((a, b) => a.totalIdr - b.totalIdr);
    else if (sort === "customer") sorted.sort((a, b) => a.customerName.localeCompare(b.customerName));
    else sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return sorted;
  }, [orders, filter, query, sort]);

  const filteredIds = useMemo(() => new Set(filtered.map((order) => order.id)), [filtered]);

  // Pilihan hanya berlaku untuk baris yang benar-benar terlihat. Dulu baris yang
  // disembunyikan filter tetap ikut berubah saat aksi massal dijalankan.
  const selected = useMemo(
    () => selectedIds.filter((id) => filteredIds.has(id)),
    [selectedIds, filteredIds],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageIds = paged.map((order) => order.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  function toggleRow(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function togglePage() {
    setSelectedIds((current) => {
      if (allPageSelected) return current.filter((id) => !pageIds.includes(id));
      return [...new Set([...current, ...pageIds])];
    });
  }

  function changeFilter(next: string) {
    setFilter(next);
    setPage(1);
    setSelectedIds([]);
  }

  async function applyBulkStatus() {
    if (selected.length === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status: bulkStatus }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        updated?: number[];
        error?: string;
      };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Bulk update failed.");

      const updatedIds = new Set(data.updated ?? []);
      setOrders((current) =>
        current.map((order) =>
          updatedIds.has(order.id) ? { ...order, status: bulkStatus } : order,
        ),
      );
      showToast(
        `${updatedIds.size} order${updatedIds.size === 1 ? "" : "s"} moved to ${
          orderStatusMeta[bulkStatus]?.label ?? bulkStatus
        }.`,
      );
      setSelectedIds([]);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk update failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const ok = downloadCsv(
      csvStamp("tahura-orders"),
      filtered.map((order) => ({
        orderNumber: order.orderNumber,
        createdAt: new Date(order.createdAt).toISOString(),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        city: order.city,
        country: order.country,
        channel: order.channel,
        status: order.status,
        totalIdr: order.totalIdr,
        pairs: pairsIn(order),
        notes: order.notes,
      })),
    );
    if (!ok) setError("There is nothing to export in this view.");
    else showToast(`${filtered.length} order${filtered.length === 1 ? "" : "s"} exported to CSV.`);
  }

  const total = lines.reduce((sum, line) => {
    const product = productOptions.find((option) => String(option.id) === line.productId);
    return sum + (product?.priceIdr ?? 0) * Math.max(1, line.quantity || 1);
  }, 0);

  async function updateStatus(order: CrmOrder, status: string) {
    const previous = order.status;
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
          current.map((row) => (row.id === order.id ? { ...row, status: previous } : row)),
        );
        return;
      }

      if (status === "cancelled") {
        showToast(`Order ${order.orderNumber} cancelled — ${pairsIn(order)} pair(s) returned to the shelf.`);
      } else {
        showToast(`Order ${order.orderNumber} moved to ${orderStatusMeta[status]?.label ?? status}.`);
      }
      router.refresh();
    } catch {
      setError("Network error — the order was not updated.");
      setOrders((current) =>
        current.map((row) => (row.id === order.id ? { ...row, status: previous } : row)),
      );
    } finally {
      setBusy(null);
    }
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    const order = pendingDelete;
    setBusy(order.id);
    try {
      const response = await fetch(`/api/crm/orders/${order.id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not remove the order.");
        return;
      }
      setOrders((current) => current.filter((row) => row.id !== order.id));
      setSelectedIds((current) => current.filter((id) => id !== order.id));
      setPendingDelete(null);
      showToast(`Order ${order.orderNumber} removed.`);
      router.refresh();
    } catch {
      setError("Network error — the order was not removed.");
    } finally {
      setBusy(null);
    }
  }

  function resetComposer() {
    setForm(emptyForm);
    setLines([
      {
        productId: orderableOptions[0] ? String(orderableOptions[0].id) : "",
        size: firstSize(orderableOptions[0]),
        quantity: 1,
      },
    ]);
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
      resetComposer();
      showToast("Order logged — stock on the shelf was updated.");
      router.refresh();
    } catch {
      setError("Network error — the order was not logged.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/orders/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editing.customerName,
          customerEmail: editing.customerEmail,
          customerPhone: editing.customerPhone,
          city: editing.city,
          country: editing.country,
          channel: editing.channel,
          notes: editing.notes,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not save the order.");
        return;
      }
      setOrders((current) =>
        current.map((row) => (row.id === editing.id ? { ...row, ...editing } : row)),
      );
      setEditing(null);
      showToast("Order details updated.");
      router.refresh();
    } catch {
      setError("Network error — the order was not saved.");
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
              onClick={() => changeFilter(tab.id)}
              aria-pressed={filter === tab.id}
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              setSelectedIds([]);
            }}
            placeholder="Search orders, customers…"
            aria-label="Search orders"
            className="crm-input !w-full lg:!w-56"
          />
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortKey);
              setPage(1);
            }}
            aria-label="Sort orders"
            className="rounded-lg border border-crm-line bg-white px-2.5 py-2.5 text-[0.64rem] text-[#3c332a] outline-none focus:border-[#b08c52]"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="shrink-0 rounded-lg border border-crm-line bg-white px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#5f5548] transition-colors hover:border-[#c6b699]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              resetComposer();
              setCreating(true);
            }}
            className="shrink-0 rounded-lg bg-[#7a5a2e] px-3.5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5f451f]"
          >
            + New order
          </button>
        </div>
      </div>

      {error && <Banner onDismiss={() => setError(null)}>{error}</Banner>}
      <Toast toast={toast} onDismiss={dismissToast} />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#d8c9ae] bg-[#faf6ee] px-4 py-2.5 text-[0.74rem] text-[#5f5548]">
          <strong className="font-semibold text-[#3c332a]">
            {selected.length} selected
          </strong>
          <label className="flex items-center gap-2">
            <span className="text-[0.62rem] uppercase tracking-[0.12em] text-[#a19683]">Set status</span>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="rounded-md border border-crm-line bg-white px-2 py-1.5 text-[0.68rem] outline-none focus:border-[#b08c52]"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{orderStatusMeta[status].label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={applyBulkStatus}
            disabled={bulkBusy}
            className="rounded-md bg-[#7a5a2e] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5f451f] disabled:opacity-60"
          >
            {bulkBusy ? "Saving…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-[0.62rem] text-[#8b8173] underline-offset-4 hover:underline"
          >
            Clear selection
          </button>
          <span className="text-[0.6rem] text-[#a19683]">
            Cancelling returns pairs to the shelf automatically.
          </span>
        </div>
      )}

      <Panel
        title="Order ledger"
        subtitle={`${filtered.length} orders in view · page ${currentPage}/${totalPages}`}
        action={
          <label className="flex cursor-pointer items-center gap-2 text-[0.62rem] text-[#8b8173]">
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={togglePage}
              className="h-3.5 w-3.5 accent-[#7a5a2e]"
            />
            Select this page
          </label>
        }
      >
        <ul className="divide-y divide-crm-line/70">
          {paged.map((order) => {
            const isOpen = expanded === order.id;
            return (
              <li key={order.id}>
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 sm:grid-cols-[auto_1.1fr_1fr_auto_auto] sm:items-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={() => toggleRow(order.id)}
                    aria-label={`Select order ${order.orderNumber}`}
                    className="mt-1 h-3.5 w-3.5 accent-[#7a5a2e] sm:mt-0"
                  />
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
                    <p className="text-[0.6rem] text-[#a19683]">{pairsIn(order)} pair(s)</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={order.status}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === order.status) return;
                        void updateStatus(order, next);
                      }}
                      disabled={busy === order.id}
                      aria-label={`Status for ${order.orderNumber}`}
                      className="rounded-lg border border-crm-line bg-white px-2 py-1.5 text-[0.66rem] font-medium text-[#3c332a] outline-none focus:border-[#b08c52] disabled:opacity-60"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{orderStatusMeta[status].label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      aria-label={isOpen ? "Collapse order" : "Expand order"}
                      aria-expanded={isOpen}
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
                        <p className="break-all">{order.customerEmail}</p>
                        <p>{order.customerPhone || "No phone on file"}</p>
                        <p>{order.city}, {order.country}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <ChannelBadge channel={order.channel} />
                        <OrderPill status={order.status} />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...order })}
                          className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 text-[0.6rem] font-medium text-[#5f5548] hover:border-[#c6b699]"
                        >
                          Edit details
                        </button>
                        <a
                          href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your Tahura order ${order.orderNumber}`)}`}
                          className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 text-[0.6rem] font-medium text-[#5f5548] hover:border-[#c6b699]"
                        >
                          Email customer
                        </a>
                        {order.customerPhone.replace(/\D/g, "") && (
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 text-[0.6rem] font-medium text-[#5f5548] hover:border-[#c6b699]"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingDelete(order)}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-crm-line px-4 py-3 text-[0.66rem] text-[#8b8173]">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-1 font-medium text-[#3c332a]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="rounded-md border border-crm-line bg-white px-2.5 py-1.5 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Order entry ─────────────────────────────────────────────── */}
      <Modal open={creating} onClose={() => setCreating(false)} labelledBy="order-entry-title">
        <form onSubmit={createOrder}>
          <ModalHeader
            id="order-entry-title"
            eyebrow="Order entry"
            title="Log a new order"
            onClose={() => setCreating(false)}
          />

          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            <div>
              <label className="crm-label" htmlFor="order-name">Customer name</label>
              <input id="order-name" required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} className="crm-input" placeholder="Raka Pradipta" />
            </div>
            <div>
              <label className="crm-label" htmlFor="order-email">Email</label>
              <input id="order-email" required type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} className="crm-input" placeholder="raka@email.com" />
            </div>
            <div>
              <label className="crm-label" htmlFor="order-phone">Phone / WhatsApp</label>
              <input id="order-phone" value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} className="crm-input" placeholder="+62 812 …" />
            </div>
            <div>
              <label className="crm-label" htmlFor="order-channel">Channel</label>
              <select id="order-channel" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="crm-input">
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>{channelLabels[channel]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="crm-label" htmlFor="order-city">City</label>
              <input id="order-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="crm-input" />
            </div>
            <div>
              <label className="crm-label" htmlFor="order-country">Country</label>
              <input id="order-country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="crm-input" />
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
                        productId: orderableOptions[0] ? String(orderableOptions[0].id) : "",
                        size: firstSize(orderableOptions[0]),
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
                  const selectedProduct = productOptions.find(
                    (option) => String(option.id) === line.productId,
                  );
                  const availability = selectedProduct
                    ? resolveAvailability(selectedProduct)
                    : "sold_out";
                  const maxQuantity =
                    availability === "ready"
                      ? Math.max(1, selectedProduct?.stock ?? 1)
                      : MAX_QUANTITY;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-crm-line bg-[#fdfbf7] p-2"
                    >
                      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_2rem] sm:items-center">
                        <select
                          value={line.productId}
                          aria-label="Pair"
                          onChange={(event) => {
                            const nextProduct = productOptions.find(
                              (option) => String(option.id) === event.target.value,
                            );
                            const nextAvailability = nextProduct
                              ? resolveAvailability(nextProduct)
                              : "sold_out";
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? {
                                      ...row,
                                      productId: event.target.value,
                                      size: firstSize(nextProduct),
                                      quantity:
                                        nextAvailability === "ready"
                                          ? 1
                                          : Math.min(row.quantity, MAX_QUANTITY),
                                    }
                                  : row,
                              ),
                            );
                          }}
                          className="crm-input !bg-white"
                        >
                          {productOptions.map((option) => {
                            const optionAvailability = resolveAvailability(option);
                            const unavailable =
                              optionAvailability === "archive" ||
                              optionAvailability === "sold_out";
                            return (
                              <option
                                key={option.id}
                                value={option.id}
                                disabled={unavailable}
                              >
                                {option.name} — {formatIdr(option.priceIdr)}
                                {optionAvailability === "ready"
                                  ? ` (${option.stock} left)`
                                  : optionAvailability === "made_to_order"
                                    ? " (made to order)"
                                    : optionAvailability === "sold_out"
                                      ? " (sold out)"
                                      : " (archived)"}
                              </option>
                            );
                          })}
                        </select>

                        <select
                          value={line.size}
                          aria-label="Size"
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, size: event.target.value } : row,
                              ),
                            )
                          }
                          className="crm-input !bg-white"
                        >
                          {(selectedProduct?.sizes.split(",") ?? ["42"]).map((size) => (
                            <option key={size} value={size}>EU {size}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min={1}
                          max={maxQuantity}
                          value={line.quantity}
                          aria-label="Quantity"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, quantity: Number.isFinite(next) ? next : 1 }
                                  : row,
                              ),
                            );
                          }}
                          onBlur={() =>
                            setLines((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? {
                                      ...row,
                                      quantity: Math.min(
                                        maxQuantity,
                                        Math.max(1, Math.round(row.quantity) || 1),
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="crm-input !bg-white"
                        />

                        <button
                          type="button"
                          onClick={() => setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                          disabled={lines.length === 1}
                          className="justify-self-end rounded-md px-2 py-1 text-[0.8rem] text-[#a19683] hover:text-[#88423a] disabled:opacity-30"
                          aria-label="Remove pair"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[0.6rem]">
                        <span className="text-[#a19683]">
                          {availability === "ready" && selectedProduct
                            ? `${selectedProduct.stock} pair(s) on the shelf`
                            : availability === "made_to_order"
                              ? "Made to order — 6–8 weeks, no shelf stock"
                              : "Not available to order"}
                        </span>
                        <span className="font-medium text-[#5f5548]">
                          {formatIdr((selectedProduct?.priceIdr ?? 0) * Math.max(1, line.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="crm-label" htmlFor="order-notes">Studio notes</label>
              <textarea id="order-notes" rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="crm-input resize-none" placeholder="Fitting notes, shipping preference, monogram…" />
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
              <button type="submit" disabled={saving || orderableOptions.length === 0} className="rounded-lg bg-ink px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60">
                {saving ? "Logging…" : "Log order"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Edit details ────────────────────────────────────────────── */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} labelledBy="order-edit-title">
        {editing && (
          <form onSubmit={saveDetails}>
            <ModalHeader
              id="order-edit-title"
              eyebrow={`Order ${editing.orderNumber}`}
              title="Edit customer details"
              onClose={() => setEditing(null)}
            />

            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <div>
                <label className="crm-label" htmlFor="edit-name">Customer name</label>
                <input id="edit-name" required value={editing.customerName} onChange={(event) => setEditing({ ...editing, customerName: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label" htmlFor="edit-email">Email</label>
                <input id="edit-email" required type="email" value={editing.customerEmail} onChange={(event) => setEditing({ ...editing, customerEmail: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label" htmlFor="edit-phone">Phone / WhatsApp</label>
                <input id="edit-phone" value={editing.customerPhone} onChange={(event) => setEditing({ ...editing, customerPhone: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label" htmlFor="edit-channel">Channel</label>
                <select id="edit-channel" value={editing.channel} onChange={(event) => setEditing({ ...editing, channel: event.target.value })} className="crm-input">
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>{channelLabels[channel]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="crm-label" htmlFor="edit-city">City</label>
                <input id="edit-city" value={editing.city} onChange={(event) => setEditing({ ...editing, city: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label" htmlFor="edit-country">Country</label>
                <input id="edit-country" value={editing.country} onChange={(event) => setEditing({ ...editing, country: event.target.value })} className="crm-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="crm-label" htmlFor="edit-notes">Studio notes</label>
                <textarea id="edit-notes" rows={3} value={editing.notes} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} className="crm-input resize-none" />
              </div>
              <p className="text-[0.62rem] text-[#a19683] sm:col-span-2">
                Pairs, prices and totals can&apos;t be changed here — delete the order and log it again if the pairs are wrong.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-crm-line px-5 py-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-crm-line px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a7062]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-ink px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.orderNumber ?? "this order"}?`}
        message={
          <>
            This removes the order from the ledger. If it is still active, its{" "}
            {pendingDelete ? pairsIn(pendingDelete) : 0} pair(s) go back to the shelf.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete order"
        busy={busy === pendingDelete?.id}
        onConfirm={confirmRemove}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
