"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { resolveAvailability, PRODUCT_STATUSES, productStatusLabels } from "@/lib/catalog";
import { formatIdr } from "@/lib/format";
import { csvStamp, downloadCsv } from "@/lib/csv";

export type CrmProduct = {
  id: number;
  name: string;
  model: string;
  leather: string;
  colorway: string;
  description: string;
  priceIdr: number;
  stock: number;
  status: string;
  imageUrl: string;
  collectionName: string;
  sizes: string;
  featured: boolean;
  unitsSold: number;
};

const images = [
  { value: "/images/boot-olive.jpg", label: "Olive toe-cap" },
  { value: "/images/boot-oxblood.jpg", label: "Oxblood brogue" },
  { value: "/images/boot-engineer.jpg", label: "Black engineer" },
  { value: "/images/boot-chelsea.jpg", label: "Cognac chelsea" },
  { value: "/images/boot-croc.jpg", label: "Midnight croc" },
  { value: "/images/boot-monkey.jpg", label: "Tan monkey" },
  { value: "/images/boot-hiker.jpg", label: "Espresso hiker" },
  { value: "/images/boot-chukka.jpg", label: "Chocolate chukka" },
];

type Draft = {
  id?: number;
  name: string;
  model: string;
  leather: string;
  colorway: string;
  collectionName: string;
  description: string;
  priceIdr: string;
  stock: string;
  status: string;
  sizes: string;
  imageUrl: string;
  featured: boolean;
};

const emptyDraft: Draft = {
  name: "",
  model: "Toe-Cap Lace Boot",
  leather: "Tochigi Vachetta",
  colorway: "",
  collectionName: "Core Line",
  description: "",
  priceIdr: "3450000",
  stock: "0",
  status: "ready",
  sizes: "39,40,41,42,43,44,45",
  imageUrl: "/images/boot-olive.jpg",
  featured: false,
};

export function ProductsManager({ initial }: { initial: CrmProduct[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<"shelf" | "price-desc" | "price-asc" | "sold" | "name">("shelf");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = items.filter((item) => {
      const matchesQuery =
        !query.trim() ||
        `${item.name} ${item.model} ${item.colorway} ${item.leather}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      if (filter === "sold_out") return resolveAvailability(item) === "sold_out";
      if (filter === "low") return item.stock > 0 && item.stock <= 2;
      return item.status === filter;
    });

    const sorted = [...rows];
    if (sort === "price-desc") sorted.sort((a, b) => b.priceIdr - a.priceIdr);
    else if (sort === "price-asc") sorted.sort((a, b) => a.priceIdr - b.priceIdr);
    else if (sort === "sold") sorted.sort((a, b) => b.unitsSold - a.unitsSold);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));

    return sorted;
  }, [items, query, filter, sort]);

  const totals = useMemo(() => {
    const units = items.reduce((sum, item) => sum + item.stock, 0);
    const value = items.reduce((sum, item) => sum + item.stock * item.priceIdr, 0);
    const soldOut = items.filter((item) => resolveAvailability(item) === "sold_out").length;
    const low = items.filter((item) => item.stock > 0 && item.stock <= 2).length;
    return { units, value, soldOut, low };
  }, [items]);

  function replaceItem(product: CrmProduct) {
    setItems((current) =>
      current.map((item) => (item.id === product.id ? { ...item, ...product } : item)),
    );
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const response = await fetch(`/api/crm/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        product?: CrmProduct;
      };
      if (!response.ok || !data.ok || !data.product) {
        setError(data.error ?? "Could not update the pair.");
        return;
      }
      replaceItem(data.product);
      router.refresh();
    } catch {
      setError("Network error — the shelf was not updated.");
    } finally {
      setBusy(null);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: draft.name,
        model: draft.model,
        leather: draft.leather,
        colorway: draft.colorway,
        collectionName: draft.collectionName,
        description: draft.description,
        priceIdr: Number(draft.priceIdr),
        stock: Number(draft.stock),
        status: draft.status,
        sizes: draft.sizes,
        imageUrl: draft.imageUrl,
        featured: draft.featured,
      };
      const response = await fetch(
        draft.id ? `/api/crm/products/${draft.id}` : "/api/crm/products",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        product?: CrmProduct;
      };
      if (!response.ok || !data.ok || !data.product) {
        setError(data.error ?? "Could not save the pair.");
        return;
      }
      if (draft.id) {
        replaceItem(data.product);
      } else {
        setItems((current) => [...current, data.product as CrmProduct]);
      }
      setDraft(null);
      router.refresh();
    } catch {
      setError("Network error — the pair was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`Remove ${name} from the catalogue? Past orders are kept.`)) {
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const response = await fetch(`/api/crm/products/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not remove the pair.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } catch {
      setError("Network error — the pair was not removed.");
    } finally {
      setBusy(null);
    }
  }

  const filterTabs = [
    { id: "all", label: "All", count: items.length },
    { id: "ready", label: "Ready to ship", count: items.filter((item) => item.status === "ready").length },
    { id: "made_to_order", label: "Made to order", count: items.filter((item) => item.status === "made_to_order").length },
    { id: "sold_out", label: "Sold out", count: totals.soldOut },
    { id: "low", label: "Low stock", count: totals.low },
    { id: "archive", label: "Archive", count: items.filter((item) => item.status === "archive").length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Styles in catalogue", String(items.length)],
          ["Pairs on the shelf", String(totals.units)],
          ["Sold out", String(totals.soldOut)],
          ["Stock value", formatIdr(totals.value)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-crm-line bg-white px-4 py-3">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#a19683]">{label}</p>
            <p className="mt-1 font-display text-xl text-[#221b15]">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-crm-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[0.66rem] font-medium transition-colors ${
                filter === tab.id
                  ? "bg-ink text-paper"
                  : "text-[#7a7062] hover:bg-[#f4eee2]"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[0.58rem] ${filter === tab.id ? "text-paper/60" : "text-[#a19683]"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search styles, leathers…"
            className="crm-input !w-full sm:!w-56"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            aria-label="Sort pairs"
            className="rounded-lg border border-crm-line bg-white px-2.5 py-2.5 text-[0.64rem] text-[#3c332a] outline-none focus:border-[#b08c52]"
          >
            <option value="shelf">Shelf · low stock first</option>
            <option value="sold">Best selling</option>
            <option value="price-desc">Price · high to low</option>
            <option value="price-asc">Price · low to high</option>
            <option value="name">Name A–Z</option>
          </select>
          <button
            type="button"
            onClick={() => {
              const ok = downloadCsv(
                csvStamp("tahura-pairs"),
                filtered.map((product) => ({
                  slug: product.id,
                  name: product.name,
                  model: product.model,
                  leather: product.leather,
                  colorway: product.colorway,
                  collection: product.collectionName,
                  priceIdr: product.priceIdr,
                  stock: product.stock,
                  status: product.status,
                  unitsSold: product.unitsSold,
                  sizes: product.sizes,
                })),
              );
              setToast(ok ? `${filtered.length} pairs diekspor ke CSV.` : "Tidak ada baris untuk diekspor.");
            }}
            className="shrink-0 rounded-lg border border-crm-line bg-white px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#5f5548] transition-colors hover:border-[#c6b699]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setDraft({ ...emptyDraft })}
            className="shrink-0 rounded-lg bg-[#7a5a2e] px-3.5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5f451f]"
          >
            + New pair
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dfc0bb] bg-[#f1dedb] px-4 py-2.5 text-[0.76rem] text-[#88423a]">
          {error}
          <button type="button" onClick={() => setError(null)} className="font-semibold">✕</button>
        </div>
      )}

      {toast && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-[#cbd8bf] bg-[#eef3e6] px-4 py-2.5 text-[0.76rem] text-[#4c6034]">
          {toast}
          <button type="button" onClick={() => setToast(null)} className="font-semibold">✕</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-crm-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-crm-line bg-[#faf7f1] text-[0.55rem] uppercase tracking-[0.14em] text-[#a19683]">
                <th className="px-4 py-3 font-semibold">Pair</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Shelf</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Sold</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const availability = resolveAvailability(product);
                return (
                  <tr key={product.id} className="border-b border-crm-line/70 last:border-0 hover:bg-[#fdfbf7]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-[#f1ebdf]">
                          <Image src={product.imageUrl} alt={product.name} fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[0.78rem] font-semibold text-[#221b15]">
                            {product.name}
                            {product.featured && (
                              <span className="ml-2 rounded bg-[#f6e7c8] px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.1em] text-[#7a5a17]">
                                Pick
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[0.62rem] text-[#a19683]">
                            {product.colorway} · {product.leather}
                          </p>
                          <p className="text-[0.56rem] uppercase tracking-[0.1em] text-[#c0b6a5]">
                            {product.collectionName} · EU {product.sizes.split(",")[0]}–{product.sizes.split(",").slice(-1)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={product.status}
                        onChange={(event) => patch(product.id, { status: event.target.value })}
                        disabled={busy === product.id}
                        className={`rounded-lg border px-2 py-1.5 text-[0.68rem] font-medium outline-none ${
                          availability === "sold_out"
                            ? "border-[#dfc0bb] bg-[#f1dedb] text-[#88423a]"
                            : availability === "ready"
                              ? "border-[#c2d6b8] bg-[#e2ecdc] text-[#3f5c36]"
                              : availability === "made_to_order"
                                ? "border-[#e6cf9b] bg-[#f6e7c8] text-[#7a5a17]"
                                : "border-crm-line bg-[#f4eee2] text-[#6d6355]"
                        }`}
                      >
                        {PRODUCT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {productStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {availability === "sold_out" && (
                        <p className="mt-1 text-[0.55rem] uppercase tracking-[0.1em] text-[#a35a49]">Shelf empty</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-crm-line bg-white p-0.5">
                        <button
                          type="button"
                          aria-label={`Reduce stock for ${product.name}`}
                          disabled={busy === product.id || product.stock === 0}
                          onClick={() => patch(product.id, { stock: Math.max(0, product.stock - 1) })}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[0.8rem] text-[#7a7062] transition-colors hover:bg-[#f4eee2] disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-[0.72rem] font-semibold text-[#221b15]">
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase stock for ${product.name}`}
                          disabled={busy === product.id}
                          onClick={() => patch(product.id, { stock: product.stock + 1 })}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[0.8rem] text-[#7a7062] transition-colors hover:bg-[#f4eee2] disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[0.72rem] text-[#3c332a]">{formatIdr(product.priceIdr)}</td>
                    <td className="px-3 py-3 text-[0.72rem] text-[#7a7062]">{product.unitsSold}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              id: product.id,
                              name: product.name,
                              model: product.model,
                              leather: product.leather,
                              colorway: product.colorway,
                              collectionName: product.collectionName,
                              description: product.description,
                              priceIdr: String(product.priceIdr),
                              stock: String(product.stock),
                              status: product.status,
                              sizes: product.sizes,
                              imageUrl: product.imageUrl,
                              featured: product.featured,
                            })
                          }
                          className="rounded-md border border-crm-line px-2.5 py-1.5 text-[0.62rem] font-medium text-[#5f5548] transition-colors hover:border-[#c6b699] hover:bg-[#faf6ee]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product.id, product.name)}
                          disabled={busy === product.id}
                          className="rounded-md border border-transparent px-2 py-1.5 text-[0.62rem] text-[#a19683] transition-colors hover:border-[#dfc0bb] hover:bg-[#f1dedb] hover:text-[#88423a] disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-lg text-[#3c332a]">No pairs match that view.</p>
            <p className="mt-1 text-[0.76rem] text-[#8b8173]">Try another shelf filter or add a new pair.</p>
          </div>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={save}
            className="w-full max-w-2xl rounded-xl border border-crm-line bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-crm-line px-5 py-4">
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#a8865a]">
                  {draft.id ? "Edit the pair" : "Add to the catalogue"}
                </p>
                <h2 className="mt-1 font-display text-xl text-[#221b15]">
                  {draft.id ? draft.name || "Untitled pair" : "New pair"}
                </h2>
              </div>
              <button type="button" onClick={() => setDraft(null)} className="text-[#a19683] hover:text-[#221b15]">✕</button>
            </div>

            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="crm-label">Style name</label>
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="crm-input" placeholder="Bandung Toe-Cap" />
              </div>
              <div>
                <label className="crm-label">Model</label>
                <input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Collection</label>
                <input value={draft.collectionName} onChange={(event) => setDraft({ ...draft, collectionName: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Leather</label>
                <input value={draft.leather} onChange={(event) => setDraft({ ...draft, leather: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Colorway</label>
                <input value={draft.colorway} onChange={(event) => setDraft({ ...draft, colorway: event.target.value })} className="crm-input" placeholder="Olive Grove" />
              </div>
              <div>
                <label className="crm-label">Price (IDR)</label>
                <input required type="number" min={1} step={50000} value={draft.priceIdr} onChange={(event) => setDraft({ ...draft, priceIdr: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Pairs on the shelf</label>
                <input type="number" min={0} value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} className="crm-input" />
              </div>
              <div>
                <label className="crm-label">Catalogue status</label>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="crm-input">
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>{productStatusLabels[status]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="crm-label">Size run</label>
                <input value={draft.sizes} onChange={(event) => setDraft({ ...draft, sizes: event.target.value })} className="crm-input" placeholder="39,40,41,42,43" />
              </div>
              <div className="sm:col-span-2">
                <label className="crm-label">Photograph</label>
                <select value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} className="crm-input">
                  {images.map((image) => (
                    <option key={image.value} value={image.value}>{image.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="crm-label">Storefront description</label>
                <textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="crm-input resize-none" placeholder="What makes this pair worth the wait?" />
              </div>
              <label className="flex items-center gap-2 text-[0.74rem] text-[#5f5548] sm:col-span-2">
                <input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} className="h-4 w-4 accent-[#7a5a2e]" />
                Feature this pair on the storefront
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-crm-line px-5 py-4">
              <p className="text-[0.64rem] text-[#a19683]">
                Sold out is shown automatically when a ready pair hits zero stock.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDraft(null)} className="rounded-lg border border-crm-line px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a7062]">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-ink px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink-3 disabled:opacity-60">
                  {saving ? "Saving…" : draft.id ? "Save changes" : "Add pair"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
